<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import LeaderLines from '../components/LeaderLines.svelte';
  import PhotoPlate from '../components/PhotoPlate.svelte';
  import RegionPicker from '../components/RegionPicker.svelte';
  import Results from '../components/Results.svelte';
  import SetupNotice from '../components/SetupNotice.svelte';
  import { Analyser } from '../lib/analyser.svelte';
  import { KINGDOMS, type Kingdom } from '../lib/config';
  import { loadMeta, loadRegions, type Region } from '../lib/data';
  import type { Box } from '../lib/region';
  import { setup } from '../lib/setup.svelte';

  let { kingdom }: { kingdom: Kingdom } = $props();
  const info = $derived(KINGDOMS[kingdom]);

  // svelte-ignore state_referenced_locally
  const analyser = new Analyser(kingdom);
  let photo = $state<File | null>(null);
  let photoUrl = $state<string | null>(null);
  let box = $state<Box | null>(null);
  let region = $state<number | null>(null);
  let regions = $state<Region[]>([]);
  let input = $state<HTMLInputElement>();
  let work = $state<HTMLElement | null>(null);
  let boxEl = $state<HTMLElement | null>(null);
  let thumbEl = $state<HTMLElement | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const regionName = $derived(regions.find((r) => r.id === region)?.name ?? 'Everywhere');

  onMount(async () => {
    if (await setup.check()) analyser.warm();
    try {
      regions = await loadRegions(kingdom, await loadMeta(kingdom));
    } catch {
      regions = [];
    }
  });
  onDestroy(() => {
    analyser.destroy();
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  });

  function run(): void {
    clearTimeout(timer);
    if (photo && setup.ready) analyser.identify(photo, box, region);
  }

  function setFile(f: File): void {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photo = f;
    photoUrl = URL.createObjectURL(f);
    box = null;
    analyser.reset();
    run();
  }

  function setBox(b: Box | null, final: boolean): void {
    box = b;
    clearTimeout(timer);
    // Keyboard nudges come in bursts: wait for a pause before analysing.
    if (final) run();
    else timer = setTimeout(run, 450);
  }

  function setRegion(id: number | null): void {
    region = id;
    run();
  }
</script>

{#if setup.ready === false}
  <SetupNotice variant="popup" />
{/if}

<div class="tools">
  <div class="page row">
    <h1>Identify {info.noun === 'animal' ? 'an' : 'a'} {info.noun}</h1>
    <div class="grow"></div>
    <RegionPicker {regions} value={region} onChange={setRegion} />
    {#if photo}
      <span class="vr" aria-hidden="true"></span>
      <div class="acts">
        <button class="btn btn-secondary" onclick={() => input?.click()}>Change photo</button>
        {#if box}
          <button class="btn btn-ghost" onclick={() => setBox(null, true)}>Clear box</button>
        {:else}
          <button class="btn btn-ghost" onclick={() => setBox({ x: 0.2, y: 0.2, w: 0.6, h: 0.6 }, true)}>Add a box</button>
        {/if}
      </div>
    {/if}
    <input bind:this={input} class="visually-hidden" type="file" accept="image/*" tabindex="-1" aria-hidden="true" onchange={(e) => { const f = e.currentTarget.files?.[0]; if (f) setFile(f); e.currentTarget.value = ''; }} />
  </div>
</div>

<main class="page work" bind:this={work}>
  <PhotoPlate {photoUrl} {box} noun={info.noun} onFile={setFile} onBox={setBox} analysed={analyser.ranking !== null} bind:anchor={boxEl} />
  <Results
    status={analyser.state}
    ranking={analyser.ranking}
    ms={analyser.ms}
    error={analyser.notSetUp ? 'The ID model is not set up in this browser yet.' : analyser.error}
    noun={info.noun}
    {photoUrl}
    {box}
    hasPhoto={Boolean(photo)}
    {regionName}
    {regions}
    bind:thumbEl
  />
  {#if analyser.state === 'done'}
    <LeaderLines container={work} from={boxEl} to={[thumbEl]} drawKey={analyser.ranking} />
  {/if}
</main>

<footer class="page foot">
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="2" y="5.5" width="8" height="5.5" rx="1" /><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" /></svg>
  Runs on your device. Your photo never leaves it.
</footer>

<style>
  .tools {
    background: var(--plate);
    border-bottom: 1px solid var(--line);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    min-height: 68px;
    padding-block: 12px;
  }
  h1 {
    font-size: 18px;
    font-weight: 600;
  }
  .grow {
    flex: 1;
  }
  .vr {
    width: 1px;
    height: 24px;
    background: var(--line);
  }
  .acts {
    display: flex;
    gap: 8px;
  }
  .work {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1.12fr) minmax(320px, 1fr);
    gap: clamp(24px, 4.4vw, 64px);
    align-items: start;
    padding-top: 24px;
    padding-bottom: 32px;
  }
  .foot {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 24px;
    font-size: 12px;
    color: var(--muted);
  }
  @media (max-width: 900px) {
    .work {
      grid-template-columns: 1fr;
    }
    .grow,
    .vr {
      display: none;
    }
    h1 {
      width: 100%;
    }
  }
  @media (max-width: 600px) {
    .row {
      display: grid;
      gap: 10px;
    }
    .row :global(.picker) {
      display: grid;
      grid-template-columns: auto 1fr;
    }
    .row :global(.picker .select) {
      max-width: none;
      width: 100%;
    }
    .row :global(.picker label) {
      display: contents;
    }
    .acts .btn {
      flex: 1;
    }
  }
</style>
