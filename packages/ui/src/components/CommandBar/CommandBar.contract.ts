import type { ComponentContract } from '../../types/contract';

export const commandBarContract: ComponentContract = {
  name: 'CommandBar',
  leadJob: 'afford-action',
  jobs: {
    revealState: {
      satisfiedBy:
        'each command shows its availability (disabled dimmed + skipped by the rove), its emphasis (accent primary, danger destructive as text-tone), its toggle state (aria-pressed) and, for a command that owns a menu, whether that menu is open (aria-expanded); the meta slot carries static context and the ⋯ trigger reveals that commands were collapsed.',
      story: 'States',
    },
    affordAction: {
      satisfiedBy:
        'a declarative command model renders as real focusable controls under one Tab stop — nested commands progressively disclose into a menu and one submenu, and commands that no longer fit collapse into an overflow menu rather than disappearing.',
      story: 'Default',
    },
    acknowledgeInput: {
      satisfiedBy:
        'an aria-live readout under the bar echoes the command that was just invoked (commands act elsewhere, so the bar itself must confirm), plus roving ←/→ + Home/End focus movement and hover/active/expanded feedback on every control.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'toolbar',
    keyboard: ['ArrowLeft', 'ArrowRight', 'Home', 'End', 'ArrowDown', 'ArrowUp', 'Escape', 'Enter'],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-surface-raised',
    '--tcl-surface-hover',
    '--tcl-border',
    '--tcl-accent',
    '--tcl-accent-fg',
    '--tcl-status-danger',
    '--tcl-text',
    '--tcl-text-dim',
    '--tcl-text-faint',
    '--tcl-space-2',
  ],
};

export default commandBarContract;
