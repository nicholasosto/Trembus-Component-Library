import type { ComponentContract } from '../../types/contract';

export const audioWaveformContract: ComponentContract = {
  name: 'AudioWaveform',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'renders the amplitude waveform (from `peaks` or a lazy Web Audio decode) with a played/unplayed split, a mono current-time / duration readout, and a tone that is always paired with the visible label. Loading and decode-error are shown visually AND announced via an aria-live status region.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'a real focusable play/pause <button> (Pressable) carrying aria-pressed, plus a keyboard-operable scrubber (role=slider with aria-valuemin/max/now/text) that also accepts pointer click + drag to seek.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'seeking moves the playhead immediately and updates aria-valuenow/valuetext; a pointer click/tap (or drag-release) on the waveform also begins playback from that point when `playOnClick` is set (the default), while keyboard seeks move the playhead without starting sound; the play button reflects element state via aria-pressed; the surface shows a focus ring on focus-within. It never autoplays on mount, and the playhead transition sits behind prefers-reduced-motion.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'slider',
    keyboard: [
      'Space/Enter (play/pause)',
      'ArrowLeft/Right',
      'ArrowUp/Down',
      'PageUp/Down',
      'Home',
      'End',
    ],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-accent-fg',
    '--tcl-status-*',
    '--tcl-surface',
    '--tcl-surface-raised',
    '--tcl-surface-sunken',
    '--tcl-surface-hover',
    '--tcl-border',
    '--tcl-text',
    '--tcl-text-dim',
    '--tcl-focus-ring',
    '--tcl-font-sans',
    '--tcl-font-mono',
  ],
};

export default audioWaveformContract;
