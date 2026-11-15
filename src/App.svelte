<script lang="ts">
  import { onMount } from 'svelte';

  import AppHeader from './components/AppHeader.svelte';
  import Home from './routes/Home.svelte';
  import Identify from './routes/Identify.svelte';
  import Setup from './routes/Setup.svelte';
  import Species from './routes/Species.svelte';
  import { href, router } from './lib/router.svelte';
  import { setup } from './lib/setup.svelte';

  const titles = { home: 'FieldWolf', flora: 'Flora · FieldWolf', fauna: 'Fauna · FieldWolf', setup: 'Setup · FieldWolf', species: 'Species list · FieldWolf', missing: 'Not found · FieldWolf' };

  onMount(() => void setup.check());
  $effect(() => {
    document.title = titles[router.route];
  });
</script>

<a class="skip" href="#content">Skip to content</a>
<AppHeader />
<div id="content">
  {#if router.route === 'home'}
    <Home />
  {:else if router.route === 'flora' || router.route === 'fauna'}
    {#key router.route}<Identify kingdom={router.route} />{/key}
  {:else if router.route === 'setup'}
    <Setup />
  {:else if router.route === 'species'}
    <Species />
  {:else}
    <main class="page missing">
      <h1 class="name">No such page</h1>
      <p><a href={href('home')} onclick={router.link}>Back to FieldWolf</a></p>
    </main>
  {/if}
</div>

<style>
  .skip {
    position: absolute;
    left: 8px;
    top: -48px;
    padding: 8px 12px;
    background: var(--lime);
    color: var(--lime-ink);
    font-weight: 600;
    z-index: 10;
  }
  .skip:focus {
    top: 8px;
  }
  .missing {
    padding-top: 48px;
    display: grid;
    gap: 12px;
  }
  .missing h1 {
    font-size: 40px;
  }
</style>
