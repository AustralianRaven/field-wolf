// A polite iNaturalist API client: one request at a time, at most ~1 per second,
// with retries on 429/5xx. iNat asks API users to stay under 60 requests a minute.
const BASE = 'https://api.inaturalist.org/v1';
let last = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function inat(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let attempt = 0; ; attempt++) {
    const wait = last + 1100 - Date.now();
    if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'FieldWolf data builder (github.com/AustralianRaven/field-wolf)' } });
      if (res.ok) return await res.json();
      if (res.status !== 429 && res.status < 500) throw new Error(`${url} -> HTTP ${res.status}`);
    } catch (e) {
      if (attempt >= 6 || /HTTP 4\d\d/.test(e.message) && !/429/.test(e.message)) throw e;
    }
    await sleep(Math.min(60000, 2000 * 2 ** attempt));
  }
}

/** Every research-grade species under `taxonId`, optionally inside `placeId`. Yields API result rows. */
export async function* speciesCounts(taxonId, placeId, extra = {}) {
  for (let page = 1; ; page++) {
    const params = { quality_grade: 'research', taxon_id: taxonId, per_page: 500, page, locale: 'en' };
    if (placeId) params.place_id = placeId;
    Object.assign(params, extra);
    const j = await inat('/observations/species_counts', params);
    for (const r of j.results) yield r;
    if (page * 500 >= j.total_results || j.results.length === 0) return;
  }
}
