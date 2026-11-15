<script lang="ts">
  /** Every supported species: searchable, and browsable by class and family. */
  import { KINGDOMS, type Kingdom } from '../lib/config';
  import { loadFamilies, loadMeta, loadNames, loadShardRows, type Meta } from '../lib/data';
  import type { Family, SpeciesRow } from '../lib/rank';

  let kingdom = $state<Kingdom>('fauna');
  let meta = $state<Meta | null>(null);
  let families = $state<Family[]>([]);
  let names = $state<([string] | [string, string])[] | null>(null);
  let loadingNames = $state(false);
  let query = $state('');
  let error = $state<string | null>(null);
  let openFamily = $state<number | null>(null);
  let familyRows = $state<SpeciesRow[]>([]);
  const fmt = new Intl.NumberFormat('en');

  $effect(() => {
    const k = kingdom;
    meta = null;
    families = [];
    names = null;
    openFamily = null;
    error = null;
    loadMeta(k)
      .then(async (m) => {
        const f = await loadFamilies(k, m);
        if (k !== kingdom) return;
        meta = m;
        families = f;
      })
      .catch((e: unknown) => (error = e instanceof Error ? e.message : String(e)));
  });

  // Load the full name list only once someone searches: it is several megabytes.
  $effect(() => {
    if (query.trim().length < 2 || names || loadingNames || !meta) return;
    loadingNames = true;
    const k = kingdom;
    loadNames(k, meta)
      .then((n) => k === kingdom && (names = n))
      .finally(() => (loadingNames = false));
  });

  const byClass = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a local scratch map inside a derived value
    const m = new Map<string, { family: Family; index: number }[]>();
    families.forEach((family, index) => {
      const key = family.class || 'Unplaced';
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push({ family, index });
    });
    return [...m].map(([cls, fams]) => ({ cls, fams, count: fams.reduce((s, f) => s + f.family.count, 0) }));
  });

  function familyAt(i: number): Family | undefined {
    let lo = 0;
    let hi = families.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (families[mid]!.offset <= i) lo = mid;
      else hi = mid - 1;
    }
    return families[lo];
  }

  const matches = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || !names) return [];
    const out: { sci: string; common?: string; family?: string }[] = [];
    for (let i = 0; i < names.length && out.length < 100; i++) {
      const [sci, common] = names[i]!;
      if (sci.toLowerCase().includes(q) || common?.toLowerCase().includes(q)) out.push({ sci, common, family: familyAt(i)?.name });
    }
    return out;
  });

  async function toggle(index: number): Promise<void> {
    if (openFamily === index) {
      openFamily = null;
      return;
    }
    openFamily = index;
    familyRows = [];
    if (meta) familyRows = await loadShardRows(kingdom, meta, index);
  }
</script>

