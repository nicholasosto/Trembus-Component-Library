import type { ComponentContract } from '@trembus/tokens/contract';

export const systemMapContract: ComponentContract = {
  name: 'SystemMap',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'a layered (Dagre) layout draws ONE architecture level — the systems/containers and their typed connections (arrowheads + dashable edges); nodes are color-coded by tone or kind, containers read as openable boundaries with an information-scent badge (their child count), and cross-level connections are aggregated to the visible level.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every node is a focusable HTML button carrying its accessible name (label + stereotype + interfaces + child count); containers add a separate "open" control to drill a level deeper, a breadcrumb exposes every ancestor level, and provided/required ports surface each interface.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a node (aria-pressed), rings it, emphasizes its direct connections (muting the rest — without dimming any focusable node), and reveals its interfaces plus internal and cross-boundary connections in a live (aria-live) inspector; opening a container re-lays-out at the deeper level and updates the breadcrumb.',
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
    '--tcl-surface-sunken',
    '--tcl-border',
    '--tcl-border-strong',
    '--tcl-bg',
    '--tcl-text',
    '--tcl-font-mono',
  ],
};

export default systemMapContract;
