import type { ComponentContract } from '@trembus/tokens/contract';

export const treeContract: ComponentContract = {
  name: 'Tree',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'parent→child structure is drawn as node-link edges in a tidy (Reingold–Tilford) or aligned-leaf dendrogram layout; depth and branching are perceivable, nodes are color-coded by tone or depth, and selecting a node highlights its ancestor path to the root.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every node is a focusable HTML button whose accessible name encodes its level and path-to-root; nodes with children expose a separate expand/collapse control with aria-expanded.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a node (aria-pressed), rings it, emphasizes its lineage edges, and reveals its label, sub, value, ancestry, and note in a live (aria-live) inspector; toggling a subtree flips aria-expanded and re-runs the layout.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-focus-ring',
    '--tcl-surface',
    '--tcl-surface-raised',
    '--tcl-border',
    '--tcl-border-soft',
    '--tcl-bg',
    '--tcl-text',
    '--tcl-font-mono',
  ],
};

export default treeContract;
