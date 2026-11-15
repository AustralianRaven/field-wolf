// node fetch-species.mjs [fauna|flora]
// Lists every species with at least one research-grade iNaturalist observation,
// per kingdom, into .cache/species-<kingdom>.jsonl (one row per species).
// Resumable: rerun and it continues from the last complete page.
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inat } from './lib/inat.mjs';
import { CACHE, KINGDOMS } from './lib/paths.mjs';

for (const key of process.argv[2] ? [process.argv[2]] : Object.keys(KINGDOMS)) {
  const { taxonId } = KINGDOMS[key];
  const out = join(CACHE, `species-${key}.jsonl`);
  const prog = out + '.page';
  let page = existsSync(prog) ? Number(readFileSync(prog, 'utf8')) + 1 : 1;
  if (page === 1) writeFileSync(out, '');
  for (;;) {
    const j = await inat('/observations/species_counts', { quality_grade: 'research', taxon_id: taxonId, per_page: 500, page, locale: 'en' });
    const lines = j.results.map((r) => JSON.stringify({
      id: r.taxon.id, name: r.taxon.name, common: r.taxon.preferred_common_name ?? null,
      count: r.count, ancestors: r.taxon.ancestor_ids,
    }));
    if (lines.length) appendFileSync(out, lines.join('\n') + '\n');
    writeFileSync(prog, String(page));
    if (page % 20 === 0) console.log(`${key}: page ${page} / ${Math.ceil(j.total_results / 500)}`);
    if (page * 500 >= j.total_results || !j.results.length) break;
    page++;
  }
  console.log(`${key}: done`);
}
