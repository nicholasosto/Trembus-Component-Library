import type { ComponentContract } from '../../types/contract';

export const runHistoryContract: ComponentContract = {
  name: 'RunHistory',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'a log built on the public Table where each run is a row revealing its outcome (a status-toned Badge — succeeded/failed/running/… mapped to the tone tokens, distinct from step status), a relative `<time>` when, a tabular-nums duration, a per-status step tally, and an output count — execution history is perceivable at a glance.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        "each run is the Table row's stretched, keyboard-accessible button carrying its full accessible name (run · status · when · duration · steps · outputs); selecting one inspects its note and surfaces its outputs as real `<a>` links. Started/Duration headers are sortable.",
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a run (accent row tint + left rail) and a single aria-live inspector announces it and spells out its outputs/results as tone-coded link chips; sorting re-announces via Table’s aria-sort; focus ring on the row and every link.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'table', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-focus-ring',
    '--tcl-surface',
    '--tcl-surface-raised',
    '--tcl-font-mono',
  ],
};

export default runHistoryContract;
