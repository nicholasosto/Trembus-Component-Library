import type { ComponentContract } from '../../types/contract';

export const inputContract: ComponentContract = {
  name: 'Input',
  leadJob: 'acknowledge-input',
  jobs: {
    revealState: {
      satisfiedBy:
        'reflects value, disabled, and invalid (aria-invalid + error text wired via aria-describedby).',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'a labeled, focusable text field with a clear editable affordance; clicking the label focuses it.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'focus-within ring + border change on focus; the live error message is announced via role="alert".',
      story: 'Interaction',
    },
  },
  a11y: { role: 'textbox', keyboard: ['Tab'], focusRing: true },
  tokensUsed: ['--tcl-border-strong', '--tcl-accent', '--tcl-status-danger', '--tcl-radius-md'],
};

export default inputContract;
