<script lang="ts">
  import { onMount } from 'svelte';

  import KingdomIcon from '../components/KingdomIcon.svelte';
  import SetupNotice from '../components/SetupNotice.svelte';
  import { KINGDOMS, type Kingdom } from '../lib/config';
  import { loadMeta } from '../lib/data';
  import { href, router } from '../lib/router.svelte';
  import { setup } from '../lib/setup.svelte';

  const guides: { k: Kingdom; blurb: string }[] = [
    { k: 'flora', blurb: 'Trees, flowers, ferns, grasses and mosses.' },
    { k: 'fauna', blurb: 'Birds, mammals, reptiles, insects, spiders and fish.' },
  ];
  let counts = $state<Partial<Record<Kingdom, number>>>({});

  onMount(() => {
    for (const { k } of guides) loadMeta(k).then((m) => (counts[k] = m.count)).catch(() => {});
  });
  const fmt = new Intl.NumberFormat('en');
</script>

<main class="page home">
  {#if router.flash}
    <div class="done" role="status">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5L20 7" /></svg>
      {router.flash}
    </div>
  {/if}
  {#if setup.ready === false}
    <SetupNotice variant="banner" />
  {/if}

  <header class="intro">
    <h1>Name the plant or animal in your photo.</h1>
    <p>Pick a guide, add a photo and box the living thing. FieldWolf runs on this device, so your photo never leaves it.</p>
  </header>

  <div class="guides">
    {#each guides as g (g.k)}
      <a class="guide {g.k}" href={href(g.k)} onclick={router.link}>
        <span class="art"><KingdomIcon kingdom={g.k} size={96} /></span>
        <span class="caption">
          <span class="title name">{KINGDOMS[g.k].title}</span>
          <span class="blurb">{g.blurb}</span>
          <span class="count">{counts[g.k] ? `${fmt.format(counts[g.k]!)} ${KINGDOMS[g.k].plural}` : ' '}</span>
        </span>
        <span class="go" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </a>
    {/each}
  </div>

  <p class="foot">
    Every species with a research-grade record on iNaturalist is in the guide.
    <a href={href('species')} onclick={router.link}>Browse the species list</a>.
  </p>
</main>

<style>
  .home {
    display: grid;
    gap: 28px;
    padding-top: clamp(24px, 5vw, 56px);
    padding-bottom: 56px;
  }
  .done {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: #f2f8d6;
    border: 1px solid var(--lime);
    border-radius: var(--radius);
    font-weight: 600;
  }
  .done svg {
    color: #4b5c00;
  }
  .intro {
    display: grid;
    gap: 12px;
    max-width: 760px;
  }
  h1 {
    font-family: var(--font-name);
    font-weight: 600;
    font-size: clamp(32px, 4.6vw, 56px);
    line-height: 1.05;
    letter-spacing: -0.02em;
  }
  .intro p {
    color: var(--muted);
    font-size: 17px;
    max-width: 60ch;
  }
  .guides {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(16px, 2.4vw, 32px);
  }
  .guide {
    position: relative;
    display: grid;
    grid-template-columns: minmax(120px, 0.8fr) 1fr;
    min-height: clamp(220px, 26vw, 320px);
    background: var(--plate);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-plate);
    color: var(--ink);
    text-decoration: none;
    overflow: hidden;
    transition: transform 240ms var(--ease-out), box-shadow 240ms var(--ease-out), border-color 240ms var(--ease-out);
  }
  .guide:hover {
    color: var(--ink);
    transform: translateY(-2px);
    border-color: var(--violet);
    box-shadow: 0 2px 4px rgb(28 23 38 / 8%), 0 18px 40px -18px rgb(43 23 71 / 35%);
  }
  .art {
    display: grid;
    place-items: center;
    color: var(--lime);
    background: var(--shell);
  }
  .fauna .art {
    background: var(--violet);
  }
  .caption {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: clamp(20px, 2.4vw, 32px);
    padding-right: 56px;
  }
  .title {
    font-size: clamp(40px, 4.4vw, 64px);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  .blurb {
    color: var(--muted);
    max-width: 34ch;
  }
  .count {
    margin-top: auto;
    font-weight: 600;
    color: var(--violet);
  }
  .go {
    position: absolute;
    right: 20px;
    bottom: 20px;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--lime);
    color: var(--lime-ink);
    transition: transform 240ms var(--ease-out);
  }
  .guide:hover .go {
    transform: translateX(4px);
  }
  .foot {
    color: var(--muted);
    font-size: 14px;
  }
  @media (max-width: 820px) {
    .guides {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 480px) {
    .guide {
      grid-template-columns: 96px 1fr;
      min-height: 200px;
    }
    .art :global(svg) {
      width: 56px;
      height: 56px;
    }
  }
</style>
