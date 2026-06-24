import type { ComponentContract } from '../../types/contract';

export const timelineContract: ComponentContract = {
  name: 'Timeline',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'dated events are placed on a horizontal time axis (ordinal columns or proportional to their date), alternating above/below, with tone-coded era nodes on the axis and a category legend — when each thing happened, in what order, and of what kind is perceivable at a glance; tone is paired with a word, never colour alone.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every event is a focusable HTML `<button>` carrying its accessible name (date · title · category); prev/next controls step the selection chronologically; selecting an event reveals its date, sub, category, and note in the panel and lights its axis node.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects an event (aria-pressed), rings the card in the accent, fills its axis node, scrolls it into view, and reveals its detail in a live (aria-live) inspector; focus ring on the event + nav buttons.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
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
