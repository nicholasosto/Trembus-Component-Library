import type { ComponentContract } from '../../types/contract';

export const sparklineContract: ComponentContract = {
  name: 'Sparkline',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'plots a series as one word-sized trend path inside a fixed box; slope and the marked last point make the trajectory perceivable at a glance, tone-colored to the ontology.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'presentational — it reports a trend; pair it with a Stat value or a table cell that owns the affordance.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'takes no input; when given a label it exposes the trend to assistive tech as role=img with a title, else it is decorative (aria-hidden).',
      story: 'Labeled',
    },
  },
  a11y: { role: 'img', focusRing: false },
  tokensUsed: ['--tcl-accent', '--tcl-status-*', '--tcl-bg'],
};

export default sparklineContract;
