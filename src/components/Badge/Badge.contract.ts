import type { ComponentContract } from '../../types/contract';

export const badgeContract: ComponentContract = {
  name: 'Badge',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'maps a status tone to the color-coded ontology (success/info/warning/danger/neutral/accent) via tokens.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'non-interactive by design — it reports state; an optional leading dot reinforces the status glyph.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'takes no input; as a status output its label is plain text exposed to assistive tech.',
      story: 'Tones',
    },
  },
  a11y: { focusRing: false },
  tokensUsed: ['--tcl-status-*', '--tcl-accent', '--tcl-radius-full'],
};

export default badgeContract;
