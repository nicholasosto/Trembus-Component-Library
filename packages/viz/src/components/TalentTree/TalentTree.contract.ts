import type { ComponentContract } from '@trembus/tokens/contract';

export const talentTreeContract: ComponentContract = {
  name: 'TalentTree',
  leadJob: 'afford-action',
  jobs: {
    revealState: {
      satisfiedBy:
        'Tiers (rows) place talents by prerequisite depth; met vs unmet prerequisite edges (solid accent vs dashed faint) and a per-node data-state (locked | available | allocated | maxed, distinguished by border shape not color alone) make the whole build legible at a glance, with a points-budget meter and a state legend.',
      story: 'Default',
    },
    affordAction: {
      satisfiedBy:
        'Every talent is a focusable <button> over the decorative SVG; locked ones stay focusable via aria-disabled (never removed) so they can be inspected. An always-present inspector carries real "Add rank" / "Remove rank" buttons wired to the same guards — the accessible allocation path.',
      story: 'States',
    },
    acknowledgeInput: {
      satisfiedBy:
        'Click / Enter / Space allocates a rank where prerequisites, the tier gate, and the budget allow; Shift+click / - / Delete safely removes one (never orphaning a dependent). aria-pressed marks selection; an aria-live inspector announces each change with rank, budget remaining, and the met/unmet reason in words.',
      story: 'Interaction',
    },
  },
  a11y: {
    role: 'group',
    keyboard: [
      'Tab',
      'Enter',
      'Space',
      'Shift+Click',
      '-',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ],
    focusRing: true,
  },
  tokensUsed: [
    '--tcl-talenttree-accent',
    '--tcl-accent',
    '--tcl-surface-raised',
    '--tcl-surface-sunken',
    '--tcl-border-strong',
    '--tcl-status-danger',
    '--tcl-status-success',
    '--tcl-focus-ring',
    '--tcl-text',
    '--tcl-text-dim',
  ],
};

export default talentTreeContract;
