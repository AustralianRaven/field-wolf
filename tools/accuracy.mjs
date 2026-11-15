// node accuracy.mjs [dataDir=public/data] [searchFamilies=5]
// Identifies the 20 test photos (e2e/fixtures/photos) offline, with the same
// INT8 image encoder and the same ranking code as the browser, against the
// packed tables. Checks each photo twice: region "Everywhere", and restricted
// to its continent. Exits non-zero if any photo misses its species in the top 3.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIM, imageEncoder } from './lib/encoder.mjs';
import { PUBLIC_DATA, REPO } from './lib/paths.mjs';
import { rank } from '../src/lib/rank.ts';
import { readTable } from '../src/lib/table.ts';
import { decodeIndices, maskOf } from '../src/lib/varint.ts';

const dataDir = process.argv[2] ?? PUBLIC_DATA;
const searchFamilies = Number(process.argv[3] ?? 20);
const photosDir = join(REPO, 'e2e', 'fixtures', 'photos');
const photos = JSON.parse(readFileSync(join(photosDir, 'photos.json'), 'utf8'));
const CONT = { Africa: 97392, Antarctica: 97390, Asia: 97395, Europe: 97391, 'North America': 97394, Oceania: 97393, 'South America': 97389 };

const buf = (f) => { const b = readFileSync(f); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); };
const kingdoms = {};
for (const key of ['fauna', 'flora']) {
  const dir = join(dataDir, key);
  if (!existsSync(join(dir, 'meta.json'))) continue;
  const families = JSON.parse(readFileSync(join(dir, 'families.json'), 'utf8'));
  const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
  const cache = new Map();
  kingdoms[key] = {
    meta, families, familyTable: readTable(buf(join(dir, 'families.bin')), DIM),
    loadShard: async (f) => {
      if (!cache.has(f)) cache.set(f, { table: readTable(buf(join(dir, 'shards', `${f}.bin`)), DIM), rows: JSON.parse(readFileSync(join(dir, 'shards', `${f}.json`), 'utf8')) });
      return cache.get(f);
    },
    mask: (placeId) => {
      const f = join(dir, 'regions', `${placeId}.bin`);
      return existsSync(f) ? maskOf(decodeIndices(new Uint8Array(readFileSync(f))), meta.count) : null;
    },
  };
}

const encode = await imageEncoder(8);
let misses = 0;
let top1 = 0;
const lines = [];
for (const p of photos) {
  const k = kingdoms[p.kingdom];
  if (!k) continue;
  const feature = await encode(join(photosDir, p.file));
  for (const where of ['Everywhere', p.continent]) {
    const mask = where === 'Everywhere' ? null : k.mask(CONT[where]);
    if (where !== 'Everywhere' && !mask) continue;
    const r = await rank({ feature, families: k.families, familyTable: k.familyTable, loadShard: k.loadShard, mask, searchFamilies });
    // The species itself or one of its subspecies; never a hybrid ("Pavo cristatus × muticus").
    const pos = r.guesses.findIndex((g) => g.scientific === p.scientific || (g.scientific.startsWith(p.scientific + ' ') && !g.scientific.includes('×')));
    if (pos < 0) misses++;
    if (pos === 0 && where === 'Everywhere') top1++;
    const g = r.guesses[0];
    lines.push(`${pos === 0 ? 'OK  ' : pos > 0 ? `#${pos + 1}  ` : 'MISS'} ${p.scientific.padEnd(24)} ${where.padEnd(13)} -> ${g?.scientific} (${g?.common ?? '-'}) ${(g?.score * 100).toFixed(0)}% cos ${g?.cosine.toFixed(3)} ${r.verdict.level}${pos < 0 ? `  [families: ${r.familiesSearched.join(', ')}]` : ''}`);
  }
}
console.log(lines.join('\n'));
console.log(`\ntop-1 (Everywhere): ${top1}/${photos.filter((p) => kingdoms[p.kingdom]).length}; checks missing the top 3: ${misses}`);
process.exitCode = misses ? 1 : 0;
