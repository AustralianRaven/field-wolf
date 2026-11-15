import { describe, expect, it } from 'vitest';

import { decodeIndices, encodeIndices, maskOf } from './varint.ts';

describe('varint region lists', () => {
  it('Given sorted indices with big gaps, when encoded and decoded, then they round-trip', () => {
    const ids = [0, 1, 127, 128, 300, 20000, 302594];
    expect(Array.from(decodeIndices(encodeIndices(ids)))).toEqual(ids);
  });

  it('Given unsorted indices, when encoded, then it refuses', () => {
    expect(() => encodeIndices([5, 3])).toThrow();
  });

  it('Given indices, when masked, then only those positions are set', () => {
    expect(Array.from(maskOf([1, 3], 5))).toEqual([0, 1, 0, 1, 0]);
  });
});
