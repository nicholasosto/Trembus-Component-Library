import type { ComponentContract } from '@trembus/tokens/contract';

export const constellationContract: ComponentContract = {
  name: 'Constellation',
  leadJob: 'afford-action',
  jobs: {
    revealState: {
      satisfiedBy:
        'A liturgical night-chart skin over the viz TalentTree: the reliquary-dark plate, star-field, and display-serif tier labels frame the same tiered DAG — met vs unmet prerequisite edges, per-node status, and the points meter — re-tinted through the --tcl-talenttree-accent lever per data-tone.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'The interactive spine is the TalentTree’s, passed straight through: every talent is a focusable button (locked ones stay focusable via aria-disabled) and the inspector carries the accessible Add rank / Remove rank buttons. The skin adds only decorative, aria-hidden chrome (brackets, specks).',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'All allocation props pass through unchanged, so click / Enter / Space allocates and Shift+click / - / Delete safely removes, with the same guards and the aria-live inspector announcing each change in words. The skin owns no behaviour.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'group',
    keyboard: [
      'Tab',
      'Enter',
      'Space',
      'Shift+Click',
      '-',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-talenttree-accent',
    '--tcl-accent',
    '--tcl-status-danger',
    '--tcl-surface-sunken',
    '--tcl-font-display',
    '--tcl-tracking-caps',
    '--tcl-text',
    '--tcl-text-dim',
  ],
};

export default constellationContract;
