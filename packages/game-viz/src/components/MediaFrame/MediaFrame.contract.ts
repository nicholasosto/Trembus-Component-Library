import type { ComponentContract } from '@trembus/tokens/contract';

export const mediaFrameContract: ComponentContract = {
  name: 'MediaFrame',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'picks the right surface from data.medium — an <img> poster for images, a compact AudioWaveform for audio, an Effigy turntable for loadable 3D (glTF/GLB) or a poster for formats model-viewer cannot load, a Glyph plate for docs, and a tone-tinted Skeleton while loading or when there is no source. Tone is always paired with the alt text.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'the bracket-cornered frame + tint are decorative (aria-hidden); the accessible name is the surface’s own alt. With `interactive`, the frame becomes a real focusable <button> (Pressable) that fires onActivate — except the 3D turntable, which owns its own load/orbit controls and is never wrapped.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'the interactive frame is a Pressable, so it shows a focus ring and press feedback and fires onActivate on click + keyboard (Enter/Space); the composed AudioWaveform/Effigy surfaces carry their own interaction and motion behind prefers-reduced-motion.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'img', keyboard: ['Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-surface-sunken',
    '--tcl-border',
    '--tcl-focus-ring',
    '--tcl-text',
    '--tcl-radius-md',
    '--tcl-space-*',
    '--tcl-font-sans',
  ],
};

export default mediaFrameContract;
