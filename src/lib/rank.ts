/**
 * Hierarchical ranking: family first, then only the best families' species.
 *
 * A photo's feature is compared with one embedding per family. The best
 * families' species shards are loaded (lazily, and cached by the caller) and
 * every species in them is scored. Cosine is the honest signal; a softmax at
 * CLIP's logit scale of 100 turns the candidates into percentages.
 *
 * When no single species is convincing, the answer falls back to the genus or
 * family that holds most of the probability: "a kind of honeyeater" beats a
 * confident wrong species.
 */
import { cosines, type Table } from './table.ts';

export interface Family {
  name: string;
  class: string;
  order: string;
  /** Index of the family's first species in the kingdom's global order. */
  offset: number;
  count: number;
}

/** One species row in a shard: [scientific name, common name or null, iNaturalist taxon id]. */
export type SpeciesRow = [string, string | null, number];

export interface Shard {
  table: Table;
  rows: SpeciesRow[];
}

export interface Guess {
  scientific: string;
  common: string | null;
  genus: string;
  family: string;
  order: string;
  class: string;
  inatId: number;
  score: number;
  cosine: number;
}

export type Verdict =
  | { level: 'species' }
  | { level: 'genus' | 'family'; name: string; share: number }
  | { level: 'unsure' };

export interface Ranking {
  guesses: Guess[];
  verdict: Verdict;
  familiesSearched: string[];
}

/** How many families' species are scored. Measured on the test photos: 20 finds every one, 5 and 10 miss some. */
export const SEARCH_FAMILIES = 20;
export const LOGIT_SCALE = 100;
/** A species answer needs both: the photo really looks like the name, and it beats the rest. */
export const MIN_COSINE = 0.72;
export const MIN_SHARE = 0.8;
/** Below these, a genus or family answer is not offered either. */
export const MIN_COSINE_GENUS = 0.66;
export const MIN_COSINE_FAMILY = 0.62;

/** Which families have at least one species in the mask. All of them without a mask. */
export function familiesInMask(families: readonly Family[], mask?: Uint8Array | null): Uint8Array {
  const out = new Uint8Array(families.length);
  families.forEach((f, i) => {
    if (!mask) {
      out[i] = 1;
      return;
    }
    for (let s = f.offset; s < f.offset + f.count; s++) {
      if (mask[s]) {
        out[i] = 1;
        return;
      }
    }
  });
  return out;
}

/** Indices of the k highest finite scores, best first. */
export function topIndices(scores: ArrayLike<number>, k: number): number[] {
  const idx: number[] = [];
  for (let i = 0; i < scores.length; i++) {
    const s = scores[i]!;
    if (!Number.isFinite(s)) continue;
    if (idx.length < k) {
      idx.push(i);
      idx.sort((a, b) => scores[b]! - scores[a]!);
    } else if (s > scores[idx[k - 1]!]!) {
      idx[k - 1] = i;
      idx.sort((a, b) => scores[b]! - scores[a]!);
    }
  }
  return idx;
}

export function verdictOf(guesses: readonly Guess[], all: readonly Guess[]): Verdict {
  const top = guesses[0];
  if (!top) return { level: 'unsure' };
  if (top.cosine >= MIN_COSINE && top.score >= MIN_SHARE) return { level: 'species' };
  const share = (key: 'genus' | 'family'): [string, number] => {
    const m = new Map<string, number>();
    for (const g of all) m.set(g[key], (m.get(g[key]) ?? 0) + g.score);
    let best: [string, number] = ['', 0];
    for (const e of m) if (e[1] > best[1]) best = e;
    return best;
  };
  const [genus, gShare] = share('genus');
  if (gShare >= MIN_SHARE && top.cosine >= MIN_COSINE_GENUS) return { level: 'genus', name: genus, share: gShare };
  const [family, fShare] = share('family');
  if (fShare >= MIN_SHARE && top.cosine >= MIN_COSINE_FAMILY) return { level: 'family', name: family, share: fShare };
  return { level: 'unsure' };
}

export async function rank(opts: {
  feature: Float32Array;
  families: readonly Family[];
  familyTable: Table;
  loadShard: (family: number) => Promise<Shard>;
  mask?: Uint8Array | null;
  allowedFamilies?: Uint8Array;
  searchFamilies?: number;
  top?: number;
}): Promise<Ranking> {
  const { feature, families, familyTable, loadShard, mask } = opts;
  const allowed = opts.allowedFamilies ?? familiesInMask(families, mask);
  const famCos = cosines(feature, familyTable, (r) => allowed[r] === 1);
  const picked = topIndices(famCos, opts.searchFamilies ?? SEARCH_FAMILIES);

  const shards = await Promise.all(picked.map((f) => loadShard(f)));
  const cands: Omit<Guess, 'score'>[] = [];
  picked.forEach((f, k) => {
    const fam = families[f]!;
    const shard = shards[k]!;
    const keep = mask ? (r: number) => mask[fam.offset + r] === 1 : undefined;
    const cos = cosines(feature, shard.table, keep);
    cos.forEach((c, r) => {
      if (!Number.isFinite(c)) return;
      const [scientific, common, inatId] = shard.rows[r]!;
      cands.push({
        scientific,
        common,
        inatId,
        cosine: c,
        genus: scientific.split(' ')[0]!,
        family: fam.name,
        order: fam.order,
        class: fam.class,
      });
    });
  });

  let max = Number.NEGATIVE_INFINITY;
  for (const c of cands) max = Math.max(max, c.cosine);
  let sum = 0;
  const ex = cands.map((c) => {
    const e = Math.exp(LOGIT_SCALE * (c.cosine - max));
    sum += e;
    return e;
  });
  const all: Guess[] = cands.map((c, i) => ({ ...c, score: ex[i]! / sum })).sort((a, b) => b.score - a.score);
  const guesses = all.slice(0, opts.top ?? 3);
  return { guesses, verdict: verdictOf(guesses, all), familiesSearched: picked.map((f) => families[f]!.name) };
}
