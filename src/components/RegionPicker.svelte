<script lang="ts">
  /** Continent, then optionally a country. "Everywhere" by default. The value is a region id, or null for everywhere. */
  import type { Region } from '../lib/data';

  let { regions, value, onChange }: { regions: Region[]; value: number | null; onChange: (id: number | null) => void } = $props();

  const continents = $derived(regions.filter((r) => r.continent === null));
  const selected = $derived(regions.find((r) => r.id === value) ?? null);
  const continentId = $derived(selected ? (selected.continent ?? selected.id) : null);
  const countries = $derived(continentId === null ? [] : regions.filter((r) => r.continent === continentId));
</script>

<div class="picker">
  <label>
    <span>Region</span>
    <select class="select" data-testid="continent" value={continentId === null ? '' : String(continentId)} onchange={(e) => onChange(e.currentTarget.value ? Number(e.currentTarget.value) : null)}>
      <option value="">Everywhere</option>
      {#each continents as c (c.id)}<option value={String(c.id)}>{c.name}</option>{/each}
    </select>
  </label>
  {#if continentId !== null && countries.length}
    <label>
      <span class="visually-hidden">Country</span>
      <select class="select" data-testid="country" value={selected?.continent ? String(selected.id) : ''} onchange={(e) => onChange(Number(e.currentTarget.value || continentId))}>
        <option value="">All of {regions.find((r) => r.id === continentId)?.name}</option>
        {#each countries as c (c.id)}<option value={String(c.id)}>{c.name}</option>{/each}
      </select>
    </label>
  {/if}
</div>

<style>
  .picker {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  label span {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
  }
  .select {
    max-width: 220px;
  }
</style>
