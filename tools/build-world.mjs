// node build-world.mjs
// Writes public/data/world.json: the "where it has been seen" map's outlines, already
// projected to SVG paths, so the app ships no map library.
//   { w, h, shapes: [{ places: [iNat place id, ...], d, dot? }] }
// Outlines: Natural Earth 1:50m countries, simplified, (public domain) via world-atlas. Each outline is
// matched to iNaturalist's country places (fetch-regions.mjs) by name, with the overrides
// below for names that differ. Antarctica is matched to iNat's Antarctica region. A shape too
// small to see at map size also gets a dot, so a seen island nation still shows.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { geoArea, geoCentroid, geoEqualEarth, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { presimplify, simplify } from 'topojson-simplify';
import { CACHE, PUBLIC_DATA } from './lib/paths.mjs';

const W = 720;
/** Simplification threshold (planar area in square degrees): about 140 KB of paths, no visible loss at map size. */
const SIMPLIFY = 0.1;
const ANTARCTICA = 97390;
/** iNaturalist country name -> Natural Earth name, where they differ. */
const OVERRIDES = {
  'United States': 'United States of America',
  'French Polynesia': 'Fr. Polynesia',
  'Dominican Republic': 'Dominican Rep.',
  'Republic of Congo': 'Congo',
  'The Gambia': 'Gambia',
  'Democratic Republic of the Congo': 'Dem. Rep. Congo',
  'Solomon Islands': 'Solomon Is.',
  'Türkiye': 'Turkey',
  'Turks and Caicos Islands': 'Turks and Caicos Is.',
  'Wallis and Futuna': 'Wallis and Futuna Is.',
  'Cayman Islands': 'Cayman Is.',
  'Christmas Island': 'Indian Ocean Ter.',
  'Cocos Islands': 'Indian Ocean Ter.',
  'Falkland Islands': 'Falkland Is.',
  'Bosnia and Herzegovina': 'Bosnia and Herz.',
  'Central African Republic': 'Central African Rep.',
  'Commonwealth of the Northern Mariana Islands': 'N. Mariana Is.',
  'Equatorial Guinea': 'Eq. Guinea',
  'Vatican City': 'Vatican',
  'Cape Verde': 'Cabo Verde',
  'Faroe Islands': 'Faeroe Is.',
  'Cook Islands': 'Cook Is.',
  'Antigua and Barbuda': 'Antigua and Barb.',
  'United States Virgin Islands': 'U.S. Virgin Is.',
  'British Virgin Islands': 'British Virgin Is.',
  'Saint Vincent and the Grenadines': 'St. Vin. and Gren.',
  'East Timor': 'Timor-Leste',
  'Saint Pierre and Miquelon': 'St. Pierre and Miquelon',
  'Pitcairn Islands': 'Pitcairn Is.',
  'North Macedonia': 'Macedonia',
  'Saint Kitts and Nevis': 'St. Kitts and Nevis',
  'British Indian Ocean Territory': 'Br. Indian Ocean Ter.',
  'Marshall Islands': 'Marshall Is.',
  'Federated States of Micronesia': 'Micronesia',
  'Western Sahara': 'W. Sahara',
};

const require = createRequire(import.meta.url);
const topo = require('world-atlas/countries-50m.json');
const world = feature(topo, topo.objects.countries);
const lite = simplify(presimplify(structuredClone(topo)), SIMPLIFY);
const liteFeatures = feature(lite, lite.objects.countries).features;
const countries = JSON.parse(readFileSync(join(CACHE, 'regions', 'countries.json'), 'utf8'));

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
const byName = new Map(world.features.map((f) => [norm(f.properties.name), f]));
const places = new Map();
const unmatched = [];
for (const c of countries) {
  const f = byName.get(norm(OVERRIDES[c.name] ?? c.name));
  if (!f) { unmatched.push(c.name); continue; }
  const list = places.get(f) ?? [];
  list.push(c.id);
  places.set(f, list);
}
const ant = byName.get('antarctica');
if (ant) places.set(ant, [ANTARCTICA]);

const projection = geoEqualEarth().fitWidth(W, { type: 'Sphere' });
const path = geoPath(projection).digits(1);
const [[, y0], [, y1]] = path.bounds({ type: 'Sphere' });
const H = Math.ceil(y1 - y0);

const shapes = world.features.map((f, i) => {
  const s = { places: places.get(f) ?? [], d: path(liteFeatures[i]) };
  // Under ~3 px across at this size: a dot keeps it visible when it is shaded.
  if (path.area(f) < 9 && geoArea(f) > 0) s.dot = projection(geoCentroid(f)).map((v) => Math.round(v * 10) / 10);
  return s;
});

const out = join(PUBLIC_DATA, 'world.json');
const json = JSON.stringify({ w: W, h: H, shapes });
writeFileSync(out, json);
const size = Buffer.byteLength(json);
console.log(`world: ${shapes.length} outlines, ${places.size} matched, ${(size / 1024).toFixed(0)} KB -> ${out}`);
console.log(`not on the map (no 1:50m outline of their own): ${unmatched.join(', ') || 'none'}`);
