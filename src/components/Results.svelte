<script lang="ts">
  /** The facing page: the name, its proof crop, an honest confidence, and the runners-up. */
  import type { AnalyserState } from '../lib/analyser.svelte';
  import type { Guess, Ranking } from '../lib/rank';
  import { displayName } from '../lib/names';
  import { cropRect, type Box } from '../lib/region';

  interface Props {
    status: AnalyserState;
    ranking: Ranking | null;
    ms: number;
    error: string | null;
    noun: string;
    photoUrl: string | null;
    box: Box | null;
    hasPhoto: boolean;
    regionName: string;
    thumbEl?: HTMLElement | null;
    nameEl?: HTMLElement | null;
    confEl?: HTMLElement | null;
  }
  let { status, ranking, ms, error, noun, photoUrl, box, hasPhoto, regionName, thumbEl = $bindable(null), nameEl = $bindable(null), confEl = $bindable(null) }: Props = $props();

  let canvas = $state<HTMLCanvasElement>();
  const top = $derived(ranking?.guesses[0] ?? null);
  const verdict = $derived(ranking?.verdict ?? null);

  /** Five fixed steps, so confidence never becomes a free-floating colour. */
  const steps = (score: number) => (score >= 0.8 ? 5 : score >= 0.6 ? 4 : score >= 0.4 ? 3 : score >= 0.2 ? 2 : 1);
  const pct = (s: number) => (s >= 0.995 ? '>99%' : s < 0.01 ? '<1%' : `${Math.round(s * 100)}%`);
  const chip = $derived(
    !verdict ? '' : verdict.level === 'species' ? 'Confident' : verdict.level === 'genus' ? 'Likely genus' : verdict.level === 'family' ? 'Likely family' : 'Not sure',
  );
  const inat = (g: Guess) => `https://www.inaturalist.org/taxa/${g.inatId}`;

  // Draw the analysed area beside the answer, from the same photo and box the model saw.
  $effect(() => {
    if (!canvas || !photoUrl || !ranking) return;
    const img = new Image();
    img.onload = () => {
      const r = cropRect(img.naturalWidth, img.naturalHeight, box);
      const g = canvas?.getContext('2d');
      if (!g || !canvas) return;
      const s = Math.max(canvas.width / r.w, canvas.height / r.h);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.drawImage(img, r.x, r.y, r.w, r.h, (canvas.width - r.w * s) / 2, (canvas.height - r.h * s) / 2, r.w * s, r.h * s);
    };
    img.src = photoUrl;
  });
</script>

