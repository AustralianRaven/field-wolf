import { describe, expect, it } from 'vitest';

import { familiesInMask, rank, topIndices, verdictOf, type Family, type Guess, type Shard } from './rank.ts';
import { normalise, readTable, writeTable } from './table.ts';

const DIM = 8;
const axis = (i: number) => {
  const v = new Array<number>(DIM).fill(0);
  v[i] = 1;
  return normalise(v);
};
const tableOf = (rows: Float32Array[]) => {
  const b = writeTable(rows, DIM);
  return readTable(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer, DIM);
};

// Two families: Alcedinidae (species on axes 0 and 1) and Anatidae (axes 4 and 5).
const families: Family[] = [
  { name: 'Alcedinidae', class: 'Aves', order: 'Coraciiformes', offset: 0, count: 2 },
  { name: 'Anatidae', class: 'Aves', order: 'Anseriformes', offset: 2, count: 2 },
];
const familyTable = tableOf([normalise([1, 1, 0, 0, 0, 0, 0, 0]), normalise([0, 0, 0, 0, 1, 1, 0, 0])]);
const shards: Shard[] = [
  {
    table: tableOf([axis(0), axis(1)]),
    rows: [
      ['Dacelo novaeguineae', 'Laughing Kookaburra', 2413],
      ['Dacelo leachii', 'Blue-winged Kookaburra', 2414],
    ],
  },
  {
    table: tableOf([axis(4), axis(5)]),
    rows: [
      ['Anas superciliosa', 'Pacific Black Duck', 6],
      ['Anas gracilis', 'Grey Teal', 7],
    ],
  },
];
const loadShard = async (f: number) => shards[f]!;

describe('rank', () => {
  it('Given a kookaburra-like photo, when ranked, then the kookaburra is first and confident', async () => {
    const r = await rank({ feature: axis(0), families, familyTable, loadShard, searchFamilies: 1 });
    expect(r.guesses[0]?.common, 'top guess should be the kookaburra').toBe('Laughing Kookaburra');
    expect(r.guesses[0]?.family, 'family should come from the family list').toBe('Alcedinidae');
    expect(r.verdict.level, 'an exact match should be a species-level answer').toBe('species');
    expect(r.familiesSearched, 'only the best family should be searched').toEqual(['Alcedinidae']);
  });

  it('Given a region mask without kookaburras, when ranked, then only species in the region are offered', async () => {
    const mask = new Uint8Array([0, 0, 1, 1]);
    const r = await rank({ feature: axis(0), families, familyTable, loadShard, mask, searchFamilies: 2 });
    expect(r.familiesSearched, 'families with no species in the region should be skipped').toEqual(['Anatidae']);
    expect(r.guesses.every((g) => g.family === 'Anatidae'), 'every guess should be in the region').toBe(true);
  });

  it('Given a photo between two congeners, when ranked, then the answer falls back to the genus', async () => {
    const between = normalise([1, 1, 0, 0, 0, 0, 0, 0]);
    const r = await rank({ feature: between, families, familyTable, loadShard, searchFamilies: 2 });
    expect(r.verdict, 'two equally likely Dacelo should give a genus answer').toMatchObject({ level: 'genus', name: 'Dacelo' });
  });
});

describe('helpers', () => {
  it('Given scores with -Infinity, when picking the top two, then filtered rows are skipped', () => {
    expect(topIndices([0.1, Number.NEGATIVE_INFINITY, 0.9, 0.5], 2)).toEqual([2, 3]);
  });

  it('Given a mask, when listing families in it, then only families with a member are marked', () => {
    expect(Array.from(familiesInMask(families, new Uint8Array([0, 1, 0, 0])))).toEqual([1, 0]);
    expect(Array.from(familiesInMask(families, null)), 'no mask means every family').toEqual([1, 1]);
  });

  it('Given a weak top match, when judged, then the verdict is unsure', () => {
    const g: Guess = { scientific: 'A b', common: null, genus: 'A', family: 'F', order: 'O', class: 'C', inatId: 1, score: 0.4, cosine: 0.5 };
    const other: Guess = { ...g, scientific: 'C d', genus: 'C', family: 'G', score: 0.6 };
    expect(verdictOf([g], [g, other]).level).toBe('unsure');
  });
});
