import type { ComponentContract } from '@trembus/tokens/contract';

export const nebulaContract: ComponentContract = {
  name: 'Nebula',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'Relatedness is painted as literal proximity — items embed in 3D space by weighted links (deterministic MDS), groups tint shared cloud regions, depth reads through scale/fade, and the aria-live inspector names the selected item’s nearest neighbors with weights (the textual equivalent of distance).',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'Every item is a real focusable HTML button over the decorative scene (roving tabindex, arrow-key navigation); the stage affords drag-to-rotate with a grab cursor, and the Reset-view control affords arrow-key rotation for keyboard users.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'Selection is acknowledged with a tone-keyed ring + aria-pressed, the selected item’s relation edges appear, the inspector announces the datum via aria-live, and rotation input (drag or arrows) moves the whole scene immediately.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'group',
    keyboard: [
      'Tab (into the node cloud, roving tabindex)',
      'ArrowLeft/ArrowRight (previous/next item)',
      'ArrowUp/ArrowDown (adjacent group)',
      'Home/End (first/last item)',
      'Enter/Space (select)',
      'Arrow keys on Reset view (rotate) · Home (reset rotation)',
    ],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-surface-sunken',
    '--tcl-surface-raised',
    '--tcl-border',
    '--tcl-text',
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-elevation-1',
    '--tcl-focus-ring',
    '--tcl-dur-fast',
    '--tcl-ease-calm',
  ],
};

export default nebulaContract;
