import type { ComponentContract } from '@trembus/tokens/contract';

export const strataContract: ComponentContract = {
  name: 'Strata',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'a concentric strata layout encodes dependency layering — bedrock axioms fill the innermost ring and every principle that restsOn them layers outward (radius = fundamentality, computed from the longest support chain); arc fill fades with distance from bedrock, dashed arcs mark conjectures, and supports that are referenced but never articulated auto-materialize as dashed GAP arcs in the ring beneath their referencer — undiscovered ground surfaced as an opportunity.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every arc — established, conjecture, or gap — is a focusable HTML core-sample button at its centroid carrying the accessible name (label + sub + layer + kind) over the decorative aria-hidden SVG; a text legend states the dashed vocabulary in words, and the live inspector names each selection’s direct supports both ways.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects an arc (aria-pressed), rings it in its own tone, highlights its foundation cone (everything beneath it) and its load cone (everything that would collapse with it), reveals its direct support connectors, and announces layer, foundation/load counts, named rests-on/supports lists, and notes in an aria-live inspector.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-focus-ring',
    '--tcl-surface',
    '--tcl-surface-sunken',
    '--tcl-border',
    '--tcl-border-strong',
    '--tcl-bg',
    '--tcl-text',
    '--tcl-font-mono',
  ],
};

export default strataContract;
