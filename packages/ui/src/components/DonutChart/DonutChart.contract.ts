import type { ComponentContract } from '../../types/contract';

export const donutChartContract: ComponentContract = {
  name: 'DonutChart',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'draws each part as a ring segment proportional to its share, with the total in the center and a legend listing every part and its percent.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'each legend row is a button; selecting one emphasizes its ring segment, dims the rest, and swaps the center readout to that part.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a part (aria-pressed), rings the legend row, and reveals its value and share in a live (aria-live) inspector.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-surface',
    '--tcl-focus-ring',
    '--tcl-font-mono',
  ],
};

export default donutChartContract;
