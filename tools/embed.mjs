// node embed.mjs <fauna|flora> [template=tax] [workers=7] [threadsPerWorker=2]
// Embeds every species name (and every family) with BioCLIP 2's text encoder.
// Runs several encoder sessions in worker threads, in chunks of 2000 names,
// writing .cache/emb/<kingdom>-<template>/<chunk>.f32. Resumable: finished
// chunks are skipped. Needs build-list first.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { join } from 'node:path';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { DIM, TEMPLATES, familyText, textEncoder } from './lib/encoder.mjs';
import { CACHE } from './lib/paths.mjs';

export const CHUNK = 2000;

if (!isMainThread) {
  const encode = await textEncoder(workerData.threads, workerData.ep);
  parentPort.on('message', async ({ chunk, texts, out }) => {
    const buf = new Float32Array(texts.length * DIM);
    for (let i = 0; i < texts.length; i++) buf.set(await encode(texts[i]), i * DIM);
    writeFileSync(out, Buffer.from(buf.buffer));
    parentPort.postMessage({ chunk });
  });
} else {
  const [key, template = 'tax', workersArg, threadsArg] = process.argv.slice(2);
  if (!key) throw new Error('usage: node embed.mjs <fauna|flora> [template] [workers] [threads]');
  const list = JSON.parse(readFileSync(join(CACHE, `list-${key}.json`), 'utf8'));
  const subset = process.env.FW_SUBSET ? new Set(JSON.parse(readFileSync(process.env.FW_SUBSET, 'utf8'))) : null;
  const rows = subset ? list.filter((r) => subset.has(r.family)) : list;
  const dir = join(CACHE, 'emb', `${key}-${template}${subset ? '-subset' : ''}`);
  mkdirSync(dir, { recursive: true });

  // Families first (one text each), then species in list order.
  const fams = [];
  const seen = new Set();
  for (const r of rows) if (!seen.has(r.family)) { seen.add(r.family); fams.push({ kingdom: r.kingdom, phylum: r.phylum, class: r.class, order: r.order, name: r.family }); }
  const jobs = [];
  const famFile = join(dir, 'families.f32');
  if (!existsSync(famFile)) jobs.push({ chunk: 'families', texts: fams.map(familyText), out: famFile });
  for (let c = 0; c * CHUNK < rows.length; c++) {
    const out = join(dir, `${String(c).padStart(4, '0')}.f32`);
    if (!existsSync(out)) jobs.push({ chunk: c, texts: rows.slice(c * CHUNK, (c + 1) * CHUNK).map(TEMPLATES[template]), out });
  }
  writeFileSync(join(dir, 'meta.json'), JSON.stringify({ count: rows.length, families: fams.length, template, chunk: CHUNK }));
  const total = jobs.length;
  console.log(`${key}/${template}: ${rows.length} species, ${fams.length} families, ${total} chunks to do`);
  if (total) {
    const nWorkers = Math.min(total, Number(workersArg ?? Math.max(1, Math.floor(cpus().length / 2) - 1)));
    const threads = Number(threadsArg ?? 2);
    const t0 = Date.now();
    let done = 0;
    // FW_DML=1 adds a GPU worker (DirectML) beside the CPU workers.
    const eps = [...(process.env.FW_DML ? ['dml'] : []), ...Array(nWorkers).fill('cpu')];
    await Promise.all(eps.map((ep) => new Promise((resolve, reject) => {
      const w = new Worker(new URL(import.meta.url), { workerData: { threads, ep } });
      const next = () => {
        const job = jobs.shift();
        if (!job) { w.terminate(); resolve(); return; }
        w.postMessage(job);
      };
      w.on('message', () => {
        done++;
        const rate = (Date.now() - t0) / done;
        console.log(`${key}: ${done}/${total} chunks, ~${Math.round((rate * (total - done)) / 60000)} min left`);
        next();
      });
      w.on('error', reject);
      w.once('online', next);
    })));
  }
  console.log(`${key}/${template}: embedded`);
}
