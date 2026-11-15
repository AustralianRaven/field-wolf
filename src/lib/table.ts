/**
 * Embedding tables, as the data builder writes them: n rows of `dim` int8
 * values, then n float32 scales. Row r's real vector is int8[r] * scale[r],
 * and every row was L2-normalised before quantising.
 */
export interface Table {
  n: number;
  dim: number;
  q: Int8Array;
  scale: Float32Array;
}

export function readTable(buf: ArrayBuffer, dim: number): Table {
  const bytesPerRow = dim + 4;
  if (buf.byteLength % bytesPerRow !== 0) throw new Error(`Table size ${buf.byteLength} is not a whole number of ${dim}-d rows`);
  const n = buf.byteLength / bytesPerRow;
  return { n, dim, q: new Int8Array(buf, 0, n * dim), scale: new Float32Array(buf, n * dim, n) };
}

/** Quantise L2-normalised float rows into the on-disk layout. The data builder and the tests use this. */
export function writeTable(rows: ArrayLike<number>[], dim: number): Uint8Array {
  const n = rows.length;
  const out = new Uint8Array(n * dim + n * 4);
  const q = new Int8Array(out.buffer, 0, n * dim);
  const scale = new Float32Array(out.buffer, n * dim, n);
  rows.forEach((row, r) => {
    let max = 0;
    for (let i = 0; i < dim; i++) max = Math.max(max, Math.abs(row[i]!));
    const s = max / 127 || 1;
    scale[r] = s;
    for (let i = 0; i < dim; i++) q[r * dim + i] = Math.round(row[i]! / s);
  });
  return out;
}

/** Cosine of an L2-normalised feature with each row (rows are normalised too). Optional row filter. */
export function cosines(feature: Float32Array, t: Table, keep?: (row: number) => boolean): Float32Array {
  const out = new Float32Array(t.n).fill(Number.NEGATIVE_INFINITY);
  const { dim, q, scale } = t;
  for (let r = 0; r < t.n; r++) {
    if (keep && !keep(r)) continue;
    let d = 0;
    const o = r * dim;
    for (let i = 0; i < dim; i++) d += feature[i]! * q[o + i]!;
    out[r] = d * scale[r]!;
  }
  return out;
}

export function normalise(v: ArrayLike<number>): Float32Array {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i]! * v[i]!;
  n = Math.sqrt(n) || 1;
  return Float32Array.from(v, (x) => x / n);
}
