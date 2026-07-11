import type { ComponentContract } from '../../types/contract';

export const timelineContract: ComponentContract = {
  name: 'Timeline',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'dated events are placed on a horizontal time axis (ordinal columns or proportional to their date), alternating above/below, with tone-coded era nodes and a category legend; duplicate explicit ids resolve first-authored-wins before placement, and tone is paired with a word.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'events use one roving tab stop across HTML `<button>` controls carrying accessible names (date · title · category); Arrow keys plus Home/End move focus and selection chronologically; prev/next controls provide the same step action.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click, Enter/Space, or roving-key navigation selects an event (aria-pressed), rings the card, fills its axis node, scrolls it into view without smooth motion when reduced motion is requested, and reveals its detail in a live inspector.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'group',
    keyboard: [
      'Tab',
      'Enter',
      'Space',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
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
    '--tcl-font-display',
    '--tcl-font-mono',
  ],
};

export default timelineContract;
