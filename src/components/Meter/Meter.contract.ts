import type { ComponentContract } from '../../types/contract';

export const meterContract: ComponentContract = {
  name: 'Meter',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'reports a measurement on a track (role=meter, aria-valuenow); threshold recolors as the value crosses markers; stacked shows proportions.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy: 'a read-out, not an action — it presents a measured quantity, not a control.',
      story: 'Variants',
    },
    acknowledgeInput: {
      satisfiedBy:
        'no input; the measurement (and per-segment breakdown) is exposed via aria-valuenow / aria-valuetext.',
      story: 'States',
    },
  },
  a11y: { role: 'meter', focusRing: false },
  tokensUsed: ['--tcl-status-*', '--tcl-accent', '--tcl-surface-sunken', '--tcl-radius-full'],
};

export default meterContract;
