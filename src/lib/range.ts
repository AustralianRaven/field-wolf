/**
 * "Where it has been seen": turns a species' seen-in list (regions.json indices,
 * from its shard row) into the map's shaded outlines and the places too small
 * to have an outline of their own.
 */
import type { Region } from './data';

/** public/data/world.json, as tools/build-world.mjs writes it. */
export interface World {
  w: number;
  h: number;
  shapes: WorldShape[];
}

export interface WorldShape {
  /** iNaturalist place ids this outline stands for (usually one country; empty for unmatched outlines). */
  places: number[];
  /** SVG path data, already projected. */
  d: string;
  /** A marker for an outline too small to see at map size. */
  dot?: [number, number];
}

export interface Range {
  /** Indices into world.shapes to shade. */
  shaded: Set<number>;
  /** Names of places it was seen in that have no outline on the map, alphabetical. */
  offMap: string[];
  /** How many countries it has been recorded in (Antarctica is not a country). */
  countries: number;
}

export function rangeOf(seenIn: readonly number[], regions: readonly Region[], world: World): Range {
  const seen = new Map<number, Region>();
  for (const i of seenIn) {
    const r = regions[i];
    if (r) seen.set(r.id, r);
  }
  const shaded = new Set<number>();
  const drawn = new Set<number>();
  world.shapes.forEach((s, i) => {
    for (const p of s.places) {
      drawn.add(p);
      if (seen.has(p)) shaded.add(i);
    }
  });
  const offMap = [...seen.values()].filter((r) => !drawn.has(r.id)).map((r) => r.name).sort((a, b) => a.localeCompare(b));
  const countries = [...seen.values()].filter((r) => r.continent !== null).length;
  return { shaded, offMap, countries };
}
