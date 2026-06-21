import type { ComponentContract } from '../../types/contract';

export const selectContract: ComponentContract = {
  name: 'Select',
  leadJob: 'acknowledge-input',
  jobs: {
    revealState: {
      satisfiedBy: 'shows the selected option; reflects disabled and invalid (aria-invalid + error).',
      story: 'States',
    },
    affordAction: {
      satisfiedBy: 'a labeled native <select> that discloses its options on activation.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy: 'selection updates the value; focus-within ring; the error is announced via role="alert".',
      story: 'Interaction',
    },
  },
  a11y: { role: 'combobox', keyboard: ['ArrowUp', 'ArrowDown', 'Enter', 'Space'], focusRing: true },
  tokensUsed: ['--tcl-border-strong', '--tcl-accent', '--tcl-status-danger', '--tcl-radius-md'],
};

export default selectContract;
