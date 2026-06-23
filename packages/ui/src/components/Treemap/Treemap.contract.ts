import type { ComponentContract } from '../../types/contract';

export const treemapContract: ComponentContract = {
  name: 'Treemap',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'a squarified layout sizes every node to its share of the whole, so relative magnitude is read directly from area; cells are color-coded by tone and labelled when large enough.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every cell is a button overlaid by percentage on the tiling; selecting one inspects its value, share, secondary label, and note in the panel.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a cell (aria-pressed), rings it, and reveals its detail in a live (aria-live) inspector; focus ring on the cell button.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-focus-ring',
    '--tcl-surface',
    '--tcl-surface-sunken',
    '--tcl-bg',
    '--tcl-font-mono',
  ],
};

export default treemapContract;
