import { describe, expect, it } from 'vitest';

import type { Region } from './data.ts';
import { rangeOf, type World } from './range.ts';

const regions: Region[] = [
  { id: 97390, name: 'Antarctica', continent: null, count: 10 },
  { id: 6744, name: 'Australia', continent: 97393, count: 100 },
  { id: 8, name: 'Guadeloupe', continent: 97394, count: 5 },
  { id: 9, name: 'Martinique', continent: 97394, count: 5 },
  { id: 6803, name: 'New Zealand', continent: 97393, count: 50 },
  { id: 97393, name: 'Oceania', continent: null, count: 120 },
];
const world: World = {
  w: 10,
  h: 5,
  shapes: [
    { places: [6744], d: 'M0 0' },
    { places: [6803], d: 'M1 1' },
    { places: [97390], d: 'M2 2' },
    { places: [], d: 'M3 3' },
  ],
};

describe('rangeOf', () => {
  it('Given a species only seen in Australia, when mapped, then only Australia is shaded', () => {
    const r = rangeOf([1], regions, world);
    expect([...r.shaded], 'Then only the Australia outline should be shaded').toEqual([0]);
    expect(r.countries, 'And it should count one country').toBe(1);
    expect(r.offMap, 'And nothing should be off the map').toEqual([]);
  });

  it('Given a species seen in Australia, New Zealand and Antarctica, when mapped, then all three are shaded', () => {
    const r = rangeOf([0, 1, 4], regions, world);
    expect([...r.shaded].sort(), 'Then all three outlines should be shaded').toEqual([0, 1, 2]);
    expect(r.countries, 'And Antarctica should not count as a country').toBe(2);
  });

  it('Given a species seen in places with no outline, when mapped, then they are listed by name', () => {
    const r = rangeOf([3, 2, 1], regions, world);
    expect(r.offMap, 'Then the islands should be listed alphabetically').toEqual(['Guadeloupe', 'Martinique']);
    expect(r.countries, 'And every place should count').toBe(3);
  });

  it.each([
    ['no records', []],
    ['an index past the end of regions.json', [99]],
  ])('Given %s, when mapped, then nothing is shaded', (_label, seenIn) => {
    const r = rangeOf(seenIn, regions, world);
    expect(r.shaded.size, 'Then no outline should be shaded').toBe(0);
    expect(r.countries, 'And it should count no countries').toBe(0);
  });
});
