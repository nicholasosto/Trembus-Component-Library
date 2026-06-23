import type { ComponentContract } from '@trembus/tokens/contract';

export const soulCardContract: ComponentContract = {
  name: 'SoulCard',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'renders a character dossier from one authored contract — eyebrow index + tone-coded state tag, portrait, display-serif name + epithet, a definition-list of stat rows (House / Bound Epoch / Integrity / Weapon), a bio, and a pull-quote — so a soul’s identity and standing are perceivable at a glance. Tone-coding always pairs with a word (the state tag, the values), never color alone.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'a static dossier by default; when a `back` is authored the card becomes flippable via a real focusable flip control — an HTML <button> with aria-pressed — that is the visible affordance. The portrait is decorative unless given alt text. The States story shows flippable + static cards side by side.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'clicking the flip control (or Enter/Space) toggles a 3D flip: aria-pressed flips, the reverse face is revealed, and the now-hidden face is set `inert` so a screen reader reads only the visible side; the spin honors prefers-reduced-motion. The Interaction story flips the card and asserts the reverse content appears.',
      story: 'Interaction',
    },
  },
  a11y: { keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-danger',
    '--tcl-status-success',
    '--tcl-status-warning',
    '--tcl-status-info',
    '--tcl-surface-sunken',
    '--tcl-surface-raised',
    '--tcl-bg',
    '--tcl-border',
    '--tcl-border-soft',
    '--tcl-focus-ring',
    '--tcl-elevation-1',
    '--tcl-text',
    '--tcl-text-dim',
    '--tcl-font-display',
    '--tcl-font-sans',
    '--tcl-font-mono',
  ],
};

export default soulCardContract;