<section class="col" aria-live="polite" aria-busy={status === 'working'}>
  {#if status === 'error'}
    <div class="msg err" role="alert">
      <strong>That did not work.</strong>
      <p>{error} Try again, or reload the page.</p>
    </div>
  {:else if !hasPhoto}
    <div class="msg">
      <h2 class="name">What is this {noun}?</h2>
      <p>Add a photo on the left. Box the {noun} if it is small or off to one side, then read its name here.</p>
      <ol>
        <li>Add a photo.</li>
        <li>Drag a box around the {noun}, or use the whole photo.</li>
        <li>Narrow the region if you know where it was taken.</li>
      </ol>
    </div>
  {:else if status === 'working' && !ranking}
    <div class="msg working">
      <span class="spinner" aria-hidden="true"></span>
      <p>Looking through every {noun} family. The first photo takes longest while the model loads.</p>
    </div>
  {:else if ranking && top && verdict}
    <div class="result" class:stale={status === 'working'} data-testid="result" data-top={top.scientific} data-shown={ranking.guesses.map((g) => g.scientific).join('|')}>
      <p class="run" aria-label="Classification">
        <span>{top.class}</span><em aria-hidden="true">›</em><span>{top.order}</span><em aria-hidden="true">›</em><span>{top.family}</span><em aria-hidden="true">›</em><span class="sci">{top.genus}</span>
      </p>

      <div class="answer">
        <figure class="thumb" bind:this={thumbEl}>
          <canvas bind:this={canvas} width="224" height="224" aria-label="The area that was analysed"></canvas>
          <figcaption>Analysed area</figcaption>
        </figure>
        <div class="names" bind:this={nameEl}>
          {#if verdict.level === 'species'}
            <h2 class="common name" data-testid="answer">{displayName(top.common, top.scientific)}</h2>
            <p class="latin sci">{top.scientific}</p>
          {:else if verdict.level === 'genus'}
            <h2 class="common name" data-testid="answer">A kind of <span class="sci">{verdict.name}</span></h2>
            <p class="latin">Most likely <span class="sci">{top.scientific}</span>{top.common ? ` (${displayName(top.common, top.scientific)})` : ''}</p>
          {:else if verdict.level === 'family'}
            <h2 class="common name" data-testid="answer">Something in the family {verdict.name}</h2>
            <p class="latin">Closest: <span class="sci">{top.scientific}</span>{top.common ? ` (${displayName(top.common, top.scientific)})` : ''}</p>
          {:else}
            <h2 class="common name" data-testid="answer">Not sure</h2>
            <p class="latin">The closest names are below, but none is a convincing match.</p>
          {/if}
          <a class="inat" href={inat(top)} target="_blank" rel="noreferrer">Compare photos on iNaturalist</a>
        </div>
      </div>

      <div class="conf" bind:this={confEl}>
        <span class="ramp" role="img" aria-label="Confidence {steps(top.score)} of 5">
          {#each [1, 2, 3, 4, 5] as i (i)}<i class:f={i <= steps(top.score)}></i>{/each}
        </span>
        <span class="pct">{pct(top.score)}</span>
        <span class="chip" class:sure={verdict.level === 'species'}>{chip}</span>
      </div>

      {#if ranking.guesses.length > 1}
        <h3>Other close matches</h3>
        <ol class="others">
          {#each ranking.guesses.slice(1) as g, i (g.inatId)}
            <li>
              <span class="n name">{i + 2}</span>
              <span class="who">
                <a class="c name" href={inat(g)} target="_blank" rel="noreferrer">{displayName(g.common, g.scientific)}</a>
                <span class="s sci">{g.scientific}</span>
              </span>
              <span class="ramp small" aria-hidden="true">{#each [1, 2, 3, 4, 5] as k (k)}<i class:f={k <= steps(g.score)}></i>{/each}</span>
              <span class="p">{pct(g.score)}</span>
            </li>
          {/each}
        </ol>
      {/if}

      <p class="hint">
        Not your {noun}? Tighten the box around just one, or set Region to <b>{regionName === 'Everywhere' ? 'where it was taken' : 'Everywhere'}</b>.
        <span class="time">Analysed in {(ms / 1000).toFixed(1)} s.</span>
      </p>
    </div>
  {/if}
</section>

<style>
  .col {
    min-width: 0;
  }
  .msg {
    display: grid;
    gap: 12px;
    padding-top: 8px;
    color: var(--muted);
  }
  .msg h2 {
    font-size: clamp(28px, 2.8vw, 40px);
    font-weight: 600;
    color: var(--ink);
    line-height: 1.1;
  }
  .msg ol {
    margin: 4px 0 0;
    padding-left: 20px;
    display: grid;
    gap: 4px;
  }
  .msg.err strong {
    color: var(--bad);
    font-size: 18px;
  }
  .working {
    grid-template-columns: auto 1fr;
    align-items: center;
  }
  .spinner {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 3px solid var(--empty);
    border-top-color: var(--violet);
    animation: spin 900ms linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .result {
    display: grid;
    gap: 20px;
    transition: opacity 200ms var(--ease-out);
  }
  .stale {
    opacity: 0.45;
  }
  .run {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 8px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--ink);
    font-size: 12px;
    line-height: 20px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--violet);
    font-weight: 600;
  }
  .run span:last-child {
    color: var(--ink);
    text-transform: none;
    letter-spacing: 0;
    font-size: 15px;
  }
  .run em {
    font-style: normal;
    color: #a99bc2;
  }
  .answer {
    display: grid;
    grid-template-columns: 112px 1fr;
    gap: 24px;
    align-items: start;
  }
  .thumb {
    margin: 0;
  }
  .thumb canvas {
    display: block;
    width: 112px;
    height: 112px;
    border: 2px solid var(--lime);
    outline: 1px solid var(--ink);
    background: var(--empty);
  }
  figcaption {
    margin-top: 8px;
    font-size: 11px;
    line-height: 14px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 600;
  }
  .names {
    display: grid;
    gap: 6px;
    min-width: 0;
  }
  .common {
    font-weight: 600;
    font-size: clamp(30px, 2.9vw, 42px);
    line-height: 1.08;
    letter-spacing: -0.01em;
  }
  .latin {
    font-size: 20px;
    color: #3a3249;
  }
  .inat {
    font-size: 14px;
    font-weight: 600;
    justify-self: start;
    margin-top: 4px;
  }
  .conf {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .ramp {
    display: flex;
    gap: 4px;
  }
  .ramp i {
    width: 40px;
    height: 10px;
    background: var(--empty);
  }
  .ramp i.f {
    background: var(--violet);
  }
  .ramp.small i {
    width: 18px;
    height: 6px;
  }
  .pct {
    font-weight: 700;
    font-size: 16px;
  }
  .chip {
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: 700;
    background: var(--empty);
    color: var(--ink);
  }
  .chip.sure {
    background: var(--lime);
    color: var(--lime-ink);
  }
  h3 {
    margin-top: 4px;
    padding-top: 16px;
    border-top: 1px solid var(--line);
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
  }
  .others {
    list-style: none;
    margin: -8px 0 0;
    padding: 0;
  }
  .others li {
    display: grid;
    grid-template-columns: 32px 1fr auto 48px;
    gap: 12px;
    align-items: center;
    min-height: 68px;
    border-bottom: 1px solid var(--line);
  }
  .n {
    font-size: 18px;
    color: var(--muted);
  }
  .who {
    display: grid;
    min-width: 0;
  }
  .c {
    font-weight: 600;
    font-size: 19px;
    color: var(--ink);
    text-decoration: none;
  }
  .c:hover {
    color: var(--violet);
    text-decoration: underline;
  }
  .s {
    font-size: 15px;
    color: var(--muted);
  }
  .p {
    text-align: right;
    font-weight: 600;
    color: var(--muted);
  }
  .hint {
    font-size: 14px;
    color: var(--muted);
  }
  .hint b {
    color: var(--violet);
  }
  .time {
    display: block;
    margin-top: 4px;
    font-size: 12px;
  }
  @media (max-width: 520px) {
    .answer {
      grid-template-columns: 80px 1fr;
      gap: 16px;
    }
    .thumb canvas {
      width: 80px;
      height: 80px;
    }
    .ramp i {
      width: 28px;
    }
    .others li {
      grid-template-columns: 24px 1fr 44px;
    }
    .others .ramp {
      display: none;
    }
  }
</style>
