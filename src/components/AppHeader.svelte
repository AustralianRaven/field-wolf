<script lang="ts">
  import { KINGDOMS, REPO_URL, type Kingdom } from '../lib/config';
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
    <a class="repo" href={REPO_URL} target="_blank" rel="noopener noreferrer" aria-label="Source code on GitHub" title="Source code on GitHub" data-testid="repo-link">
      <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" /></svg>
      <span>Source</span>
    </a>
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
  .repo {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    font-size: 13px;
    font-weight: 600;
    color: var(--shell-muted);
    text-decoration: none;
  }
  .repo:hover {
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
    .status span,
    .repo span {
      display: none;
    }
  }
</style>
