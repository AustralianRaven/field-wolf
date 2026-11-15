// node fetch-photos.mjs
// Downloads the 20 test photos (10 animals, 10 plants, from every continent)
// from research-grade iNaturalist observations with CC0 or CC BY licences.
// Writes e2e/fixtures/photos/<slug>.jpg and e2e/fixtures/photos/photos.json,
// which records each photo's truth, continent and attribution.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inat } from './lib/inat.mjs';
import { REPO } from './lib/paths.mjs';

export const TEST_SPECIES = [
  // Fauna
  { kingdom: 'fauna', scientific: 'Dacelo novaeguineae', common: 'Laughing Kookaburra', continent: 'Oceania', place: 6744 },
  { kingdom: 'fauna', scientific: 'Loxodonta africana', common: 'African Bush Elephant', continent: 'Africa', place: 97392 },
  { kingdom: 'fauna', scientific: 'Pavo cristatus', common: 'Indian Peafowl', continent: 'Asia', place: 97395 },
  { kingdom: 'fauna', scientific: 'Erithacus rubecula', common: 'European Robin', continent: 'Europe', place: 97391 },
  { kingdom: 'fauna', scientific: 'Cardinalis cardinalis', common: 'Northern Cardinal', continent: 'North America', place: 97394 },
  { kingdom: 'fauna', scientific: 'Ramphastos toco', common: 'Toco Toucan', continent: 'South America', place: 97389 },
  { kingdom: 'fauna', scientific: 'Pygoscelis adeliae', common: 'Adelie Penguin', continent: 'Antarctica', place: null },
  { kingdom: 'fauna', scientific: 'Nestor notabilis', common: 'Kea', continent: 'Oceania', place: 97393 },
  { kingdom: 'fauna', scientific: 'Danaus plexippus', common: 'Monarch', continent: 'North America', place: 97394 },
  { kingdom: 'fauna', scientific: 'Varanus komodoensis', common: 'Komodo Dragon', continent: 'Asia', place: 97395 },
  // Flora
  { kingdom: 'flora', scientific: 'Telopea speciosissima', common: 'New South Wales Waratah', continent: 'Oceania', place: 6744 },
  { kingdom: 'flora', scientific: 'Adansonia digitata', common: 'African Baobab', continent: 'Africa', place: 97392 },
  { kingdom: 'flora', scientific: 'Nelumbo nucifera', common: 'Sacred Lotus', continent: 'Asia', place: 97395, pick: 1 },
  { kingdom: 'flora', scientific: 'Papaver rhoeas', common: 'Common Poppy', continent: 'Europe', place: 97391 },
  { kingdom: 'flora', scientific: 'Carnegiea gigantea', common: 'Saguaro', continent: 'North America', place: 97394 },
  { kingdom: 'flora', scientific: 'Araucaria araucana', common: 'Monkey Puzzle Tree', continent: 'South America', place: 97389, pick: 1 },
  { kingdom: 'flora', scientific: 'Protea cynaroides', common: 'King Protea', continent: 'Africa', place: 97392 },
  { kingdom: 'flora', scientific: 'Metrosideros excelsa', common: 'Pohutukawa', continent: 'Oceania', place: 97393, extra: { term_id: 12, term_value_id: 13 } },
  { kingdom: 'flora', scientific: 'Helianthus annuus', common: 'Common Sunflower', continent: 'North America', place: 97394 },
  { kingdom: 'flora', scientific: 'Leontopodium nivale', common: 'Edelweiss', continent: 'Europe', place: 97391 },
];

// iNat has no Antarctica place, so Antarctica is everything south of 60 degrees S.
export const ANTARCTICA = { swlat: -90, swlng: -180, nelat: -60, nelng: 180 };

const dir = join(REPO, 'e2e', 'fixtures', 'photos');
mkdirSync(dir, { recursive: true });
const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-');

const out = [];
for (const t of TEST_SPECIES) {
  const j = await inat('/observations', {
    taxon_name: t.scientific, quality_grade: 'research', photo_license: 'cc0,cc-by', ...(t.place ? { place_id: t.place } : ANTARCTICA),
    per_page: 10, order_by: 'votes', photos: true, ...t.extra,
  });
  // The most-faved observation of this species (or one of its subspecies) and whose first photo is CC0/CC BY.
  // pick skips observations whose top photo makes a poor test (another animal in shot, mist, a seedling).
  const obs = j.results.filter((o) => (o.taxon?.name === t.scientific || o.taxon?.name?.startsWith(t.scientific + ' ')) && ['cc0', 'cc-by'].includes(o.photos?.[0]?.license_code))[t.pick ?? 0];
  if (!obs) throw new Error(`No CC0/CC BY photo for ${t.scientific}`);
  const p = obs.photos[0];
  const url = p.url.replace('/square.', '/medium.');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const file = `${slug(t.scientific)}.jpg`;
  writeFileSync(join(dir, file), Buffer.from(await res.arrayBuffer()));
  out.push({ ...t, file, inatTaxonId: obs.taxon.id, observation: `https://www.inaturalist.org/observations/${obs.id}`, attribution: p.attribution, license: p.license_code });
  console.log(`${t.scientific}: ${file} (${p.license_code})`);
}
writeFileSync(join(dir, 'photos.json'), JSON.stringify(out, null, 2) + '\n');
