import type { ComponentContract } from '../../types/contract';

export const menuContract: ComponentContract = {
  name: 'Menu',
  leadJob: 'afford-action',
  jobs: {
    revealState: {
      satisfiedBy:
        'the trigger exposes aria-expanded; content is role=menu with menuitems; disabled items are aria-disabled.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'a button affordance (aria-haspopup=menu) that opens a command set in a portal.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'Arrow/Home/End roving focus, Enter/Space select; Esc/outside-press/Tab dismiss and return focus to the trigger.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'menu',
    keyboard: ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', 'Escape', 'Tab'],
    focusRing: true,
  },
  tokensUsed: ['--tcl-surface-raised', '--tcl-elevation-2', '--tcl-z-dropdown', '--tcl-surface-hover'],
};

export default menuContract;
