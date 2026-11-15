import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
export const TOOLS = fileURLToPath(new URL('..', import.meta.url));
export const CACHE = join(TOOLS, '.cache');
export const REPO = join(TOOLS, '..');
export const PUBLIC_DATA = join(REPO, 'public', 'data');
/** iNat taxon ids for the two kingdoms FieldWolf covers. */
export const KINGDOMS = { fauna: { taxonId: 1, name: 'Animalia' }, flora: { taxonId: 47126, name: 'Plantae' } };
