<script lang="ts">
  /**
   * The nudge to set up the ID model. On home it is an inline warning; on an
   * identify page it is a popup, because nothing there works without the model.
   */
  import { onMount } from 'svelte';

  import { href, router } from '../lib/router.svelte';

  let { variant }: { variant: 'banner' | 'popup' } = $props();
  let dialog = $state<HTMLDialogElement>();

  onMount(() => {
    if (variant === 'popup') dialog?.showModal();
  });
</script>

{#snippet message()}
  <svg class="icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17.5v.01" />
  </svg>
  <div class="text">
    <strong id="setup-title">Set up the ID model first</strong>
    <p>
      FieldWolf names species with a model that runs in your browser. Download it once, about 290 MB, and it stays here.
    </p>
  </div>
{/snippet}

{#if variant === 'banner'}
  <div class="notice banner" role="status">
    {@render message()}
    <a class="btn btn-primary" href={href('setup')} onclick={router.link}>Go to setup</a>
  </div>
{:else}
  <dialog bind:this={dialog} class="notice popup" aria-labelledby="setup-title">
    <div class="row">{@render message()}</div>
    <div class="actions">
      <button class="btn btn-ghost" onclick={() => dialog?.close()}>Not now</button>
      <a class="btn btn-primary" href={href('setup')} onclick={(e) => { dialog?.close(); router.link(e); }}>Go to setup</a>
    </div>
  </dialog>
{/if}

<style>
  .notice {
    color: var(--warn-ink);
  }
  .banner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 16px;
    background: var(--warn-bg);
    border: 1px solid var(--warn-line);
    border-radius: var(--radius);
  }
  .banner .btn {
    margin-left: auto;
    flex: none;
  }
  .icon {
    flex: none;
    color: #8a6a00;
  }
  .text strong {
    display: block;
    color: var(--ink);
    font-size: 15px;
  }
  .text p {
    font-size: 14px;
    max-width: 62ch;
  }
  .row {
    display: flex;
    gap: 14px;
  }
  .popup {
    width: min(480px, calc(100vw - 32px));
    padding: 24px;
    border: 1px solid var(--warn-line);
    border-radius: var(--radius);
    background: var(--plate);
    box-shadow: 0 24px 60px -20px rgb(28 23 38 / 45%);
  }
  .popup::backdrop {
    background: rgb(43 23 71 / 45%);
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }
  @media (max-width: 600px) {
    .banner {
      flex-wrap: wrap;
    }
    .banner .btn {
      margin-left: 36px;
    }
  }
</style>
