// node fetch-models.mjs
// Downloads BioCLIP 2 into .cache/bioclip (about 770 MB, git-ignored):
//   vision.int8.onnx: the image encoder the browser runs (mahan-ym/bioclip-2-quantized, MIT)
//   text.fp32.onnx + tokenizer: the text encoder, only used here to build tables (Lumilio-Photos/bioclip-2)
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { MODEL_DIR } from './lib/encoder.mjs';

mkdirSync(MODEL_DIR, { recursive: true });
const FILES = [
  ['vision.int8.onnx', 'mahan-ym/bioclip-2-quantized', 'onnx/bioclip2_model_int8.onnx'],
  ['text.fp32.onnx', 'Lumilio-Photos/bioclip-2', 'onnx/text.fp32.onnx'],
  ...['tokenizer.json', 'tokenizer_config.json', 'special_tokens_map.json', 'vocab.json', 'merges.txt'].map((f) => [f, 'Lumilio-Photos/bioclip-2', f]),
];
for (const [name, repo, path] of FILES) {
  const out = join(MODEL_DIR, name);
  if (existsSync(out)) { console.log(`have ${name}`); continue; }
  const res = await fetch(`https://huggingface.co/${repo}/resolve/main/${path}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(out));
  console.log(`got ${name}`);
}
