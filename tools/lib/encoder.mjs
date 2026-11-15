// BioCLIP 2 encoders for Node: the text encoder (to build tables) and the
// INT8 image encoder (to test accuracy offline, exactly as the browser does).
import { join } from 'node:path';
import ort from 'onnxruntime-node';
import sharp from 'sharp';
import { AutoTokenizer, env } from '@huggingface/transformers';
import { CACHE } from './paths.mjs';

export const MODEL_DIR = join(CACHE, 'bioclip');
export const DIM = 768;

function toF32(t) {
  if (t.type === 'float32') return Float32Array.from(t.data);
  const src = t.data instanceof Uint16Array ? t.data : new Uint16Array(t.data.buffer, t.data.byteOffset, t.data.length);
  const out = new Float32Array(src.length);
  for (let i = 0; i < src.length; i++) {
    const h = src[i], s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
    out[i] = e === 0 ? s * 2 ** -14 * (f / 1024) : e === 31 ? (f ? NaN : s * Infinity) : s * 2 ** (e - 15) * (1 + f / 1024);
  }
  return out;
}

export function normalise(v) {
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= n;
  return v;
}

export async function textEncoder(threads = 2, ep = 'cpu') {
  env.localModelPath = CACHE;
  env.allowRemoteModels = false;
  const tok = await AutoTokenizer.from_pretrained('bioclip');
  // fp32 is faster than fp16 on both CPU and DirectML here. ep "dml" runs it on the GPU (Windows).
  const session = await ort.InferenceSession.create(join(MODEL_DIR, 'text.fp32.onnx'), {
    logSeverityLevel: 3, intraOpNumThreads: threads, interOpNumThreads: 1, executionProviders: [ep],
  });
  return async (text) => {
    const ids = new BigInt64Array(77); // OpenCLIP pads with 0; the export takes a batch of 1
    tok.encode(text).slice(0, 77).forEach((v, i) => (ids[i] = BigInt(v)));
    const out = await session.run({ input_ids: new ort.Tensor('int64', ids, [1, 77]) });
    return normalise(toF32(out.text_features));
  };
}

const MEAN = [0.48145466, 0.4578275, 0.40821073];
const STD = [0.26862954, 0.26130258, 0.27577711];

export async function imageEncoder(threads = 4) {
  const session = await ort.InferenceSession.create(join(MODEL_DIR, 'vision.int8.onnx'), {
    logSeverityLevel: 3, intraOpNumThreads: threads, interOpNumThreads: 1,
  });
  return async (file, box) => {
    let img = sharp(await sharp(file).rotate().toBuffer());
    if (box) {
      const { width, height } = await img.metadata();
      img = img.extract({ left: Math.round(box.x * width), top: Math.round(box.y * height), width: Math.round(box.w * width), height: Math.round(box.h * height) });
    }
    const { data } = await img.resize(224, 224, { fit: 'cover', kernel: 'cubic' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const px = 224 * 224;
    const t = new Float32Array(3 * px);
    for (let i = 0; i < px; i++) for (let c = 0; c < 3; c++) t[c * px + i] = (data[i * 3 + c] / 255 - MEAN[c]) / STD[c];
    const out = await session.run({ image: new ort.Tensor('float32', t, [1, 3, 224, 224]) });
    return normalise(Float32Array.from(out.image_features.data));
  };
}

/** The text each species is embedded as. "tax" is BioCLIP's own taxonomic + common-name format. */
export const TEMPLATES = {
  sci: (s) => (s.common ? `a photo of ${s.sci} with common name ${s.common}.` : `a photo of ${s.sci}.`),
  tax: (s) => {
    const path = [s.kingdom, s.phylum, s.class, s.order, s.family, s.sci].filter(Boolean).join(' ');
    return s.common ? `a photo of ${path} with common name ${s.common}.` : `a photo of ${path}.`;
  },
};
export const familyText = (f) => `a photo of ${[f.kingdom, f.phylum, f.class, f.order, f.name].filter(Boolean).join(' ')}.`;
