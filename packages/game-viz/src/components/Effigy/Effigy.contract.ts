import type { ComponentContract } from '@trembus/tokens/contract';

export const effigyContract: ComponentContract = {
  name: 'Effigy',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'renders an interactive glTF/GLB 3D model from one authored contract — framed in a bracket-cornered reliquary stage with a mono index tab and a display-serif caption. A poster plate holds the frame (no layout shift) until the model is revealed; the model carries `alt` as its accessible name (WCAG 1.1.1), and load/error is surfaced both visually and through an aria-live region so the model’s state is perceivable. Tone-coding always pairs with the words in the index/caption, never color alone.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'the affordances the contract can switch on: orbit + zoom camera controls (model-viewer manages the canvas’s own keyboard a11y), idle auto-rotation, a real focusable AR "View in your space" <button> slotted into model-viewer, and a non-interactive plate. The States story shows orbit, auto-rotate, AR, a static plate, and the load-fault state side by side.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'drag to orbit / scroll to zoom give immediate visual feedback; idle auto-rotation is pausable via a real focusable control (an HTML <button> with aria-pressed) and is gated by prefers-reduced-motion; the stage shows a focus ring on focus-within; and load/error is announced via aria-live. The Interaction story exercises orbit + the pause control.',
      story: 'Interaction',
    },
  },
  a11y: { keyboard: ['Tab', 'Enter', 'Space', 'Arrow keys'], focusRing: true },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-danger',
    '--tcl-status-success',
    '--tcl-status-warning',
    '--tcl-status-info',
    '--tcl-surface-sunken',
    '--tcl-surface-raised',
    '--tcl-surface-hover',
    '--tcl-border',
    '--tcl-border-soft',
    '--tcl-focus-ring',
    '--tcl-radius-sm',
    '--tcl-radius-full',
    '--tcl-text',
    '--tcl-text-dim',
    '--tcl-font-display',
    '--tcl-font-sans',
    '--tcl-font-mono',
    '--tcl-tracking-caps',
    '--tcl-tracking-wide',
  ],
};

export default effigyContract;
