<script lang="ts">
  import { router } from '../lib/router.svelte';
  import { setup } from '../lib/setup.svelte';

  let phase = $state<'idle' | 'model' | 'tables' | 'error'>('idle');
  let loaded = $state(0);
  let total = $state(0);
  let error = $state<string | null>(null);

  const mb = (b: number) => `${Math.round(b / 1e6)} MB`;
  const pct = $derived(total ? Math.min(100, Math.round((loaded / total) * 100)) : 0);

  async function start(): Promise<void> {
    phase = 'model';
    error = null;
    try {
      await setup.download((p, l, t) => {
        phase = p;
        loaded = l;
        total = t;
      });
      router.go(
        'home',
        setup.sessionOnly
          ? 'Your setup is done for this tab. This browser would not store the model (a private window, perhaps), so it downloads again next visit.'
          : 'Your setup is done. FieldWolf can now identify photos on this device.',
      );
    } catch (e) {
      phase = 'error';
      error = e instanceof Error ? e.message : String(e);
    }
  }
</script>

<main class="page setup">
  <section class="plate">
    <h1>Set up the ID model</h1>
    <p>
      FieldWolf identifies species with BioCLIP 2, a model trained on photos of living things. It runs inside your
      browser, so your photos never leave this device. Download it once and the browser keeps it.
    </p>
    <dl class="facts">
      <div><dt>Download</dt><dd>About 290 MB, once</dd></div>
      <div><dt>Where it lives</dt><dd>This browser's storage</dd></div>
      <div><dt>Each photo</dt><dd>A few seconds on a laptop</dd></div>
    </dl>

    {#if setup.ready && phase === 'idle'}
      <p class="ok" role="status">The ID model is already set up in this browser.</p>
    {/if}

    {#if phase === 'model' || phase === 'tables'}
      <div class="progress" role="status" aria-live="polite">
        <div class="track"><span style="width:{phase === 'tables' ? 100 : pct}%"></span></div>
        <p>
          {#if phase === 'model'}
            Downloading the model: {mb(loaded)}{total ? ` of ${mb(total)}` : ''} ({pct}%)
          {:else}
            Fetching the species tables: {loaded} of {total}
          {/if}
        </p>
      </div>
    {:else}
      <button class="btn btn-primary big" onclick={start}>{setup.ready ? 'Download again' : 'Download the ID model'}</button>
    {/if}

    {#if error}
      <p class="err" role="alert">The download stopped: {error}. Check your connection, then try again.</p>
    {/if}

    <p class="credit">
      Model: <a href="https://huggingface.co/mahan-ym/bioclip-2-quantized" rel="noreferrer">BioCLIP 2 (8-bit)</a>, MIT licence,
      downloaded from Hugging Face.
    </p>
  </section>
</main>

<style>
  .setup {
    padding-top: clamp(24px, 5vw, 56px);
    padding-bottom: 56px;
  }
  .plate {
    display: grid;
    gap: 20px;
    max-width: 720px;
    padding: clamp(20px, 4vw, 40px);
    background: var(--plate);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-plate);
  }
  h1 {
    font-family: var(--font-name);
    font-weight: 600;
    font-size: clamp(28px, 3.4vw, 40px);
    letter-spacing: -0.01em;
  }
  .plate > p {
    color: var(--muted);
    max-width: 62ch;
  }
  .facts {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin: 0;
    padding: 16px 0;
    border-top: 2px solid var(--ink);
    border-bottom: 1px solid var(--line);
  }
  dt {
    font-size: 13px;
    color: var(--muted);
    font-weight: 600;
  }
  dd {
    margin: 2px 0 0;
    font-weight: 600;
  }
  .big {
    justify-self: start;
    min-height: 48px;
    padding: 0 24px;
    font-size: 16px;
  }
  .progress {
    display: grid;
    gap: 8px;
  }
  .track {
    height: 10px;
    background: var(--empty);
    overflow: hidden;
  }
  .track span {
    display: block;
    height: 100%;
    background: var(--violet);
    transition: width 200ms linear;
  }
  .ok {
    font-weight: 600;
    color: #4b5c00;
  }
  .err {
    color: var(--bad);
    font-weight: 600;
  }
  .credit {
    font-size: 13px;
  }
  @media (max-width: 560px) {
    .facts {
      grid-template-columns: 1fr;
    }
  }
</style>
