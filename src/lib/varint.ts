/**
 * Region species lists: sorted species indices, stored as LEB128 varints of
 * the gaps between them. Australia's ~40k animals fit in about 60 KB.
 */
export function encodeIndices(sorted: readonly number[]): Uint8Array {
  const out: number[] = [];
  let prev = -1;
  for (const v of sorted) {
    let gap = v - prev;
    if (gap <= 0) throw new Error('Indices must be strictly increasing');
    prev = v;
    while (gap >= 0x80) {
      out.push((gap & 0x7f) | 0x80);
      gap >>>= 7;
    }
    out.push(gap);
  }
  return Uint8Array.from(out);
}

export function decodeIndices(bytes: Uint8Array): Uint32Array {
  const out: number[] = [];
  let prev = -1;
  let gap = 0;
  let shift = 0;
  for (const b of bytes) {
    gap |= (b & 0x7f) << shift;
    if (b & 0x80) {
      shift += 7;
      continue;
    }
    prev += gap;
    out.push(prev);
    gap = 0;
    shift = 0;
  }
  return Uint32Array.from(out);
}

/** A membership mask over `size` species from decoded indices. */
export function maskOf(indices: ArrayLike<number>, size: number): Uint8Array {
  const m = new Uint8Array(size);
  for (let i = 0; i < indices.length; i++) m[indices[i]!] = 1;
  return m;
}
