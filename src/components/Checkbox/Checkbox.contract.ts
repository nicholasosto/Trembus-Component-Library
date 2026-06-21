import type { ComponentContract } from '../../types/contract';

export const checkboxContract: ComponentContract = {
  name: 'Checkbox',
  leadJob: 'acknowledge-input',
  jobs: {
    revealState: {
      satisfiedBy: 'checked / unchecked / indeterminate are each shown in the custom box.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy: 'a labeled checkbox; the whole label is the click target.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy: 'Space toggles; the box updates and a focus ring appears on keyboard focus.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'checkbox', keyboard: ['Space'], focusRing: true },
  tokensUsed: ['--tcl-accent', '--tcl-border-strong', '--tcl-radius-sm'],
};

export default checkboxContract;
