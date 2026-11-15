// node fetch-regions.mjs
// Builds per-country species lists for the region filter.
//  1. Finds every country (iNat places with admin_level 0) and its continent.
//  2. For each country and kingdom, lists the research-grade species recorded there.
// Continents are the union of their countries, except Antarctica, which has no
// countries and is fetched directly. Output: .cache/regions/*.json. Resumable.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inat, speciesCounts } from './lib/inat.mjs';
import { CACHE, KINGDOMS } from './lib/paths.mjs';

export const CONTINENTS = {
  97392: 'Africa', 97390: 'Antarctica', 97395: 'Asia', 97391: 'Europe',
  97394: 'North America', 97393: 'Oceania', 97389: 'South America',
};
const dir = join(CACHE, 'regions');
mkdirSync(dir, { recursive: true });

const countriesFile = join(dir, 'countries.json');
let countries;
if (existsSync(countriesFile)) countries = JSON.parse(readFileSync(countriesFile, 'utf8'));
else {
  countries = [];
  for (let start = 1; start <= 12000; start += 30) {
    const ids = Array.from({ length: 30 }, (_, i) => start + i).join(',');
    const j = await inat(`/places/${ids}`);
    for (const p of j.results) {
      const cont = p.ancestor_place_ids?.[0];
      if (p.admin_level === 0 && CONTINENTS[cont]) countries.push({ id: p.id, name: p.name, continent: Number(cont) });
    }
    if (start % 900 === 1) console.log(`scanned places to ${start + 29}: ${countries.length} countries`);
  }
  writeFileSync(countriesFile, JSON.stringify(countries, null, 1));
}
console.log(`${countries.length} countries`);

const jobs = [...countries.map((c) => c.id), 97390];
for (const placeId of jobs) {
  for (const [key, { taxonId }] of Object.entries(KINGDOMS)) {
    const out = join(dir, `${placeId}-${key}.json`);
    if (existsSync(out)) continue;
    const ids = [];
    // iNat has no Antarctica place: use everything south of 60 degrees S instead.
    const extra = placeId === 97390 ? { swlat: -90, swlng: -180, nelat: -60, nelng: 180 } : {};
    for await (const r of speciesCounts(taxonId, placeId === 97390 ? null : placeId, extra)) ids.push(r.taxon.id);
    writeFileSync(out, JSON.stringify(ids));
    console.log(`${placeId} ${key}: ${ids.length}`);
  }
}
console.log('regions: done');
