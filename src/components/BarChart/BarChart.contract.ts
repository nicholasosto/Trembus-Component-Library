import type { ComponentContract } from '../../types/contract';

export const barChartContract: ComponentContract = {
  name: 'BarChart',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'each datum is a bar sized to its value against one shared axis; bars are color-coded by tone, value labels sit on every bar, and optional reference markers draw target/threshold lines.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every bar is a button; selecting one inspects its value, caption, and note in the panel. The same contract renders vertical or horizontal.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a bar (aria-pressed), rings it, and reveals its detail in a live (aria-live) inspector; focus ring on the bar.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-focus-ring',
    '--tcl-surface',
    '--tcl-font-mono',
  ],
};

export default barChartContract;
