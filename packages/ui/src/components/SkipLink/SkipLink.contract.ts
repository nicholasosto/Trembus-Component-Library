import type { ComponentContract } from '../../types/contract';

export const skipLinkContract: ComponentContract = {
  name: 'SkipLink',
  leadJob: 'afford-action',
  jobs: {
    revealState: {
      satisfiedBy:
        'visually hidden until focused, then it un-hides at the top-left so a keyboard user perceives the bypass shortcut is available.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'a real <a href="#main"> that jumps focus straight to the main landmark, bypassing the nav (WCAG 2.4.1 Bypass Blocks).',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'on focus it reveals itself and gains the library focus ring (acknowledging the Tab); activating it moves focus to the target.',
      story: 'Interaction',
    },
  },
  a11y: { focusRing: true },
  tokensUsed: ['--tcl-surface-raised', '--tcl-text', '--tcl-border'],
};

export default skipLinkContract;
