import type { ComponentContract } from '../../types/contract';

export const heatmapContract: ComponentContract = {
  name: 'Heatmap',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'shades each row×column cell by its value on a bucketed or continuous scale, with row/column labels and a scale legend making the pattern perceivable at a glance. Columns may carry their own tone ramp (columnTones) so one metric reads distinctly from the rest.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every populated cell is a focusable button; in selectionMode="row" each row is instead one focusable button that selects the whole row (a master-detail target), leaving cells decorative. No-data cells render as a hatched, non-interactive placeholder.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a cell (aria-pressed) or a row (aria-current="true" + accent rail), and reveals the selection in a live (aria-live) inspector — which stays a hidden live region even when the visible inspector/scale are turned off so the consumer can drive its own drawer without losing screen-reader feedback.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-surface-sunken',
    '--tcl-focus-ring',
    '--tcl-bg',
  ],
};

export default heatmapContract;
