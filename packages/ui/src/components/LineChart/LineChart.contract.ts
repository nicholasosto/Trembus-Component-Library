import type { ComponentContract } from '../../types/contract';

export const lineChartContract: ComponentContract = {
  name: 'LineChart',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'draws each series as a line on one shared axis with gridlines, an optional dashed target line and shaded tolerance band, and a color-keyed legend — making every trajectory and its relation to the threshold perceivable.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every data point is a real focusable button overlaid on the plot; a legend names each series and its line style.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a point (aria-pressed), rings it, and reveals its series, x-label, value, and note in a live (aria-live) inspector.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-border-soft',
    '--tcl-focus-ring',
    '--tcl-font-mono',
    '--tcl-bg',
  ],
};

export default lineChartContract;
