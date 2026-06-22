import type { ComponentContract } from '../../types/contract';

export const dataStatusBarContract: ComponentContract = {
  name: 'DataStatusBar',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'a color-coded status dot + word (live/stale/loading/error/partial/paused), a freshness `<time>`, and scope metrics sit in a `role="status"` live region — the tone rail and dot make data trust perceivable at a glance, and flipping `status` is announced.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'each active parameter renders as a chip; with `onRemoveFilter` every chip gains a labeled remove button, and `onRefresh` adds a re-pull button (disabled + spinning while loading) — the visible controls for narrowing or refreshing the slice.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'remove (✕) and refresh respond to click and Enter/Space, fire their callback so the host mutates the data, and carry a focus ring; the resulting status change re-announces through the live region.',
      story: 'Interaction',
    },
  },
  a11y: { role: 'region', keyboard: ['Tab', 'Enter', 'Space'], focusRing: true },
  tokensUsed: [
    '--tcl-status-*',
    '--tcl-accent',
    '--tcl-surface-raised',
    '--tcl-border',
    '--tcl-focus-ring',
    '--tcl-text-faint',
  ],
};

export default dataStatusBarContract;
