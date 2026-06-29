import type { ComponentContract } from '../../types/contract';

export const breadcrumbContract: ComponentContract = {
  name: 'Breadcrumb',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'the trail marks the current page with aria-current="page" and a distinct weight/color, revealing where you are in the hierarchy relative to its ancestors.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'each ancestor crumb is a real link (a plain href or a wrapped router link via asChild) the user can activate to navigate up a level.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'ancestor links carry the library focus ring and underline on hover; the current crumb is an inert <span>, not a link, so it cannot be mis-activated.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'navigation', focusRing: true },
  tokensUsed: ['--tcl-text', '--tcl-text-dim', '--tcl-text-faint'],
};

export default breadcrumbContract;
