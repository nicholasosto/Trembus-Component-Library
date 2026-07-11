import type { ComponentContract } from '../../types/contract';

export const swimlaneContract: ComponentContract = {
  name: 'Swimlane',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'each actor is a lane (row) and each step a status-toned card placed left-to-right by column, with decorative SVG connectors tracing the handoffs as work crosses lanes — who does what, in what order, and where it hands off is perceivable at a glance; status is color-coded via tokens.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every step is a focusable HTML `<button>` carrying its accessible name (actor · step · status); one step is in the Tab order and Arrow keys plus Home/End move through the diagram; selecting one inspects its status, note, and handoff targets in the panel, and lights its connectors.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a step (aria-pressed), rings it, highlights its handoff connectors in the accent, and reveals its detail in a live (aria-live) inspector; focus ring on the step button.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'group',
    keyboard: [
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
      'Enter',
      'Space',
    ],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-focus-ring',
    '--tcl-surface-raised',
    '--tcl-surface-sunken',
    '--tcl-border-strong',
    '--tcl-font-mono',
  ],
};

export default swimlaneContract;
