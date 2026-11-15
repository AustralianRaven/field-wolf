/**
 * Cache API helpers shared by the page and the worker. Data URLs carry the
 * table version (?v=...), so a rebuilt table is a different URL and never
 * mixes with an old one.
 */
import { DATA_CACHE } from './config';

async function openCache(name: string): Promise<Cache | null> {
  try {
    return await caches.open(name);
  } catch {
    return null; // No Cache API (an insecure origin, say): fetch every time.
  }
}

/** A response from the cache, or fetched and then cached. */
export async function cachedFetch(url: string, cacheName = DATA_CACHE): Promise<Response> {
  const cache = await openCache(cacheName);
  const hit = await cache?.match(url);
  if (hit) return hit;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url.split('?')[0]}: HTTP ${res.status}`);
  await cache?.put(url, res.clone()).catch(() => {});
  return res;
}

export async function isCached(url: string, cacheName: string): Promise<boolean> {
  const cache = await openCache(cacheName);
  return Boolean(await cache?.match(url));
}

/** Download with byte progress. */
export async function downloadBlob(url: string, onProgress: (loaded: number, total: number) => void, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch(url, { mode: 'cors', signal });
  if (!res.ok || !res.body) throw new Error(`the server answered HTTP ${res.status}`);
  const total = Number(res.headers.get('content-length') ?? 0);
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    loaded += value.byteLength;
    onProgress(loaded, total);
  }
  return new Blob(parts as BlobPart[], { type: 'application/octet-stream' });
}

/**
 * Keep a download in the Cache API. False when the browser refuses: private
 * windows often cannot store a file this large.
 */
export async function storeInCache(url: string, cacheName: string, blob: Blob): Promise<boolean> {
  const cache = await openCache(cacheName);
  if (!cache) return false;
  try {
    await cache.put(url, new Response(blob, { headers: { 'Content-Type': blob.type, 'Content-Length': String(blob.size) } }));
    return true;
  } catch {
    return false;
  }
}
