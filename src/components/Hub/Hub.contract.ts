import type { ComponentContract } from '../../types/contract';

export const hubContract: ComponentContract = {
  name: 'Hub',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'maps a domain topology to a hex flower; each tile is color-coded by kind (center/shipped/current/planned) with a status badge.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy: 'every tile is a button; selecting one inspects its detail in the panel.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a tile (aria-pressed) and reveals its note in a live (aria-live) inspector; focus ring.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: ['--tcl-accent', '--tcl-status-*', '--tcl-surface-sunken', '--tcl-font-mono'],
};

export default hubContract;
