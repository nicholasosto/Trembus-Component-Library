import type { ComponentContract } from '../../types/contract';

export const skeletonContract: ComponentContract = {
  name: 'Skeleton',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy: 'represents absent/loading content as a shimmering placeholder of the right shape.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy: 'presentational — replaced by real content + affordances once loaded.',
      story: 'Variants',
    },
    acknowledgeInput: {
      satisfiedBy: 'decorative (aria-hidden); the container that swaps it should set aria-busy.',
      story: 'Composed',
    },
  },
  a11y: { focusRing: false },
  tokensUsed: ['--tcl-surface-sunken', '--tcl-radius-sm', '--tcl-radius-full'],
};

export default skeletonContract;
