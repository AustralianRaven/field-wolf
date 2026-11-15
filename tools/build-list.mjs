// node build-list.mjs
// Joins the iNaturalist species lists with the iNaturalist taxonomy export to
// give every species its phylum, class, order and family, then sorts them so
// each family's species are contiguous. Writes .cache/list-<kingdom>.json.
// Needs fetch-species and the taxonomy export (.cache/taxa.csv) first.
import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { CACHE, KINGDOMS } from './lib/paths.mjs';

function splitCsv(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

const lists = {};
const wanted = new Map();
for (const key of Object.keys(KINGDOMS)) {
  const seen = new Map();
  for (const line of readFileSync(join(CACHE, `species-${key}.jsonl`), 'utf8').split('\n')) {
    if (!line) continue;
    const s = JSON.parse(line);
    if (!seen.has(s.id)) seen.set(s.id, s);
  }
  lists[key] = seen;
  for (const id of seen.keys()) wanted.set(id, null);
  console.log(`${key}: ${seen.size} unique species`);
}

const rl = createInterface({ input: createReadStream(join(CACHE, 'taxa.csv')) });
let header = null;
for await (const line of rl) {
  if (!header) { header = splitCsv(line); continue; }
  const id = Number(line.slice(0, line.indexOf(',')));
  if (!wanted.has(id)) continue;
  const f = splitCsv(line);
  const row = Object.fromEntries(header.map((h, i) => [h, f[i]]));
  wanted.set(id, { kingdom: row.kingdom, phylum: row.phylum, class: row.class, order: row.order, family: row.family });
}

for (const [key, seen] of Object.entries(lists)) {
  const rows = [];
  let missing = 0;
  for (const s of seen.values()) {
    const t = wanted.get(s.id);
    if (!t) { missing++; continue; }
    // A few species sit outside any family in iNat's tree; group them under their order.
    const family = t.family || `Unplaced ${t.order || t.class || t.phylum}`;
    rows.push({ id: s.id, sci: s.name, common: s.common, count: s.count, kingdom: t.kingdom, phylum: t.phylum, class: t.class, order: t.order, family });
  }
  const k = (r) => [r.class ?? '', r.order ?? '', r.family, r.sci];
  rows.sort((a, b) => {
    const x = k(a), y = k(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
    return 0;
  });
  writeFileSync(join(CACHE, `list-${key}.json`), JSON.stringify(rows));
  const families = new Set(rows.map((r) => r.family)).size;
  console.log(`${key}: ${rows.length} species in ${families} families (${missing} not in the taxonomy export)`);
}
