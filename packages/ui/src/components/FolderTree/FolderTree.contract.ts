import type { ComponentContract } from '../../types/contract';

export const folderTreeContract: ComponentContract = {
  name: 'FolderTree',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'a nested role="tree" of role="treeitem" rows carries aria-level / aria-setsize / aria-posinset so depth and position are perceivable; folders expose aria-expanded (open/closed) and a rotating chevron; kind/file-type glyphs distinguish folders from file types; the selected row is tinted; filtering narrows the tree and highlights the matched substring.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'every row is a focusable treeitem under a single roving tabindex; folders afford expand/collapse (chevron + aria-expanded); when checkable, each row exposes a tri-state checkbox via aria-checked (true | false | mixed); a labeled filter Input narrows the tree; a lazy folder loads its children on first expand.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'arrow keys rove focus (Up/Down across visible rows, Right/Left to expand/collapse or move to child/parent, Home/End to ends); Enter selects (aria-selected) and toggles folders; Space toggles the checkbox with a parent→mixed cascade; the filter updates live (aria-live match count); expanding a lazy folder shows a spinner, then its children.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'tree',
    keyboard: [
      'Tab',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
      'Enter',
      'Space',
    ],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-accent-fg',
    '--tcl-status-warning',
    '--tcl-status-danger',
    '--tcl-focus-ring',
    '--tcl-surface',
    '--tcl-surface-raised',
    '--tcl-border-soft',
    '--tcl-border-strong',
    '--tcl-text',
    '--tcl-text-dim',
    '--tcl-text-faint',
    '--tcl-font-sans',
  ],
};

export default folderTreeContract;
