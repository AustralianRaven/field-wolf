// node pack.mjs <fauna|flora> [template=tax] [familyMode=text] [outDir]
// Packs embeddings into the files the app downloads:
//   meta.json       counts, template, version hash, attribution
//   families.json   [{ name, class, order, offset, count }] in table order
//   families.bin    one int8 row per family (see src/lib/table.ts)
//   shards/<f>.bin  one int8 row per species in family f
//   shards/<f>.json [[scientific, common, inatId], ...], row-aligned with the .bin
//   names.json      [[scientific, common], ...] for every species, in global order (the help page's search)
//   regions/<id>.bin  species in a country or continent, as varint gaps (src/lib/varint.ts)
// familyMode: "text" embeds the family's taxonomy string, "mean" averages its species, "mix" adds both.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIM, normalise } from './lib/encoder.mjs';
import { CACHE, PUBLIC_DATA } from './lib/paths.mjs';
import { writeTable } from '../src/lib/table.ts';
import { encodeIndices } from '../src/lib/varint.ts';

const [key, template = 'tax', familyMode = 'text', outArg] = process.argv.slice(2);
if (!key) throw new Error('usage: node pack.mjs <fauna|flora> [template] [familyMode] [outDir]');
const subset = process.env.FW_SUBSET ? new Set(JSON.parse(readFileSync(process.env.FW_SUBSET, 'utf8'))) : null;
const list = JSON.parse(readFileSync(join(CACHE, `list-${key}.json`), 'utf8')).filter((r) => !subset || subset.has(r.family));
const embDir = join(CACHE, 'emb', `${key}-${template}${subset ? '-subset' : ''}`);
const out = outArg ?? join(PUBLIC_DATA, key);

const chunks = readdirSync(embDir).filter((f) => /^\d{4}\.f32$/.test(f)).sort();
const emb = new Float32Array(list.length * DIM);
let at = 0;
for (const c of chunks) {
  const b = readFileSync(join(embDir, c));
  const f = new Float32Array(b.buffer, b.byteOffset, b.byteLength / 4);
  emb.set(f, at);
  at += f.length;
}
if (at !== emb.length) throw new Error(`Embedded ${at / DIM} rows for ${list.length} species: run embed.mjs to finish`);
const row = (i) => emb.subarray(i * DIM, (i + 1) * DIM);

// Families, in list order (build-list sorted species so each family is contiguous).
const families = [];
for (let i = 0; i < list.length; i++) {
  const r = list[i];
  const last = families[families.length - 1];
  if (last && last.name === r.family) last.count++;
  else families.push({ name: r.family, class: r.class ?? '', order: r.order ?? '', offset: i, count: 1 });
}
const famText = readFileSync(join(embDir, 'families.f32'));
const famTextF = new Float32Array(famText.buffer, famText.byteOffset, famText.byteLength / 4);
if (famTextF.length !== families.length * DIM) throw new Error('families.f32 does not match the family list');
const famRows = families.map((f, k) => {
  const text = famTextF.subarray(k * DIM, (k + 1) * DIM);
  if (familyMode === 'text') return text;
  const m = new Float32Array(DIM);
  for (let i = f.offset; i < f.offset + f.count; i++) { const v = row(i); for (let d = 0; d < DIM; d++) m[d] += v[d]; }
  normalise(m);
  if (familyMode === 'mean') return m;
  for (let d = 0; d < DIM; d++) m[d] += text[d];
  return normalise(m);
});

if (existsSync(out)) rmSync(out, { recursive: true });
mkdirSync(join(out, 'shards'), { recursive: true });
writeFileSync(join(out, 'families.bin'), writeTable(famRows, DIM));
writeFileSync(join(out, 'families.json'), JSON.stringify(families));
families.forEach((f, k) => {
  const rows = [];
  const json = [];
  for (let i = f.offset; i < f.offset + f.count; i++) {
    rows.push(row(i));
    json.push([list[i].sci, list[i].common ?? null, list[i].id]);
  }
  writeFileSync(join(out, 'shards', `${k}.bin`), writeTable(rows, DIM));
  writeFileSync(join(out, 'shards', `${k}.json`), JSON.stringify(json));
});
writeFileSync(join(out, 'names.json'), JSON.stringify(list.map((r) => (r.common ? [r.sci, r.common] : [r.sci]))));

// Regions: countries from fetch-regions, continents as the union of their countries (Antarctica fetched directly).
const regionDir = join(CACHE, 'regions');
const regions = [];
if (existsSync(join(regionDir, 'countries.json')) && !subset) {
  const index = new Map(list.map((r, i) => [r.id, i]));
  const countries = JSON.parse(readFileSync(join(regionDir, 'countries.json'), 'utf8'));
  const CONT = { 97392: 'Africa', 97390: 'Antarctica', 97395: 'Asia', 97391: 'Europe', 97394: 'North America', 97393: 'Oceania', 97389: 'South America' };
  mkdirSync(join(out, 'regions'), { recursive: true });
  const unions = new Map(Object.keys(CONT).map((c) => [Number(c), new Set()]));
  const write = (id, set) => {
    const sorted = [...set].sort((a, b) => a - b);
    writeFileSync(join(out, 'regions', `${id}.bin`), encodeIndices(sorted));
    return sorted.length;
  };
  for (const c of countries) {
    const f = join(regionDir, `${c.id}-${key}.json`);
    if (!existsSync(f)) continue;
    const set = new Set();
    for (const id of JSON.parse(readFileSync(f, 'utf8'))) { const i = index.get(id); if (i !== undefined) set.add(i); }
    if (!set.size) continue;
    for (const i of set) unions.get(c.continent).add(i);
    regions.push({ id: c.id, name: c.name, continent: c.continent, count: write(c.id, set) });
  }
  const ant = join(regionDir, `97390-${key}.json`);
  if (existsSync(ant)) for (const id of JSON.parse(readFileSync(ant, 'utf8'))) { const i = index.get(id); if (i !== undefined) unions.get(97390).add(i); }
  for (const [id, set] of unions) if (set.size) regions.push({ id, name: CONT[id], continent: null, count: write(id, set) });
  regions.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(join(out, 'regions.json'), JSON.stringify(regions));
}

const version = createHash('sha256').update(JSON.stringify([template, familyMode, list.map((r) => r.id)])).digest('hex').slice(0, 12);
writeFileSync(join(out, 'meta.json'), JSON.stringify({
  kingdom: key, version, count: list.length, families: families.length, dim: DIM, template, familyMode,
  regions: regions.length, builtAt: new Date().toISOString().slice(0, 10),
  source: 'Species with research-grade observations on iNaturalist (inaturalist.org); taxonomy from the iNaturalist taxonomy export.',
}, null, 2) + '\n');
console.log(`${key}: packed ${list.length} species, ${families.length} families, ${regions.length} regions into ${out} (version ${version})`);
