import type { Meta, StoryObj } from '@storybook/react-vite';
import { TalentTree } from './TalentTree';
import type { TalentTreeContract } from './TalentTree';

// ── the demo tree: a pyromancy discipline, 14 talents across 5 gated tiers ──
const PYROMANCY: TalentTreeContract = {
  brand: 'Trembus · Discipline',
  code: 'PYRO',
  title: 'Pyromancy',
  caption: 'Spend points to raise talents; each tier unlocks as you invest below it.',
  points: 18,
  tiers: [
    { label: 'Novice' },
    { label: 'Adept' },
    { label: 'Expert', gate: 5 },
    { label: 'Master' },
    { label: 'Grandmaster', gate: 12 },
  ],
  nodes: [
    // tier 0 — bedrock
    {
      id: 'spark',
      label: 'Spark',
      glyph: 'zap',
      tier: 0,
      note: 'The first ember. Opens the discipline.',
    },
    { id: 'kindle', label: 'Kindle', glyph: 'layers', tier: 0, maxRank: 3, sub: '+heat per rank' },
    {
      id: 'focus',
      label: 'Inner Focus',
      glyph: 'cpu',
      tier: 0,
      maxRank: 5,
      sub: '+spell power per rank',
    },
    // tier 1 — adept
    {
      id: 'fireball',
      label: 'Fireball',
      glyph: 'zap',
      tier: 1,
      maxRank: 5,
      requires: ['spark'],
      sub: 'signature nuke',
    },
    { id: 'scorch', label: 'Scorch', glyph: 'zap', tier: 1, maxRank: 3, requires: ['spark'] },
    {
      id: 'emberward',
      label: 'Ember Ward',
      glyph: 'shield',
      tone: 'info',
      tier: 1,
      requires: ['kindle'],
    },
    // tier 2 — expert (gate: 5 points below)
    {
      id: 'combustion',
      label: 'Combustion',
      glyph: 'cpu',
      tier: 2,
      cost: 2,
      requires: ['fireball'],
      note: 'Costs 2 points per rank.',
    },
    {
      id: 'ignite',
      label: 'Ignite',
      glyph: 'zap',
      tier: 2,
      maxRank: 3,
      requires: [{ id: 'fireball', rank: 3 }],
      note: 'Needs Fireball at rank 3 — a rank prerequisite.',
    },
    {
      id: 'flamewall',
      label: 'Flame Wall',
      glyph: 'shield',
      tone: 'info',
      tier: 2,
      requires: ['emberward'],
    },
    // tier 3 — master
    {
      id: 'firestorm',
      label: 'Firestorm',
      glyph: 'network',
      tone: 'danger',
      tier: 3,
      requires: ['combustion', 'ignite'],
      note: 'A multi-prerequisite capstone — needs both Combustion and Ignite.',
    },
    {
      id: 'inferno',
      label: 'Inferno',
      glyph: 'zap',
      tone: 'danger',
      tier: 3,
      requires: ['ignite'],
    },
    {
      id: 'cauterize',
      label: 'Cauterize',
      glyph: 'shield',
      tone: 'info',
      tier: 3,
      maxRank: 2,
      requires: ['flamewall'],
    },
    // tier 4 — grandmaster (gate: 12 points below)
    {
      id: 'phoenix',
      label: 'Phoenix Form',
      glyph: 'globe',
      tone: 'warning',
      tier: 4,
      cost: 3,
      requires: ['firestorm'],
      note: 'The ultimate. Costs 3 points.',
    },
    {
      id: 'meteor',
      label: 'Meteor',
      glyph: 'network',
      tone: 'danger',
      tier: 4,
      cost: 2,
      requires: ['firestorm', 'cauterize'],
    },
  ],
};

const meta = {
  title: 'Visualizations/TalentTree',
  component: TalentTree,
  // Storybook still demands `args` for a required prop even on render-only stories.
  args: { data: PYROMANCY },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TalentTree>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Reveal State — the whole build at a glance: five tiers, met (solid) vs unmet (dashed)
 * prerequisite edges, per-node status, and the points meter. Seeded mid-build so Fireball
 * is part-ranked (unlocking Ignite's rank-3 prerequisite) and the Expert tier gate is met.
 */
export const Default: Story = {
  args: {
    defaultAllocated: { spark: 1, kindle: 2, focus: 1, fireball: 3, scorch: 1 },
    defaultSelectedId: 'fireball',
  },
};

/**
 * Afford Action — the state vocabulary. A read-only "recommended build" shows all four
 * node states at once (maxed · allocated · available · locked-behind-gate), then a
 * controlled over-budget map shows the meter clamp to danger while the words stay honest
 * and the illegal allocation renders at its real state rather than being fought.
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <TalentTree
        data={{
          ...PYROMANCY,
          title: 'Pyromancy — recommended build',
          caption:
            'Read-only: a finished build showing maxed, allocated, available, and locked talents.',
        }}
        readOnly
        allocated={{ spark: 1, kindle: 3, focus: 2, fireball: 5 }}
        defaultSelectedId="fireball"
      />
      <TalentTree
        data={{
          ...PYROMANCY,
          title: 'Pyromancy — over budget',
          caption:
            'Controlled map spending 11 of 8 points — the meter clamps to danger, the readout stays honest.',
          points: 8,
        }}
        allocated={{ spark: 1, kindle: 3, focus: 5, fireball: 2 }}
        defaultSelectedId="focus"
      />
    </div>
  ),
};

/**
 * Acknowledge Input — uncontrolled from an empty build. Click / Enter / Space raises a
 * talent where its prerequisites, tier gate, and the 18-point budget allow; Shift+click,
 * `-`, or Delete removes a rank when doing so won't orphan a dependent. The aria-live
 * inspector announces every change with the reason in words.
 */
export const Interaction: Story = {
  args: {
    defaultSelectedId: 'spark',
  },
};
