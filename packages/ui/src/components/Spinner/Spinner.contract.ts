import type { ComponentContract } from '../../types/contract';

export const spinnerContract: ComponentContract = {
  name: 'Spinner',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy: 'communicates a busy/loading state; role=status with a screen-reader label.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy: 'presentational — pairs with a disabled/loading affordance (e.g. Button loading).',
      story: 'Sizes',
    },
    acknowledgeInput: {
      satisfiedBy: 'no input; announces the busy state politely via the status role.',
      story: 'Tones',
    },
  },
  a11y: { role: 'status', focusRing: false },
  tokensUsed: ['--tcl-accent', '--tcl-status-*'],
};

export default spinnerContract;
