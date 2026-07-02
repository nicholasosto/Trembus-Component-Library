import type { ComponentContract } from '../../types/contract';

export const menuContract: ComponentContract = {
  name: 'Menu',
  leadJob: 'afford-action',
  jobs: {
    revealState: {
      satisfiedBy:
        'the trigger exposes aria-expanded; content is role=menu (named by an optional Menu.Label) with menuitems; submenu triggers add aria-haspopup/expanded; disabled items are aria-disabled; a menu can open upward (side="top").',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'a button affordance (aria-haspopup=menu) that opens a command set in a portal; rows with alternates open a nested submenu (→ or click) — the accessible replacement for hover-only actions.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'Arrow/Home/End roving focus; Enter/Space selects and collapses the whole tree; → opens a submenu and ←/Esc backs out one level; Tab and outside-press dismiss; closing returns focus to the trigger.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'menu',
    keyboard: [
      'ArrowDown',
      'ArrowUp',
      'ArrowRight',
      'ArrowLeft',
      'Home',
      'End',
      'Enter',
      'Escape',
      'Tab',
    ],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-surface-raised',
    '--tcl-elevation-2',
    '--tcl-z-dropdown',
    '--tcl-surface-hover',
    '--tcl-border',
    '--tcl-text-dim',
  ],
};

export default menuContract;
