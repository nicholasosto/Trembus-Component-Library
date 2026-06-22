import type { ComponentContract } from '../../types/contract';

export const heatmapContract: ComponentContract = {
  name: 'Heatmap',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'shades each row×column cell by its value on a bucketed or continuous scale, with row/column labels and a scale legend making the pattern perceivable at a glance.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every populated cell is a focusable button; no-data cells render as a hatched, non-interactive placeholder.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a cell (aria-pressed), rings it, and reveals its row, column, and value in a live (aria-live) inspector.',
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
