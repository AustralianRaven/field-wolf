/**
 * Whether this browser has the ID model, and the one-time download.
 *
 * "Set up" normally means the model is in the Cache API and survives
 * restarts. Some browsers (private windows, mostly) refuse to store a file
 * this large; then the model is kept in memory for this tab only, and the
 * page says so.
 */
import { cachedFetch, downloadBlob, isCached, storeInCache } from './cache';
import { MODEL_CACHE, MODEL_URL, type Kingdom } from './config';
import { loadMeta, setupFiles } from './data';

class Setup {
  /** null while checking. */
  ready = $state<boolean | null>(null);
  /** True when the model could not be stored and lives in this tab's memory only. */
  sessionOnly = $state(false);
  /** The model, when it could not be stored. Handed to the analyser worker. */
  sessionModel: Blob | null = null;

  async check(): Promise<boolean> {
    this.ready = this.sessionModel !== null || (await isCached(MODEL_URL, MODEL_CACHE));
    return this.ready;
  }

  async download(onProgress: (phase: 'model' | 'tables', loaded: number, total: number) => void, signal?: AbortSignal): Promise<void> {
    const blob = await downloadBlob(MODEL_URL, (l, t) => onProgress('model', l, t), signal);
    if (!(await storeInCache(MODEL_URL, MODEL_CACHE, blob))) {
      this.sessionModel = blob;
      this.sessionOnly = true;
    }
    const kingdoms: Kingdom[] = ['fauna', 'flora'];
    // Tables also load on demand, so a kingdom whose tables cannot be fetched now is not fatal here.
    const lists = await Promise.all(kingdoms.map((k) => loadMeta(k).then((m) => setupFiles(k, m)).catch(() => [] as string[])));
    const urls = lists.flat();
    let done = 0;
    for (const url of urls) {
      await cachedFetch(url);
      onProgress('tables', ++done, urls.length);
    }
    this.ready = true;
  }
}

export const setup = new Setup();
