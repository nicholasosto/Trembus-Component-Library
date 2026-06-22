import type { ComponentContract } from '../../types/contract';

export const funnelContract: ComponentContract = {
  name: 'Funnel',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'each stage is a horizontal bar sized against the top stage on one shared track, color-coded by tone, with the value and its conversion percentage read out beside it — the descending shape makes drop-off perceivable at a glance.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every stage is a button; selecting one inspects its value, conversion versus the top, drop from the previous stage, and note in the panel.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a stage (aria-pressed), highlights its row, and reveals its detail in a live (aria-live) inspector; focus ring on the stage button.',
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
    '--tcl-font-mono',
  ],
};

export default funnelContract;
