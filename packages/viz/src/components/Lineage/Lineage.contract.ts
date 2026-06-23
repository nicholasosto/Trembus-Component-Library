import type { ComponentContract } from '@trembus/tokens/contract';

export const lineageContract: ComponentContract = {
  name: 'Lineage',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'a layered (Dagre) layout draws the directed graph so flow direction (arrowheads) and dependency depth are perceivable; nodes are color-coded by tone or kind, edges can be dashed for weak/inferred links.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every node is a focusable HTML button carrying its accessible name (label + sub + kind); the directed edges + the live inspector expose each node’s upstream/downstream connections.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a node (aria-pressed), rings it, highlights its full upstream+downstream lineage (and dims the rest), and reveals its label, sub, kind, note, and connection counts in a live (aria-live) inspector.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-focus-ring',
    '--tcl-surface',
    '--tcl-border',
    '--tcl-border-strong',
    '--tcl-bg',
    '--tcl-text',
    '--tcl-font-mono',
  ],
};

export default lineageContract;
