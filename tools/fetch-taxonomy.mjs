// node fetch-taxonomy.mjs
// Downloads the iNaturalist taxonomy export (~80 MB) and extracts taxa.csv
// into .cache, for build-list.mjs to give every species its class, order and family.
import { execFileSync } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { CACHE } from './lib/paths.mjs';

const zip = join(CACHE, 'inat-taxonomy.zip');
if (!existsSync(zip)) {
  const res = await fetch('https://www.inaturalist.org/taxa/inaturalist-taxonomy.dwca.zip');
  if (!res.ok) throw new Error(`taxonomy export: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(zip));
}
execFileSync('unzip', ['-o', '-q', zip, 'taxa.csv', '-d', CACHE], { stdio: 'inherit' });
console.log('taxa.csv ready');
