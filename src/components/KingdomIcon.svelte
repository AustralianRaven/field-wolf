<script lang="ts">
  /** Drawn icons for the two halves of the guide: a leaf for Flora, a paw print for Fauna. */
  import type { Kingdom } from '../lib/config';

  let { kingdom, size = 24 }: { kingdom: Kingdom; size?: number } = $props();
</script>

<svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  {#if kingdom === 'flora'}
    <path d="M10 38C10 20 22 9 40 8c1 18-10 30-28 30" />
    <path d="M10 38 30 18" />
    <path d="M18 30h8M22 26v-7" />
  {:else}
    <ellipse cx="24" cy="32" rx="8.5" ry="7" />
    <ellipse cx="13" cy="21" rx="3.6" ry="4.6" transform="rotate(-18 13 21)" />
    <ellipse cx="20" cy="13.5" rx="3.6" ry="4.8" transform="rotate(-6 20 13.5)" />
    <ellipse cx="28" cy="13.5" rx="3.6" ry="4.8" transform="rotate(6 28 13.5)" />
    <ellipse cx="35" cy="21" rx="3.6" ry="4.6" transform="rotate(18 35 21)" />
  {/if}
</svg>
