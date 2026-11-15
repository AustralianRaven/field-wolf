/**
 * The analyser, in a worker so the page stays responsive.
 *
 * Runs BioCLIP 2's INT8 image encoder with ONNX Runtime Web (WebAssembly, one
 * thread: GitHub Pages cannot send the headers multi-threading needs, and one
 * thread is a few seconds a photo). The model comes from the Cache API, put
 * there by /setup. Photos never leave the browser.
 */
import * as ort from 'onnxruntime-web/wasm';
// ONNX Runtime loads these at runtime. Imported as URLs so Vite serves and fingerprints them.
import ortMjsUrl from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url';
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';

import { cachedFetch } from '../cache';
import { DIM, MODEL_CACHE, MODEL_URL, dataUrl, type Kingdom } from '../config';
import { loadFamilies, loadMeta, loadShardRows, type Meta } from '../data';
import { familiesInMask, rank, type Family, type Ranking, type Shard } from '../rank';
import { cropRect, type Box } from '../region';
import { normalise, readTable, type Table } from '../table';
import { decodeIndices, maskOf } from '../varint';

export type WorkerIn =
  | { type: 'model'; blob: Blob }
  | { type: 'init'; kingdom: Kingdom }
  | { type: 'identify'; id: number; kingdom: Kingdom; photo: Blob; box: Box | null; region: number | null };

export type WorkerOut =
  | { type: 'ready'; kingdom: Kingdom; count: number }
  | { type: 'result'; id: number; ranking: Ranking; ms: number }
  | { type: 'error'; id: number | null; message: string; notSetUp?: boolean };

const post = (m: WorkerOut) => (self as unknown as Worker).postMessage(m);
const MEAN = [0.48145466, 0.4578275, 0.40821073];
const STD = [0.26862954, 0.26130258, 0.27577711];

interface Loaded {
  meta: Meta;
  families: Family[];
  familyTable: Table;
  shards: Map<number, Promise<Shard>>;
  masks: Map<number, { mask: Uint8Array; families: Uint8Array }>;
}

let session: Promise<ort.InferenceSession> | null = null;
/** The model when the browser could not store it: sent by the page, kept for this tab. */
let sessionModel: Blob | null = null;
const kingdoms = new Map<Kingdom, Promise<Loaded>>();

class NotSetUp extends Error {}

function getSession(): Promise<ort.InferenceSession> {
  session ??= (async () => {
    let hit: Response | undefined;
    try {
      hit = await (await caches.open(MODEL_CACHE)).match(MODEL_URL);
    } catch {
      hit = undefined;
    }
    const bytes = hit ? await hit.arrayBuffer() : sessionModel ? await sessionModel.arrayBuffer() : null;
    if (!bytes) throw new NotSetUp('The ID model is not set up in this browser yet.');
    ort.env.wasm.wasmPaths = { mjs: ortMjsUrl, wasm: ortWasmUrl };
    ort.env.wasm.numThreads = 1;
    return ort.InferenceSession.create(new Uint8Array(bytes), { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
  })();
  session.catch(() => (session = null));
  return session;
}

function getKingdom(k: Kingdom): Promise<Loaded> {
  let p = kingdoms.get(k);
  if (!p) {
    p = (async () => {
      const meta = await loadMeta(k);
      const families = await loadFamilies(k, meta);
      const familyTable = readTable(await (await cachedFetch(dataUrl(k, 'families.bin', meta.version))).arrayBuffer(), DIM);
      return { meta, families, familyTable, shards: new Map(), masks: new Map() };
    })();
    p.catch(() => kingdoms.delete(k));
    kingdoms.set(k, p);
  }
  return p;
}

function shard(k: Kingdom, l: Loaded, f: number): Promise<Shard> {
  let s = l.shards.get(f);
  if (!s) {
    s = (async () => {
      const [bin, rows] = await Promise.all([
        cachedFetch(dataUrl(k, `shards/${f}.bin`, l.meta.version)).then((r) => r.arrayBuffer()),
        loadShardRows(k, l.meta, f),
      ]);
      return { table: readTable(bin, DIM), rows };
    })();
    s.catch(() => l.shards.delete(f));
    l.shards.set(f, s);
  }
  return s;
}

async function regionMask(k: Kingdom, l: Loaded, id: number) {
  let m = l.masks.get(id);
  if (!m) {
    const bytes = new Uint8Array(await (await cachedFetch(dataUrl(k, `regions/${id}.bin`, l.meta.version))).arrayBuffer());
    const mask = maskOf(decodeIndices(bytes), l.meta.count);
    m = { mask, families: familiesInMask(l.families, mask) };
    l.masks.set(id, m);
  }
  return m;
}

/** Cut out the box (the whole photo without one), resize to 224x224 (cover, centred), normalise as CLIP was trained. */
async function preprocess(photo: Blob, box: Box | null): Promise<ort.Tensor> {
  const bmp = await createImageBitmap(photo, { imageOrientation: 'from-image' });
  const src = cropRect(bmp.width, bmp.height, box);
  const s = Math.max(224 / src.w, 224 / src.h);
  const w = src.w * s;
  const h = src.h * s;
  const canvas = new OffscreenCanvas(224, 224);
  const g = canvas.getContext('2d');
  if (!g) throw new Error('This browser cannot draw the photo for analysis.');
  g.imageSmoothingQuality = 'high';
  g.drawImage(bmp, src.x, src.y, src.w, src.h, (224 - w) / 2, (224 - h) / 2, w, h);
  bmp.close();
  const { data } = g.getImageData(0, 0, 224, 224);
  const px = 224 * 224;
  const out = new Float32Array(3 * px);
  for (let i = 0; i < px; i++) {
    for (let c = 0; c < 3; c++) out[c * px + i] = (data[i * 4 + c]! / 255 - MEAN[c]!) / STD[c]!;
  }
  return new ort.Tensor('float32', out, [1, 3, 224, 224]);
}

async function identify(msg: Extract<WorkerIn, { type: 'identify' }>): Promise<void> {
  const t0 = performance.now();
  const [sess, l] = await Promise.all([getSession(), getKingdom(msg.kingdom)]);
  const out = await sess.run({ image: await preprocess(msg.photo, msg.box) });
  const feat = out.image_features?.data as Float32Array | undefined;
  if (!feat) throw new Error('The model returned no features.');
  const region = msg.region === null ? null : await regionMask(msg.kingdom, l, msg.region);
  const ranking = await rank({
    feature: normalise(feat),
    families: l.families,
    familyTable: l.familyTable,
    loadShard: (f) => shard(msg.kingdom, l, f),
    mask: region?.mask ?? null,
    allowedFamilies: region?.families,
  });
  post({ type: 'result', id: msg.id, ranking, ms: Math.round(performance.now() - t0) });
}

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  const msg = e.data;
  if (msg.type === 'model') {
    sessionModel = msg.blob;
    return;
  }
  const work =
    msg.type === 'init'
      ? Promise.all([getSession(), getKingdom(msg.kingdom)]).then(([, l]) => post({ type: 'ready', kingdom: msg.kingdom, count: l.meta.count }))
      : identify(msg);
  work.catch((err: unknown) =>
    post({
      type: 'error',
      id: msg.type === 'identify' ? msg.id : null,
      message: err instanceof Error ? err.message : String(err),
      notSetUp: err instanceof NotSetUp,
    }),
  );
};
