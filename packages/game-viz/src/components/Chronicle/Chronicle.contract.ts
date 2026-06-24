import type { ComponentContract } from '@trembus/tokens/contract';

export const chronicleContract: ComponentContract = {
  name: 'Chronicle',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'a liturgical-gothic frame (reliquary-dark plate, display-serif title, tone-tinted border) around the ui Timeline — dated events on a horizontal axis, alternating above/below, tone-coded by category — so the sweep of an age is perceivable at a glance; the blood-red frame accent is paired with category words, never colour alone.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'the framed Timeline supplies the affordances: every event is a focusable HTML `<button>` carrying its accessible name (date · title · category), with prev/next controls stepping the selection chronologically; the chrome (frame, archive tab) is decorative.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects an event (aria-pressed), rings it in the frame accent, fills its axis node, and reveals its detail in the Timeline’s live (aria-live) inspector; focus ring on the event + nav buttons.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-timeline-accent',
    '--tcl-status-danger',
    '--tcl-font-display',
    '--tcl-surface-sunken',
    '--tcl-border',
    '--tcl-radius-lg',
  ],
};

export default chronicleContract;
