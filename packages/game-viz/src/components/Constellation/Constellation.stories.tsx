import type { Meta, StoryObj } from '@storybook/react-vite';
import { Constellation } from './Constellation';
import type { ConstellationContract } from './Constellation';

// A gothic discipline — the same TalentTree contract, dressed for the reliquary.
const RITES: ConstellationContract = {
  brand: 'Order of the Kept',
  code: 'RITE',
  title: 'Blood Sacrament',
  caption: 'Ignite the rites in order; each ordination opens once you have given enough below.',
  points: 18,
  tiers: [
    { label: 'Acolyte' },
    { label: 'Adept' },
    { label: 'Ordained', gate: 5 },
    { label: 'Anointed' },
    { label: 'Sovereign', gate: 12 },
  ],
  nodes: [
    { id: 'ember', label: 'Ember Mark', glyph: 'zap', tier: 0, note: 'The first sacrament.' },
    { id: 'vigil', label: 'Vigil', glyph: 'shield', tone: 'info', tier: 0 },
    {
      id: 'litany',
      label: 'Litany',
      glyph: 'layers',
      tier: 0,
      maxRank: 3,
      sub: '+devotion per rank',
    },
    {
      id: 'bloodgift',
      label: 'Blood Gift',
      glyph: 'zap',
      tier: 1,
      maxRank: 5,
      requires: ['ember'],
      sub: 'the signature rite',
    },
    {
      id: 'wardsign',
      label: 'Ward Sign',
      glyph: 'shield',
      tone: 'info',
      tier: 1,
      requires: ['vigil'],
    },
    { id: 'chant', label: 'Chant', glyph: 'layers', tier: 1, maxRank: 3, requires: ['litany'] },
    {
      id: 'consecrate',
      label: 'Consecrate',
      glyph: 'cpu',
      tier: 2,
      cost: 2,
      requires: ['bloodgift'],
      note: 'Costs 2 points per rank.',
    },
    {
      id: 'scourge',
      label: 'Scourge',
      glyph: 'zap',
      tone: 'danger',
      tier: 2,
      maxRank: 3,
      requires: [{ id: 'bloodgift', rank: 3 }],
      note: 'Needs Blood Gift at rank 3 — a rank prerequisite.',
    },
    {
      id: 'sanctum',
      label: 'Sanctum',
      glyph: 'shield',
      tone: 'info',
      tier: 2,
      requires: ['wardsign'],
    },
    {
      id: 'reliquary',
      label: 'Reliquary',
      glyph: 'network',
      tone: 'danger',
      tier: 3,
      requires: ['consecrate', 'scourge'],
      note: 'A multi-prerequisite capstone — needs both Consecrate and Scourge.',
    },
    { id: 'effigy', label: 'Effigy', glyph: 'globe', tier: 3, requires: ['scourge'] },
    {
      id: 'oblation',
      label: 'Oblation',
      glyph: 'shield',
      tone: 'info',
      tier: 3,
      maxRank: 2,
      requires: ['sanctum'],
    },
    {
      id: 'apotheosis',
      label: 'Apotheosis',
      glyph: 'globe',
      tone: 'warning',
      tier: 4,
      cost: 3,
      requires: ['reliquary'],
      note: 'The ascension. Costs 3 points.',
    },
    {
      id: 'sovereign',
      label: 'The Kept Sovereign',
      glyph: 'network',
      tone: 'danger',
      tier: 4,
      cost: 2,
      requires: ['reliquary', 'oblation'],
    },
  ],
};

const meta = {
  title: 'Game/Constellation',
  component: Constellation,
  args: { data: RITES, tone: 'danger', designation: 'Reliquary Archive · Rites' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Constellation>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Reveal State — the rite as a night star-chart: the reliquary plate, HUD brackets, and
 * blood-red accent lever frame the same tiered DAG the viz TalentTree draws, seeded
 * mid-devotion so Scourge's rank prerequisite is met and the Ordained gate is open.
 */
export const Default: Story = {
  args: {
    defaultAllocated: { ember: 1, litany: 2, vigil: 1, bloodgift: 3, chant: 1 },
    defaultSelectedId: 'bloodgift',
  },
};

/**
 * Afford Action — the same skin re-tinted per tone. A read-only finished rite (accent
 * gold) showing all four node states, beside an over-budget controlled rite (blood-red)
 * whose meter clamps to danger while the readout stays honest.
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <Constellation
        data={{
          ...RITES,
          title: 'Sacrament — sealed',
          caption: 'Read-only: a finished devotion, all four talent states in view.',
        }}
        tone="accent"
        designation="Sealed Rite"
        readOnly
        allocated={{ ember: 1, litany: 3, vigil: 1, bloodgift: 5 }}
        defaultSelectedId="bloodgift"
      />
      <Constellation
        data={{
          ...RITES,
          title: 'Sacrament — overspent',
          caption: 'Controlled map spending 11 of 8 — the meter bleeds into danger.',
          points: 8,
        }}
        tone="danger"
        designation="Broken Vow"
        allocated={{ ember: 1, litany: 3, bloodgift: 5, consecrate: 1 }}
        defaultSelectedId="consecrate"
      />
    </div>
  ),
};

/**
 * Acknowledge Input — an unlit chart. Ignite rites with click / Enter / Space where the
 * prerequisites, ordination gate, and the 18-point devotion allow; Shift+click, `-`, or
 * Delete recants a rank when it won't strand a later rite. The inspector speaks each change.
 */
export const Interaction: Story = {
  args: {
    defaultSelectedId: 'ember',
  },
};
