/** Species tables and region lists, as the data builder (tools/pack.mjs) writes them. */
import { cachedFetch } from './cache';
import { dataUrl, type Kingdom } from './config';
import type { Family, SpeciesRow } from './rank';

export interface Meta {
  kingdom: Kingdom;
  version: string;
  count: number;
  families: number;
  dim: number;
  template: string;
  familyMode: string;
  regions: number;
  builtAt: string;
  source: string;
}

export interface Region {
  id: number;
  name: string;
  /** The continent's region id for a country; null for a continent. */
  continent: number | null;
  count: number;
}

/** meta.json is always fetched fresh: it names the version every other file is cached under. */
export async function loadMeta(kingdom: Kingdom): Promise<Meta> {
  const res = await fetch(dataUrl(kingdom, 'meta.json'), { cache: 'no-cache' });
  if (!res.ok) throw new Error(`The ${kingdom} species tables are missing (HTTP ${res.status}).`);
  return (await res.json()) as Meta;
}

export const loadFamilies = async (k: Kingdom, m: Meta) => (await (await cachedFetch(dataUrl(k, 'families.json', m.version))).json()) as Family[];
export const loadRegions = async (k: Kingdom, m: Meta) => (await (await cachedFetch(dataUrl(k, 'regions.json', m.version))).json()) as Region[];
export const loadShardRows = async (k: Kingdom, m: Meta, f: number) =>
  (await (await cachedFetch(dataUrl(k, `shards/${f}.json`, m.version))).json()) as SpeciesRow[];
export const loadNames = async (k: Kingdom, m: Meta) =>
  (await (await cachedFetch(dataUrl(k, 'names.json', m.version))).json()) as ([string] | [string, string])[];

/** The files setup downloads ahead, so the first identification is quick. Shards load on demand. */
export const setupFiles = (k: Kingdom, m: Meta) => ['families.json', 'families.bin', 'regions.json'].map((f) => dataUrl(k, f, m.version));
