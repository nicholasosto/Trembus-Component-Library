import type { ComponentContract } from '../../types/contract';

export const emptyStateContract: ComponentContract = {
  name: 'EmptyState',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'represents genuinely-absent content (no data / awaiting source / pending WSC) as a deliberate placeholder — a glyph, title, and description — with an optional mono chip naming the source that is not yet exposed.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'an optional action slot offers the next step (e.g. a Button to connect a source); an optional badge flags the pending status.',
      story: 'Variants',
    },
    acknowledgeInput: {
      satisfiedBy:
        'presentational by itself; when an action is provided that control owns the interaction feedback (focus ring + pressed state), demonstrated by resolving the empty state on activation.',
      story: 'Interaction',
    },
  },
  a11y: { focusRing: false },
  tokensUsed: [
    '--tcl-surface-sunken',
    '--tcl-surface',
    '--tcl-border-strong',
    '--tcl-text-faint',
    '--tcl-font-mono',
  ],
};

export default emptyStateContract;
