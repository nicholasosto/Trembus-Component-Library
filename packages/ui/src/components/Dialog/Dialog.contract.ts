import type { ComponentContract } from '../../types/contract';

export const dialogContract: ComponentContract = {
  name: 'Dialog',
  leadJob: 'acknowledge-input',
  jobs: {
    revealState: {
      satisfiedBy:
        'open/closed is the projected state; role="dialog" + aria-modal expose it; title/description are labelled.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'focus moves into the dialog on open; the footer hosts the action affordances; Esc/overlay dismiss.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'focus trap keeps Tab inside; Esc closes; focus returns to the trigger on close; background scroll is locked.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'dialog', keyboard: ['Escape', 'Tab', 'Shift+Tab'], focusRing: true },
  tokensUsed: ['--tcl-overlay', '--tcl-surface-raised', '--tcl-elevation-3', '--tcl-z-modal'],
};

export default dialogContract;
