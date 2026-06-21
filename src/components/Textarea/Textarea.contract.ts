import type { ComponentContract } from '../../types/contract';

export const textareaContract: ComponentContract = {
  name: 'Textarea',
  leadJob: 'acknowledge-input',
  jobs: {
    revealState: {
      satisfiedBy: 'reflects value, disabled, and invalid (aria-invalid + announced error).',
      story: 'States',
    },
    affordAction: {
      satisfiedBy: 'a labeled, resizable multiline editable field; clicking the label focuses it.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy: 'focus ring on focus; typed input is echoed; the live error is announced via role="alert".',
      story: 'Interaction',
    },
  },
  a11y: { role: 'textbox', keyboard: ['Tab'], focusRing: true },
  tokensUsed: ['--tcl-border-strong', '--tcl-accent', '--tcl-status-danger', '--tcl-radius-md'],
};

export default textareaContract;
