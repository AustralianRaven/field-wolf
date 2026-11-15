<script lang="ts">
  import { KINGDOMS, type Kingdom } from '../lib/config';
  import { href, router } from '../lib/router.svelte';
  import { setup } from '../lib/setup.svelte';
  import KingdomIcon from './KingdomIcon.svelte';
  import Logo from './Logo.svelte';

  const tabs: Kingdom[] = ['flora', 'fauna'];
</script>

<header class="bar">
  <div class="inner page">
    <a class="brand" href={href('home')} onclick={router.link}>
      <Logo size={34} tree="#9B7BD0" wolf="#F3EEFA" ground="#2B1747" />
      <span>FieldWolf</span>
    </a>
    <nav aria-label="Guides">
      {#each tabs as k (k)}
        <a class="tab" class:on={router.route === k} aria-current={router.route === k ? 'page' : undefined} href={href(k)} onclick={router.link}>
          <KingdomIcon kingdom={k} size={18} />
          {KINGDOMS[k].title}
        </a>
      {/each}
      <a class="tab" class:on={router.route === 'species'} aria-current={router.route === 'species' ? 'page' : undefined} href={href('species')} onclick={router.link}>
        Species list
      </a>
    </nav>
    <div class="status" aria-live="polite">
      {#if setup.ready === true}
        <i class="dot" aria-hidden="true"></i><span>ID model ready on this device</span>
      {:else if setup.ready === false}
        <a href={href('setup')} onclick={router.link}>Set up the ID model</a>
      {/if}
    </div>
  </div>
</header>

<style>
  .bar {
    background: var(--shell);
    color: var(--shell-ink);
  }
  .inner {
    display: flex;
    align-items: center;
    gap: clamp(16px, 3vw, 40px);
    min-height: 60px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #fff;
    font-weight: 700;
    font-size: 18px;
    letter-spacing: -0.01em;
    text-decoration: none;
  }
  .brand:hover {
    color: #fff;
  }
  nav {
    display: flex;
    align-self: stretch;
  }
  .tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 3px 14px 0;
    color: var(--shell-muted);
    font-weight: 500;
    text-decoration: none;
    border-bottom: 3px solid transparent;
    transition: color 160ms var(--ease-out), border-color 160ms var(--ease-out);
  }
  .tab:hover {
    color: #fff;
  }
  .tab.on {
    color: #fff;
    border-bottom-color: var(--lime);
  }
  .status {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--shell-muted);
  }
  .status a {
    color: var(--shell-ink);
    font-weight: 600;
  }
  .status a:hover {
    color: #fff;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--lime);
  }
  @media (max-width: 760px) {
    .inner {
      flex-wrap: wrap;
      gap: 0 16px;
      padding-top: 8px;
    }
    nav {
      order: 3;
      width: 100%;
      min-height: 44px;
      overflow-x: auto;
    }
    .tab {
      padding: 3px 10px 0;
    }
    .status span {
      display: none;
    }
  }
</style>
