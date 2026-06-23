import type { ComponentContract } from '@trembus/tokens/contract';

export const cinematicHeroContract: ComponentContract = {
  name: 'CinematicHero',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        "presents the work's identity from one contract — a kicker (format · episodes · season), a giant fill+outline display title (the outlined line is real, readable text via -webkit-text-stroke), an italic tagline with a single accent highlight, and a row of accolades — so a visitor grasps what it is and its acclaim at a glance.",
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'the call-to-action row renders real focusable controls — primary/secondary actions as @trembus/ui Pressable buttons (onPress) or anchors (href) — each with a visible affordance and focus ring; decorative CTA glyphs are aria-hidden.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        "CTAs acknowledge hover / focus / press via Pressable's affordance state (data-state) plus a 2px focus ring; the Interaction story presses a CTA and fires its handler.",
      story: 'Interaction',
    },
  },
  a11y: { keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-accent-fg',
    '--tcl-status-danger',
    '--tcl-status-danger-fg',
    '--tcl-focus-ring',
    '--tcl-surface-sunken',
    '--tcl-surface-raised',
    '--tcl-border',
    '--tcl-border-strong',
    '--tcl-text',
    '--tcl-text-dim',
    '--tcl-text-faint',
    '--tcl-font-display',
    '--tcl-font-mono',
  ],
};

export default cinematicHeroContract;
