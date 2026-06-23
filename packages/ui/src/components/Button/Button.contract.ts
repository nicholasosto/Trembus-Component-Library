import type { ComponentContract } from '../../types/contract';

export const buttonContract: ComponentContract = {
  name: 'Button',
  leadJob: 'afford-action',
  jobs: {
    revealState: {
      satisfiedBy:
        'data-state (hover/pressed/disabled) + loading→aria-busy; the tone token sets the accent.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'renders a real <button> with a visible filled/outlined affordance and a pointer cursor.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'Pressable FSM emits data-state on hover/press/focus; focus-visible ring; Enter/Space activate.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'button', keyboard: ['Enter', 'Space'], focusRing: true },
  tokensUsed: ['--tcl-accent', '--tcl-status-*', '--tcl-radius-md', '--tcl-space-*'],
};

export default buttonContract;
