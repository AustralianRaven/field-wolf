<script lang="ts">
  /**
   * Where the answer has been seen: every country with research-grade iNaturalist
   * records shaded violet, the rest in the empty-ramp grey. Shaded or not, no
   * "how common" scale. Places too small for an outline get a dot, or are named.
   */
  import { onMount } from 'svelte';

  import { loadWorld, type Region } from '../lib/data';
  import { rangeOf, type World } from '../lib/range';

  interface Props {
    seenIn: number[];
    regions: Region[];
    /** The species the map is for, already formatted for display. */
    name: string;
    /** True when the answer is a genus or family, so the map is labelled as the top guess's. */
    topGuess: boolean;
  }
  let { seenIn, regions, name, topGuess }: Props = $props();

  let world = $state<World | null>(null);
  let failed = $state(false);
  onMount(async () => {
    try {
      world = await loadWorld();
    } catch {
      failed = true;
    }
  });

  const range = $derived(world && regions.length && seenIn.length ? rangeOf(seenIn, regions, world) : null);
  const countries = $derived(range ? (range.countries === 1 ? '1 country' : `${range.countries} countries`) : '');
</script>

{#if range && world && !failed}
  <figure class="range" data-testid="range-map" data-shaded={range.shaded.size}>
    <figcaption>
      {#if topGuess}<span>Top guess <span class="who">{name}</span></span>{/if}
      <span>Recorded in {countries}</span>
    </figcaption>
    <svg viewBox="0 0 {world.w} {world.h}" role="img" aria-label="World map: {name} has been recorded in {countries}">
      {#each world.shapes as s, i (i)}
        <path d={s.d} class:seen={range.shaded.has(i)} />
      {/each}
      {#each world.shapes as s, i (i)}
        {#if s.dot && range.shaded.has(i)}<circle cx={s.dot[0]} cy={s.dot[1]} r="3" />{/if}
      {/each}
    </svg>
    <p class="note">
      Countries where it has been recorded on iNaturalist. Few records can mean few observers there, not that it is absent.
      {#if range.offMap.length}<span class="also">Also recorded in {range.offMap.join(', ')}.</span>{/if}
    </p>
  </figure>
{/if}

<style>
  .range {
    margin: 0;
    display: grid;
    gap: 8px;
    max-width: 460px;
  }
  figcaption {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 14px;
    font-size: 11px;
    line-height: 14px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 600;
  }
  .who {
    text-transform: none;
    letter-spacing: 0;
    font-size: 13px;
    color: var(--ink);
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    background: var(--plate);
  }
  path {
    fill: var(--empty);
    stroke: var(--plate);
    stroke-width: 0.5;
  }
  path.seen {
    fill: var(--violet);
  }
  circle {
    fill: var(--violet);
    stroke: var(--plate);
    stroke-width: 1;
  }
  .note {
    font-size: 12px;
    line-height: 1.45;
    color: var(--muted);
  }
  .also {
    display: block;
    margin-top: 2px;
  }
</style>
