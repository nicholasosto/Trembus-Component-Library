import type { ComponentContract } from '../../types/contract';

export const briefContract: ComponentContract = {
  name: 'Brief',
  leadJob: 'reveal-state',
  jobs: {
    revealState: {
      satisfiedBy:
        'renders a whole instruction/plan doc at a glance — kind-tagged header, meta pills, and every section laid out by its kind (rules/commands/checklist/artifacts/decisions/prose).',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'each section heading is a disclosure button (chevron + aria-expanded); refs render as link/mono chips; with `resizable`, a window-splitter handle (role=separator, aria-value*) on the inline-end edge affords drag/keyboard width control. The kinds legend shows the affordance across every section type.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'clicking or Enter/Space on a section toggles aria-expanded and shows/hides its body (data-state open|collapsed); focus ring on the toggle. Resize commits update aria-valuenow/valuetext live (drag sets data-dragging, arrows/Home/End step, Enter resets).',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'article',
    keyboard: ['Tab', 'Enter', 'Space', 'ArrowLeft', 'ArrowRight', 'Shift+Arrow', 'Home', 'End'],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-accent',
    '--tcl-status-*',
    '--tcl-surface',
    '--tcl-font-mono',
    '--tcl-border',
    '--tcl-focus-ring',
  ],
};

export default briefContract;
