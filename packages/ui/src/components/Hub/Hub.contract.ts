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
      satisfiedBy:
        'tiles use one roving tab stop; Arrow keys move in DOM order, Home/End jump endpoints, and selecting one inspects its detail.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'pointer or Enter/Space selection updates aria-pressed and the roving focus target, then reveals detail in a live inspector; focus ring.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'group',
    keyboard: ['Tab', 'Arrow keys', 'Home', 'End', 'Enter', 'Space'],
    focusRing: true,
  },
  tokensUsed: ['--tcl-accent', '--tcl-status-*', '--tcl-surface-sunken', '--tcl-font-mono'],
};

export default hubContract;
