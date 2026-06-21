import type { ComponentContract } from '../../types/contract';

export const tabsContract: ComponentContract = {
  name: 'Tabs',
  leadJob: 'afford-action',
  jobs: {
    revealState: {
      satisfiedBy:
        'aria-selected + data-state mark the active tab; only the matching panel is shown, others hidden.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'tabs are real buttons in a role=tablist; clicking one switches the visible panel.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'roving tabindex + Arrow/Home/End move focus and activate; focus ring on the active tab.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'tablist',
    keyboard: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'],
    focusRing: true,
  },
  tokensUsed: ['--tcl-accent', '--tcl-border', '--tcl-text-dim'],
};

export default tabsContract;
