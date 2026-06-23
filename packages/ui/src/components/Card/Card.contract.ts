import type { ComponentContract } from '../../types/contract';

export const cardContract: ComponentContract = {
  name: 'Card',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy: 'groups related content into a single perceivable raised surface (header/body/footer).',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy: 'hosts action affordances (e.g. footer buttons); an optional interactive hover state.',
      story: 'Interactive',
    },
    acknowledgeInput: {
      satisfiedBy: 'a static surface; interactive children handle their own input.',
      story: 'Sections',
    },
  },
  a11y: { focusRing: false },
  tokensUsed: ['--tcl-surface-raised', '--tcl-border', '--tcl-radius-lg', '--tcl-elevation-1'],
};

export default cardContract;
