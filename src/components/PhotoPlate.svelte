<script lang="ts">
  /**
   * The visitor's photo, framed as a guide plate, with the box to analyse.
   * Drag to draw a box. Keyboard: focus the photo, press B for a box, arrows
   * move it, Shift+arrows resize it, Delete clears it.
   */
  import { DEFAULT_BOX, boxStyle, dragBox, normaliseBox, nudgeBox, type Box } from '../lib/region';

  interface Props {
    photoUrl: string | null;
    box: Box | null;
    noun: string;
    onFile: (file: File) => void;
    onBox: (box: Box | null, final: boolean) => void;
    /** Where leader lines start: the box, or the whole photo when there is none. */
    anchor?: HTMLElement | null;
  }
  let { photoUrl, box, noun, onFile, onBox, anchor = $bindable(null) }: Props = $props();
  let boxNode = $state<HTMLElement | null>(null);
  let stageNode = $state<HTMLElement | null>(null);
  $effect(() => {
    anchor = boxNode ?? stageNode;
  });

  let input = $state<HTMLInputElement>();
  let img = $state<HTMLImageElement>();
  let start: { x: number; y: number } | null = null;
  let draft = $state<Box | null>(null);
  let dragging = $state(false);
  const shown = $derived(draft ?? box);

  function pick(files: FileList | null | undefined): void {
    const f = files?.[0];
    if (f && f.type.startsWith('image/')) onFile(f);
  }

  function down(e: PointerEvent): void {
    if (e.button !== 0 || !img) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start = { x: e.clientX, y: e.clientY };
    draft = null;
  }
  function move(e: PointerEvent): void {
    if (!start || !img) return;
    draft = normaliseBox(dragBox(start, { x: e.clientX, y: e.clientY }, img.getBoundingClientRect())) ?? draft;
  }
  function up(): void {
    if (!start) return;
    start = null;
    if (draft) onBox(draft, true);
    draft = null;
  }
  function key(e: KeyboardEvent): void {
    if (e.key === 'b' || e.key === 'B') {
      e.preventDefault();
      onBox(box ?? DEFAULT_BOX, true);
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && box) {
      e.preventDefault();
      onBox(null, true);
    } else if (e.key.startsWith('Arrow') && box) {
      e.preventDefault();
      onBox(nudgeBox(box, e.key, e.shiftKey), false);
    }
  }
</script>

<section class="plate" aria-label="Your photo">
  {#if photoUrl}
    <!-- A drawing surface: pointer drags and the keys described in its label draw the box. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <div
      class="frame"
      role="application"
      tabindex="0"
      aria-label="Your photo. Drag to draw a box around the {noun}. Keyboard: B adds a box, arrows move it, Shift and arrows resize it, Delete clears it."
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={up}
      onkeydown={key}
    >
      <div class="stage" bind:this={stageNode}>
        <img bind:this={img} src={photoUrl} alt="" draggable="false" />
        {#if shown}
          <span class="box" bind:this={boxNode} style={boxStyle(shown)}><i class="h tl"></i><i class="h br"></i></span>
        {/if}
      </div>
    </div>
    <p class="cap">
      <span><b class="name">Plate 1</b> · your photo</span>
      <span>{shown ? 'Only the boxed area is analysed. Drag again to redraw it.' : `Drag on the photo to box the ${noun}, or analyse the whole photo.`}</span>
    </p>
  {:else}
    <div
      class="drop"
      class:dragging
      role="button"
      tabindex="0"
      aria-label="Add a photo"
      ondragover={(e) => { e.preventDefault(); dragging = true; }}
      ondragleave={() => (dragging = false)}
      ondrop={(e) => { e.preventDefault(); dragging = false; pick(e.dataTransfer?.files); }}
      onclick={() => input?.click()}
      onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), input?.click())}
    >
      <svg viewBox="0 0 48 48" width="56" height="56" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
        <rect x="6" y="10" width="36" height="28" rx="2" /><circle cx="17" cy="20" r="3.5" /><path d="m6 34 11-10 8 7 6-5 11 9" />
      </svg>
      <strong>Add a photo of a {noun}</strong>
      <span>Drop it here or click to choose one. JPEG, PNG, WebP or HEIC your browser can open.</span>
    </div>
  {/if}
  <input bind:this={input} class="visually-hidden" type="file" accept="image/*" aria-label="Choose a photo" data-testid="photo-input" onchange={(e) => pick((e.currentTarget as HTMLInputElement).files)} />
</section>

<style>
  .plate {
    background: var(--plate);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-plate);
    padding: 16px;
  }
  .frame {
    position: relative;
    display: grid;
    place-items: center;
    background: #ece9f2;
    line-height: 0;
    cursor: crosshair;
    touch-action: none;
    user-select: none;
  }
  .frame img {
    display: block;
    max-width: 100%;
    max-height: min(68vh, 640px);
    pointer-events: none;
  }
  .frame:focus-visible {
    outline-offset: 4px;
  }
  .box {
    position: absolute;
    border: 2px solid var(--lime);
    box-shadow: 0 0 0 1px rgb(28 23 38 / 55%), inset 0 0 0 1px rgb(28 23 38 / 35%), 0 0 0 9999px rgb(28 23 38 / 28%);
    pointer-events: none;
  }
  .stage {
    position: relative;
    overflow: hidden;
  }
  .h {
    position: absolute;
    width: 9px;
    height: 9px;
    background: var(--lime);
    border: 1px solid var(--ink);
  }
  .tl {
    left: -5px;
    top: -5px;
  }
  .br {
    right: -5px;
    bottom: -5px;
  }
  .cap {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 14px;
    font-size: 13px;
    color: var(--muted);
  }
  .cap b {
    font-weight: 600;
    font-size: 15px;
    color: var(--ink);
  }
  .drop {
    display: grid;
    place-items: center;
    align-content: center;
    gap: 10px;
    min-height: clamp(300px, 52vh, 560px);
    padding: 24px;
    text-align: center;
    color: var(--muted);
    border: 2px dashed var(--line-strong);
    background: var(--ground);
    cursor: pointer;
    transition: border-color 160ms var(--ease-out), background-color 160ms var(--ease-out);
  }
  .drop svg {
    color: var(--violet);
  }
  .drop strong {
    color: var(--ink);
    font-size: 18px;
  }
  .drop:hover,
  .drop.dragging {
    border-color: var(--violet);
    background: var(--violet-soft);
  }
  @media (max-width: 600px) {
    .cap {
      flex-direction: column;
      gap: 4px;
    }
  }
</style>
