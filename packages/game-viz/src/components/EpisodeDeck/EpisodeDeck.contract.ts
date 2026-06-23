import type { ComponentContract } from '@trembus/tokens/contract';

export const episodeDeckContract: ComponentContract = {
  name: 'EpisodeDeck',
  leadJob: 'afford-action',
  jobs: {
    revealState: {
      satisfiedBy:
        "each episode's release state is perceivable — available (Watch), now streaming (a pulsing marker), or locked (its release date) — tone-coded but always carried by the word, alongside its numeral, title, and code, so the season's shape reads at a glance.",
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'every episode is a focusable HTML button whose accessible name encodes numeral + title + code + state (the visible glyphs are aria-hidden so the name is announced once, cleanly); driven by controlled/uncontrolled selectedId (+ defaultSelectedId + onSelect).',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'click or Enter/Space selects a row → aria-pressed flips, an accent rail + tint mark it, and the selected episode (numeral · title · synopsis) is announced in a live (aria-live) inspector.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-danger',
    '--tcl-focus-ring',
    '--tcl-surface',
    '--tcl-surface-sunken',
    '--tcl-surface-raised',
    '--tcl-border',
    '--tcl-border-soft',
    '--tcl-text',
    '--tcl-text-dim',
    '--tcl-text-faint',
    '--tcl-font-display',
    '--tcl-font-mono',
  ],
};

export default episodeDeckContract;
