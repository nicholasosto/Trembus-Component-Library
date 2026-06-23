import type { ComponentContract } from '../../types/contract';

export const iconButtonContract: ComponentContract = {
  name: 'IconButton',
  leadJob: 'afford-action',
  jobs: {
    revealState: {
      satisfiedBy: 'inherits Button data-state (hover/pressed/disabled) + loading→aria-busy.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'a square, visible affordance for one icon; requires aria-label so the capability is named and reachable.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy: 'Pressable FSM feedback; focus-visible ring; Enter/Space activate.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'button', keyboard: ['Enter', 'Space'], focusRing: true },
  tokensUsed: ['--tcl-accent', '--tcl-status-*', '--tcl-radius-md'],
};

export default iconButtonContract;
