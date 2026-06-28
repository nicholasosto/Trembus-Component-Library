import type {
  RunHistoryContract,
  RunStepOutcome,
  SwimlaneContract,
  SwimlaneStatus,
} from '@trembus/ui';
import { STEP_IDS, STEP_COUNT } from './timeline';

/**
 * The `createKPI` workflow — a human ↔ agent ↔ Fabric loop that mirrors the
 * delivery-ops "build a KPI" flow (idea → spec → DAX measure → Fabric model →
 * visual). Authored once; the per-frame status is layered on at render time.
 */
const LANES = [
  { id: 'you', label: 'You', kind: 'human' as const },
  { id: 'agent', label: 'Agent', kind: 'ai' as const },
  { id: 'fabric', label: 'Fabric', kind: 'tool' as const },
];

const STEPS: { id: (typeof STEP_IDS)[number]; lane: string; label: string; detail?: string }[] = [
  { id: 'define', lane: 'you', label: 'Define metric', detail: 'plain language' },
  { id: 'spec', lane: 'agent', label: 'Draft KPI spec', detail: 'reads the model' },
  { id: 'approve', lane: 'you', label: 'Approve spec' },
  { id: 'measure', lane: 'agent', label: 'Build measure', detail: 'DAX' },
  { id: 'deploy', lane: 'fabric', label: 'Deploy to model' },
  { id: 'visual', lane: 'fabric', label: 'Render visual' },
];

/** Progress → a step's status. `done` steps stay lit; the current step is `active`. */
function statusAt(i: number, done: number, finished: boolean): SwimlaneStatus {
  if (finished || i < done) return 'done';
  if (i === done) return 'active';
  return 'pending';
}

/** The swimlane contract for the current execution progress. */
export function buildSwimlane(done: number, finished: boolean): SwimlaneContract {
  return {
    view: 'swimlane',
    brand: 'Trembus',
    code: 'workflow.createKPI',
    title: 'createKPI',
    caption: 'A human ↔ agent ↔ Fabric loop. Each step hands off to the next.',
    lanes: LANES,
    steps: STEPS.map((s, i) => ({
      id: s.id,
      lane: s.lane,
      label: s.label,
      detail: s.detail,
      status: statusAt(i, done, finished),
      note:
        s.id === 'measure'
          ? 'The agent authors the DAX measure and validates it against the model.'
          : s.id === 'deploy'
            ? 'The measure is published to the Revenue semantic model.'
            : undefined,
    })),
  };
}

/** The id of the step to select (so its connector edges light during the run). */
export function activeStepId(done: number, finished: boolean): string | undefined {
  if (finished) return STEP_IDS[STEP_COUNT - 1];
  if (done < 0 || done >= STEP_COUNT) return undefined;
  return STEP_IDS[done];
}

// One captured "now" so the run reads "just now" without per-frame drift.
const BOOT = Date.now();
const RUN_ID = 'run-001';

/** The run-history contract — one record that tracks the live execution. */
export function buildRunHistory(done: number, finished: boolean): RunHistoryContract {
  const stepOutcomes: RunStepOutcome[] = STEP_IDS.map((step, i) => ({
    step,
    status: statusAt(i, done, finished),
  }));
  return {
    view: 'run-history',
    brand: 'Trembus',
    code: 'workflow.createKPI.runs',
    title: 'Run history',
    runs: [
      {
        id: RUN_ID,
        label: '#001',
        status: finished ? 'succeeded' : 'running',
        startedAt: BOOT,
        durationMs: finished ? 4 * 60_000 + 12_000 : undefined,
        trigger: 'manual',
        note: finished
          ? 'Deployed createKPI to the Revenue semantic model.'
          : 'In flight — building the measure…',
        stepOutcomes,
        outputs: finished
          ? [
              { label: 'createKPI.dax', href: '#', kind: 'doc' },
              { label: 'PR #501', href: '#', kind: 'pr' },
              { label: 'KPI · createKPI', href: '#', kind: 'deploy' },
            ]
          : [{ label: 'live log', href: '#', kind: 'log' }],
      },
    ],
  };
}

export const RUN_SELECTED_ID = RUN_ID;
