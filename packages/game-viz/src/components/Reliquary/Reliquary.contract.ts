import type { ComponentContract } from '@trembus/tokens/contract';

export const reliquaryContract: ComponentContract = {
  name: 'Reliquary',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'frames content as a HUD reliquary — a tone-coded corner reticle, a mono label (subject) + tag (name), and a row of tone-coded status readouts (e.g. "SOUL INTEGRITY — 34.7%", "CONTAINMENT STABLE") make the subject identity and operational state perceivable; the meaning is carried by the words, never color alone.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'presentational — Reliquary is a frame and exposes no affordance of its own; the corner reticle is decorative (aria-hidden). It frames interactive content (a play button, a card) which owns its own affordances. Declared presentational, like Badge/Skeleton.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'presentational — the frame is static chrome with no input to acknowledge; framed interactive children acknowledge their own input. The Interaction story shows the frame wrapping a real focusable control without trapping or obscuring it.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'group', focusRing: false },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-danger',
    '--tcl-status-success',
    '--tcl-status-warning',
    '--tcl-status-info',
    '--tcl-surface-sunken',
    '--tcl-border',
    '--tcl-text',
    '--tcl-text-dim',
    '--tcl-font-mono',
    '--tcl-tracking-caps',
  ],
};

export default reliquaryContract;
