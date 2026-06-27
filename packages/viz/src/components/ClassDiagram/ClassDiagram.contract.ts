import type { ComponentContract } from '@trembus/tokens/contract';

export const classDiagramContract: ComponentContract = {
  name: 'ClassDiagram',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'a layered (Dagre) layout draws each class as a compartmented box (name + stereotype · attributes · methods) connected by typed relationships whose arrowheads encode the kind — inheritance/realization (hollow triangle), composition (filled diamond), aggregation (hollow diamond), association/dependency (open arrow), with dashed lines for realization and dependency.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every class is a focusable HTML button carrying its accessible name (name + stereotype + attribute/method counts); the typed edges + the live inspector expose each class’s relationships and members.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a class (aria-pressed), rings it, emphasizes its related classes (muting the rest without dimming any focusable node), and reveals its attributes, methods, relationships (named with UML verbs), and note in a live (aria-live) inspector.',
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
    '--tcl-text-faint',
    '--tcl-bg',
    '--tcl-text',
    '--tcl-font-mono',
  ],
};

export default classDiagramContract;
