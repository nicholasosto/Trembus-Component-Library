import type { ComponentContract } from '../../types/contract';

export const decisionMapContract: ComponentContract = {
  name: 'DecisionMap',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'option cards carry the recommendation ribbon (word + strength), a clamped confidence bar with its printed %, effort/door-type word chips, and a valence tally; the selected option unrolls its first- and second-order consequence cascade with a likelihood word on every edge, tone rails, and dashed still-negotiable rails for possible/unlikely effects.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'every option card is one focusable button whose accessible name is a composed sentence (label, recommended + strength, confidence, effort, door type, consequence tally); selecting it traces that option’s downstream consequence chain below the row.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a card (aria-pressed), rings it, swaps the consequence cascade, and announces the pick, recommendation strength, rationale, confidence, and consequence tally in the aria-live inspector; focus ring on the card button.',
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
    '--tcl-font-mono',
  ],
};

export default decisionMapContract;
