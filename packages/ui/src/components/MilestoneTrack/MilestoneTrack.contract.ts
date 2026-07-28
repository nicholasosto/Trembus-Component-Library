import type { ComponentContract } from '../../types/contract';

export const milestoneTrackContract: ComponentContract = {
  name: 'MilestoneTrack',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'Tone-coded rail segments (solid live / dashed pending), station statuses paired with words, swelling interval bubbles with measured values, share-of-total meters, and the computed header total reveal pipeline progress and lead-time magnitude at a glance.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'Every station and interval bubble is a real focusable HTML button with an accessible name (label, status, group, value, count folded in), inviting inspection by click or keyboard.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'Selection paints a distinct ring (kept separate from the AA focus ring), swells the bubble stroke + glow, and the aria-live inspector announces the selected milestone or measured interval.',
      story: 'Interaction',
    },
  },
  a11y: { focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-surface-raised',
    '--tcl-surface-sunken',
    '--tcl-border',
    '--tcl-border-strong',
    '--tcl-text',
    '--tcl-text-dim',
    '--tcl-text-faint',
    '--tcl-focus-ring',
  ],
};

export default milestoneTrackContract;
