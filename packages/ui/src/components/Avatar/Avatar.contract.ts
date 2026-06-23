import type { ComponentContract } from '../../types/contract';

export const avatarContract: ComponentContract = {
  name: 'Avatar',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'shows identity: image when available, else initials, else a glyph; role=img provides the name.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy: 'presentational — wrap it in a link/button when it should be actionable.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy: 'no direct input; a failed image load falls back to initials gracefully.',
      story: 'Sizes',
    },
  },
  a11y: { role: 'img', focusRing: false },
  tokensUsed: ['--tcl-surface-sunken', '--tcl-status-*', '--tcl-radius-full'],
};

export default avatarContract;
