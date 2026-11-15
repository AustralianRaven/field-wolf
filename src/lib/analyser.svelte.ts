/** The page side of the analyser worker: one worker for the app, the latest request wins. */
import type { Kingdom } from './config';
import { setup } from './setup.svelte';
import type { Ranking } from './rank';
import type { Box } from './region';
import type { WorkerIn, WorkerOut } from './worker/identify.worker';

let worker: Worker | null = null;
// eslint-disable-next-line svelte/prefer-svelte-reactivity -- plain listener registry, never rendered
const listeners = new Set<(m: WorkerOut) => void>();

let sentModel: Blob | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./worker/identify.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<WorkerOut>) => listeners.forEach((l) => l(e.data));
  }
  // A model the browser would not store lives in this tab: give the worker a reference to it.
  if (setup.sessionModel && setup.sessionModel !== sentModel) {
    sentModel = setup.sessionModel;
    worker.postMessage({ type: 'model', blob: sentModel } satisfies WorkerIn);
  }
  return worker;
}

export type AnalyserState = 'idle' | 'working' | 'done' | 'error';

export class Analyser {
  state = $state<AnalyserState>('idle');
  ranking = $state<Ranking | null>(null);
  ms = $state(0);
  error = $state<string | null>(null);
  notSetUp = $state(false);
  private seq = 0;
  private off: () => void;

  constructor(private kingdom: Kingdom) {
    const onMessage = (m: WorkerOut) => {
      if (m.type === 'error' && (m.id === null || m.id === this.seq)) {
        this.state = 'error';
        this.error = m.message;
        this.notSetUp = Boolean(m.notSetUp);
      } else if (m.type === 'result' && m.id === this.seq) {
        this.state = 'done';
        this.ranking = m.ranking;
        this.ms = m.ms;
      }
    };
    listeners.add(onMessage);
    this.off = () => listeners.delete(onMessage);
  }

  /** Start loading the model and this kingdom's tables before the first photo arrives. */
  warm(): void {
    getWorker().postMessage({ type: 'init', kingdom: this.kingdom } satisfies WorkerIn);
  }

  identify(photo: Blob, box: Box | null, region: number | null): void {
    this.seq += 1;
    this.state = 'working';
    this.error = null;
    // The box may be a reactive proxy, which a worker cannot receive: send a plain copy.
    const plain = box ? $state.snapshot(box) : null;
    getWorker().postMessage({ type: 'identify', id: this.seq, kingdom: this.kingdom, photo, box: plain, region } satisfies WorkerIn);
  }

  reset(): void {
    this.seq += 1;
    this.state = 'idle';
    this.ranking = null;
    this.error = null;
  }

  destroy(): void {
    this.off();
  }
}
