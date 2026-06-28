/**
 * The beat sheet for the Command-Center demo. One persistent app shell; every phase
 * is derived from the global frame (the repo's golden rule — motion is a pure
 * function of `useCurrentFrame()`, never a component's own CSS transition).
 */

export const FPS = 30;

/** Step ids in execution order — MUST match the swimlane steps in `data.ts`. */
export const STEP_IDS = ['define', 'spec', 'approve', 'measure', 'deploy', 'visual'] as const;
export const STEP_COUNT = STEP_IDS.length;

export const NEW_CMD = '/new workflow createKPI';
export const START_CMD = '/start workflow';

/** Phase frame markers (at 30fps). */
export const T = {
  // boot
  bootIn: 0,
  // ⌘K · /new workflow createKPI
  newPaletteIn: 45,
  newTypeStart: 62,
  newTypeEnd: 132,
  newEnter: 142,
  newPaletteOut: 152,
  // the swimlane is created
  swimlaneIn: 152,
  toastIn: 166,
  toastOut: 250,
  // ⌘K · /start workflow
  startPaletteIn: 276,
  startTypeStart: 292,
  startTypeEnd: 338,
  startEnter: 350,
  startPaletteOut: 362,
  // execution — the steps light up
  execStart: 368,
  perStep: 30,
  // the run-history record appears
  runPanelIn: 374,
  // tail
  total: 700,
} as const;

export const EXEC_END = T.execStart + STEP_COUNT * T.perStep; // 368 + 180 = 548

export interface ExecState {
  started: boolean;
  /** number of fully-completed steps */
  done: number;
  /** index of the step currently running (−1 before start, STEP_COUNT when finished) */
  activeIndex: number;
  finished: boolean;
}

export function execState(frame: number): ExecState {
  if (frame < T.execStart) return { started: false, done: 0, activeIndex: -1, finished: false };
  const elapsed = frame - T.execStart;
  const done = Math.min(STEP_COUNT, Math.floor(elapsed / T.perStep));
  const finished = done >= STEP_COUNT;
  return { started: true, done, activeIndex: finished ? STEP_COUNT : done, finished };
}

/** How many characters of `text` are typed at `frame` over [start, end]. */
export function typedCount(frame: number, text: string, start: number, end: number): number {
  if (frame <= start) return 0;
  if (frame >= end) return text.length;
  return Math.round(((frame - start) / (end - start)) * text.length);
}
