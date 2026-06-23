import type { ComponentContract } from '../../types/contract';

export const tableContract: ComponentContract = {
  name: 'Table',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'Real <table> semantics (<th scope=col> ties headers to cells); aria-sort marks the sorted column; zebra/hover/[data-selected] backgrounds and an empty state make data state perceivable.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'Sortable headers are real <button>s; selection adds a tri-state checkbox column; href/onClick rows render a stretched, focusable link/button over the whole row.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'Clicking a sort header toggles aria-sort + the caret; Space toggles row and select-all checkboxes; Enter activates a row link; focus rings on every control.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'table',
    keyboard: ['Tab', 'Enter', 'Space'],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-surface',
    '--tcl-surface-hover',
    '--tcl-surface-sunken',
    '--tcl-border-soft',
    '--tcl-border-strong',
    '--tcl-text-dim',
    '--tcl-accent',
    '--tcl-focus-ring',
    '--tcl-z-sticky',
  ],
};

export default tableContract;
