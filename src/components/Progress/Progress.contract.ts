import type { ComponentContract } from '../../types/contract';

export const progressContract: ComponentContract = {
  name: 'Progress',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'fills a track proportional to value/max (role=progressbar, aria-valuenow/min/max); tone maps to the color-coded ontology.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'a read-out, not an action — it reports the progress of the operation it accompanies.',
      story: 'Variants',
    },
    acknowledgeInput: {
      satisfiedBy:
        'no direct input; the fill animates toward new values (reduced-motion-safe) and changes are announced via aria-valuenow.',
      story: 'States',
    },
  },
  a11y: { role: 'progressbar', focusRing: false },
  tokensUsed: ['--tcl-accent', '--tcl-status-*', '--tcl-surface-sunken', '--tcl-radius-full'],
};

export default progressContract;
