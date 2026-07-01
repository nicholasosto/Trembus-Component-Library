import type { ComponentContract } from '../../types/contract';

export const virtualAssetGridContract: ComponentContract = {
  name: 'VirtualAssetGrid',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'renders only the visible tiles of a large (10k+) dataset via dependency-free windowing, groups them into sticky counted section subheads (groupBy + groupOrder), and reveals the current selection as a filled tint kept distinct from the focus ring.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'the scroll container is a role=listbox of focusable role=option tiles (each with aria-selected + per-section aria-posinset/setsize); a single roving tabindex advertises where Tab lands, and clicking a tile selects it.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        '2D roving-tabindex arrow navigation moves focus by the live column count across section boundaries (Home/End/PageUp-Down too); selecting a windowed-out tile scrolls it into view, mounts it, and focuses it; an aria-live inspector announces the selected tile and its position.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'listbox',
    keyboard: [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'PageUp',
      'PageDown',
      'Enter',
      'Space',
    ],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-surface',
    '--tcl-border-soft',
    '--tcl-accent',
    '--tcl-focus-ring',
    '--tcl-text',
    '--tcl-text-dim',
    '--tcl-text-faint',
    '--tcl-z-sticky',
    '--tcl-radius-md',
    '--tcl-space-*',
    '--tcl-font-sans',
  ],
};

export default virtualAssetGridContract;
