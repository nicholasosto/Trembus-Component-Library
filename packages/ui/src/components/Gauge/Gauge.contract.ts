import type { ComponentContract } from '../../types/contract';

export const gaugeContract: ComponentContract = {
  name: 'Gauge',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'draws a value as a needle on a 180° dial against optional colored quality bands and a target tick, with the value and metric name read out in the centre.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'presentational — it reports a single measurement; pair it with a Stat or controls. The colored bands label the quality thresholds.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'takes no input; the value and the band it falls in are exposed to assistive tech via role=meter with aria-valuenow/min/max and an aria-valuetext.',
      story: 'Zones',
    },
  },
  a11y: { role: 'meter', focusRing: false },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-surface-sunken',
    '--tcl-text',
    '--tcl-font-mono',
  ],
};

export default gaugeContract;