<main class="page species">
  <header class="head">
    <h1>Supported species</h1>
    <p>
      FieldWolf knows every species with at least one research-grade observation on iNaturalist: a record with a photo
      that the community has agreed on. If a photographed {KINGDOMS[kingdom].noun} has one, it is in this list.
    </p>
  </header>

  <div class="bar">
    <div class="switch" role="tablist" aria-label="Guide">
      {#each ['fauna', 'flora'] as const as k (k)}
        <button role="tab" aria-selected={kingdom === k} class:on={kingdom === k} onclick={() => { kingdom = k; query = ''; }}>
          {KINGDOMS[k].title}
        </button>
      {/each}
    </div>
    <label class="search">
      <span class="visually-hidden">Search species</span>
      <input type="search" placeholder="Search by common or scientific name" bind:value={query} />
    </label>
    {#if meta}
      <p class="total">{fmt.format(meta.count)} {KINGDOMS[kingdom].plural} in {fmt.format(meta.families)} families</p>
    {/if}
  </div>

  {#if error}
    <p class="err" role="alert">{error}</p>
  {:else if query.trim().length >= 2}
    <section aria-live="polite">
      {#if !names}
        <p class="muted">Loading the full list of names…</p>
      {:else if !matches.length}
        <p class="muted">No {KINGDOMS[kingdom].plural} match “{query}”.</p>
      {:else}
        <ul class="list">
          {#each matches as m (m.sci)}
            <li><span class="c name">{m.common ?? m.sci}</span><span class="s sci">{m.sci}</span><span class="f">{m.family}</span></li>
          {/each}
        </ul>
        {#if matches.length === 100}<p class="muted">Showing the first 100 matches. Type more to narrow it down.</p>{/if}
      {/if}
    </section>
  {:else}
    <div class="classes">
      {#each byClass as group (group.cls)}
        <details>
          <summary><span class="name cls">{group.cls}</span><span class="n">{fmt.format(group.count)}</span></summary>
          <ul class="fams">
            {#each group.fams as { family, index } (index)}
              <li>
                <button class="fam" aria-expanded={openFamily === index} onclick={() => toggle(index)}>
                  <span class="name">{family.name}</span><span class="o">{family.order}</span><span class="n">{fmt.format(family.count)}</span>
                </button>
                {#if openFamily === index}
                  <ul class="list inner">
                    {#each familyRows as [sci, common, id] (id)}
                      <li>
                        <a class="c name" href="https://www.inaturalist.org/taxa/{id}" target="_blank" rel="noreferrer">{common ?? sci}</a>
                        <span class="s sci">{sci}</span>
                      </li>
                    {/each}
                  </ul>
                {/if}
              </li>
            {/each}
          </ul>
        </details>
      {/each}
    </div>
  {/if}

  <footer class="credit">
    <p>
      Species lists and taxonomy come from <a href="https://www.inaturalist.org" rel="noreferrer">iNaturalist</a> and its
      community of observers{meta ? `, built on ${meta.builtAt}` : ''}. Region filters use the countries where each
      species has research-grade records.
    </p>
  </footer>
</main>

<style>
  .species {
    display: grid;
    gap: 24px;
    padding-top: clamp(24px, 4vw, 48px);
    padding-bottom: 56px;
  }
  .head {
    display: grid;
    gap: 10px;
  }
  h1 {
    font-family: var(--font-name);
    font-weight: 600;
    font-size: clamp(30px, 3.6vw, 44px);
    letter-spacing: -0.01em;
  }
  .head p {
    color: var(--muted);
    max-width: 70ch;
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--ink);
  }
  .switch {
    display: flex;
    border: 1px solid var(--violet);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .switch button {
    min-height: 40px;
    padding: 0 18px;
    border: 0;
    background: var(--plate);
    color: var(--violet);
    font-weight: 600;
    cursor: pointer;
  }
  .switch button.on {
    background: var(--violet);
    color: #fff;
  }
  .search {
    flex: 1 1 280px;
  }
  .search input {
    width: 100%;
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--radius);
    background: var(--plate);
  }
  .search input::placeholder {
    color: #6e6780;
  }
  .total {
    color: var(--muted);
    font-size: 14px;
    font-weight: 600;
  }
  .muted {
    color: var(--muted);
  }
  .err {
    color: var(--bad);
  }
  details {
    border-bottom: 1px solid var(--line);
  }
  summary {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 14px 4px;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary::before {
    content: '';
    width: 0;
    height: 0;
    border: 5px solid transparent;
    border-left-color: var(--violet);
    translate: 0 -1px;
    transition: rotate 160ms var(--ease-out);
  }
  details[open] summary::before {
    rotate: 90deg;
  }
  .cls {
    font-size: 20px;
    font-weight: 600;
  }
  .n {
    margin-left: auto;
    color: var(--muted);
    font-size: 14px;
  }
  .fams {
    list-style: none;
    margin: 0 0 12px;
    padding: 0 0 0 24px;
  }
  .fam {
    display: flex;
    align-items: baseline;
    gap: 12px;
    width: 100%;
    min-height: 40px;
    padding: 6px 4px;
    border: 0;
    border-bottom: 1px solid var(--line);
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .fam:hover {
    background: var(--violet-soft);
  }
  .fam .name {
    font-size: 17px;
  }
  .o {
    color: var(--muted);
    font-size: 13px;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .list li {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
    padding: 10px 4px;
    border-bottom: 1px solid var(--line);
  }
  .list.inner {
    padding-left: 16px;
    max-height: 480px;
    overflow: auto;
  }
  .c {
    font-weight: 600;
    font-size: 17px;
    color: var(--ink);
    text-decoration: none;
  }
  a.c:hover {
    color: var(--violet);
    text-decoration: underline;
  }
  .s {
    color: var(--muted);
  }
  .f {
    margin-left: auto;
    color: var(--muted);
    font-size: 13px;
  }
  .credit {
    font-size: 13px;
    color: var(--muted);
  }
</style>
