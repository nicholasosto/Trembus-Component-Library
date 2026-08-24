import type { ComponentContract } from '../../types/contract';

export const stepperContract: ComponentContract = {
  name: 'Stepper',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'renders an ordered list of steps, each marked done / active / pending / error by node glyph and connector; the active step carries aria-current="step".',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'a read-out, not a control — it reports where a multi-step operation stands; the same model renders at two densities (size sm | md).',
      story: 'Sizes',
    },
    acknowledgeInput: {
      satisfiedBy:
        'no direct input; status is conveyed by glyph plus a visually-hidden status word (never colour alone), and the active step animates a reduced-motion-safe pulse.',
      story: 'States',
    },
  },
  a11y: { role: 'list', focusRing: false },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-success',
    '--tcl-status-danger',
    '--tcl-border',
    '--tcl-text-faint',
  ],
};

export default stepperContract;
