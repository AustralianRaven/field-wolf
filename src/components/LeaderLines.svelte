<script lang="ts">
  /**
   * The signature move: pointer lines, like a field guide plate's, drawn from
   * the box on the photo to the analysed crop and to the name on the facing
   * column. They draw in when a result lands and follow the box as it moves.
   */
  interface Props {
    container: HTMLElement | null;
    from: HTMLElement | null;
    to: (HTMLElement | null)[];
    /** Changes when a new result lands, to replay the draw-in. */
    drawKey: unknown;
  }
  let { container, from, to, drawKey }: Props = $props();

  let lines = $state<{ x1: number; y1: number; x2: number; y2: number }[]>([]);
  let size = $state({ w: 0, h: 0 });
  let drawn = $state(false);

  function measure(): void {
    if (!container || !from) {
      lines = [];
      return;
    }
    const c = container.getBoundingClientRect();
    const b = from.getBoundingClientRect();
    size = { w: c.width, h: c.height };
    const targets = to.filter((t): t is HTMLElement => Boolean(t));
    // Stacked (narrow) layouts have the results below the photo: no lines.
    if (!targets.length || targets.some((t) => t.getBoundingClientRect().left < b.right + 24)) {
      lines = [];
      return;
    }
    lines = targets.map((t, i) => {
      const r = t.getBoundingClientRect();
      const y1 = b.top + b.height * (targets.length === 1 ? 0.5 : (i + 1) / (targets.length + 1));
      const y2 = r.top + Math.min(r.height / 2, 28);
      return { x1: b.right - c.left, y1: y1 - c.top, x2: r.left - c.left - 12, y2: y2 - c.top };
    });
  }

  $effect(() => {
    void drawKey;
    void from;
    void to;
    measure();
    drawn = false;
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => (drawn = true)));
    return () => cancelAnimationFrame(raf);
  });

  $effect(() => {
    if (!container) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    const mo = new MutationObserver(() => measure());
    if (from) mo.observe(from, { attributes: true, attributeFilter: ['style'] });
    addEventListener('resize', measure);
    addEventListener('scroll', measure, true);
    return () => {
      ro.disconnect();
      mo.disconnect();
      removeEventListener('resize', measure);
      removeEventListener('scroll', measure, true);
    };
  });
</script>

{#if lines.length}
  <svg class="leaders" class:drawn width={size.w} height={size.h} aria-hidden="true">
    {#each lines as l, i (i)}
      <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} pathLength="1" style="transition-delay:{i * 120}ms" />
      <circle cx={l.x1} cy={l.y1} r="4.5" />
      <circle class="end" cx={l.x2} cy={l.y2} r="4.5" style="transition-delay:{i * 120 + 420}ms" />
    {/each}
  </svg>
{/if}

<style>
  .leaders {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
    z-index: 2;
  }
  line {
    stroke: var(--lime);
    stroke-width: 2;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    filter: drop-shadow(0 0 0.6px rgb(28 23 38 / 90%));
    transition: stroke-dashoffset 560ms var(--ease-out);
  }
  circle {
    fill: var(--lime);
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .end {
    opacity: 0;
    transition: opacity 200ms var(--ease-out);
  }
  .drawn line {
    stroke-dashoffset: 0;
  }
  .drawn .end {
    opacity: 1;
  }
</style>
