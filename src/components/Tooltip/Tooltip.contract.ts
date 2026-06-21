import type { ComponentContract } from '../../types/contract';

export const tooltipContract: ComponentContract = {
  name: 'Tooltip',
  leadJob: 'acknowledge-input',
  jobs: {
    revealState: {
      satisfiedBy: 'reveals supplemental text bound to the trigger via aria-describedby (role=tooltip).',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy: 'wraps an existing interactive trigger; the tooltip itself is non-interactive.',
      story: 'Sides',
    },
    acknowledgeInput: {
      satisfiedBy: 'opens on hover (delay) and on keyboard focus; Esc / blur / pointer-leave dismiss it.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'tooltip', keyboard: ['Escape'], focusRing: false },
  tokensUsed: ['--tcl-text', '--tcl-bg', '--tcl-elevation-2', '--tcl-z-tooltip'],
};

export default tooltipContract;
