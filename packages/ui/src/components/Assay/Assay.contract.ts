import type { ComponentContract } from '../../types/contract';

export const assayContract: ComponentContract = {
  name: 'Assay',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'The weighted math is visible geometry — each criterion’s track length is its weight and the fill is its score (ink = contribution), penalties claw back in danger red, totals sit on a banded verdict scale, and the card footer prints the literal equation with the weights sum (normalization is disclosed, never silent).',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'On the board every candidate row is a real focusable HTML button (roving tabindex, Arrow/Home/End) whose press assays it; rank numbers, hover surfaces, and the selection border make the rows read as choosable. (A single candidate renders the presentational detail card — no interactive rows, the Gauge/Sparkline precedent.)',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'Selecting a row rings it (border + aria-pressed), swaps the detail card to that candidate, and the aria-live inspector line announces label, total, verdict, and any penalties.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'group',
    keyboard: [
      'Tab (into the board, roving tabindex)',
      'ArrowUp/ArrowDown/ArrowLeft/ArrowRight (previous/next candidate — selection follows focus)',
      'Home/End (first/last candidate)',
      'Enter/Space (assay the focused candidate)',
      'Board mode only — a single candidate renders a presentational card',
    ],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-surface-raised',
    '--tcl-surface-sunken',
    '--tcl-border',
    '--tcl-text',
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-status-*-bg',
    '--tcl-elevation-1',
    '--tcl-focus-ring',
    '--tcl-dur-fast',
    '--tcl-ease-calm',
  ],
};

export default assayContract;
