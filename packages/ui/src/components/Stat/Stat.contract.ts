import type { ComponentContract } from '../../types/contract';

export const statContract: ComponentContract = {
  name: 'Stat',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'surfaces a metric as a headline value + unit, a color-coded ▲/▼ delta (with invert for latency metrics), a target/context line, a status badge, and an embedded trend sparkline.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'presentational by default; with onSelect/href the whole card becomes a drill-in button/link with a visible hover affordance.',
      story: 'Interactive',
    },
    acknowledgeInput: {
      satisfiedBy:
        'as a drill-in control it takes focus (focus-visible ring), depresses on :active, and fires onSelect / navigates on click or Enter/Space.',
      story: 'Interaction',
    },
  },
  a11y: { keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-surface-raised',
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-focus-ring',
    '--tcl-font-mono',
  ],
};

export default statContract;
