import type { ComponentContract } from '../../types/contract';

export const radioGroupContract: ComponentContract = {
  name: 'RadioGroup',
  leadJob: 'acknowledge-input',
  jobs: {
    revealState: {
      satisfiedBy: 'the selected option is filled; disabled options are dimmed; group labelled via aria-labelledby.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy: 'a labeled set of radios (role=radiogroup); each label is a click target.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy: 'click or Arrow keys (native radios) select an option and move focus; focus ring on the dot.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'radiogroup', keyboard: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'], focusRing: true },
  tokensUsed: ['--tcl-accent', '--tcl-border-strong'],
};

export default radioGroupContract;
