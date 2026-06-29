import type { ComponentContract } from '../../types/contract';

export const navBarContract: ComponentContract = {
  name: 'NavBar',
  leadJob: 'afford-action',
  jobs: {
    revealState: {
      satisfiedBy:
        'the active destination is marked aria-current="page" — set by NavBar.Link\'s active prop or by a wrapped router NavLink — and tinted to reveal the current section.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'a labelled <nav> of real navigation links (a plain href or a wrapped router link via asChild) the user activates to move between top-level destinations.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'links give hover/background feedback and the library focus ring; keyboard Tab moves between them in DOM order.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'navigation', focusRing: true },
  tokensUsed: ['--tcl-text', '--tcl-text-dim', '--tcl-surface-sunken', '--tcl-accent'],
};

export default navBarContract;
