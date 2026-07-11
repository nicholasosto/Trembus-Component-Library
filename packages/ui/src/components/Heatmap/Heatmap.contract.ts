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
        'every populated cell is a focusable button; in selectionMode="row" each row is instead one focusable button whose accessible name enumerates every column/value pair with its unit, leaving cells decorative and resolving duplicate explicit row ids first-authored-wins. No-data cells are named, non-interactive placeholders in cell mode.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a cell (aria-pressed) or a row (aria-current="true" + accent rail), and reveals the selection in a live inspector; row inspection exposes every column/value pair, and the full announcement remains available when visible chrome is off.',
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
