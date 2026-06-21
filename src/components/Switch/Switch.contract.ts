import type { ComponentContract } from '../../types/contract';

export const switchContract: ComponentContract = {
  name: 'Switch',
  leadJob: 'acknowledge-input',
  jobs: {
    revealState: {
      satisfiedBy: 'on/off is shown by the thumb position + track color (role=switch, aria-checked).',
      story: 'States',
    },
    affordAction: {
      satisfiedBy: 'a labeled toggle; the whole label is the click target.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy: 'Space/click toggles; the thumb slides and a focus ring appears on keyboard focus.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'switch', keyboard: ['Space'], focusRing: true },
  tokensUsed: ['--tcl-accent', '--tcl-border-strong', '--tcl-radius-full', '--tcl-elevation-1'],
};

export default switchContract;
