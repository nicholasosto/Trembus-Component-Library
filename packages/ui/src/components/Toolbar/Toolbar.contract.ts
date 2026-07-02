import type { ComponentContract } from '../../types/contract';

export const toolbarContract: ComponentContract = {
  name: 'Toolbar',
  leadJob: 'afford-action',
  jobs: {
    revealState: {
      satisfiedBy:
        'the roving tab stop shows which control is current; accent marks the primary action; menu triggers expose aria-expanded and toggles aria-pressed; disabled controls are dimmed.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'a cluster of real focusable controls (Toolbar.Button) under one Tab stop, grouped and divided; a button can also drive a Menu for progressive disclosure.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'roving arrow-key navigation (←/→ or ↑/↓) plus Home/End moves focus; hover/active/focus-visible feedback on each control.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'toolbar',
    keyboard: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-surface-raised',
    '--tcl-surface-hover',
    '--tcl-border',
    '--tcl-elevation-1',
    '--tcl-accent',
    '--tcl-accent-fg',
    '--tcl-text-dim',
  ],
};

export default toolbarContract;
