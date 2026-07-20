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

/**
 * The night star-chart skin over the viz `TalentTree` — talents as stars, branches as
 * constellations, wrapped in the reliquary plate with HUD corner brackets and an
 * optional designation tab. Same contract (`ConstellationContract` IS
 * `TalentTreeContract`) and the FULL allocation engine passes through: points budget,
 * tier gates, rank prerequisites, and safe deallocation that never strands a dependent
 * talent. The skin re-tints everything (met edges · budget meter · node accents · tier
 * labels) through the `--tcl-talenttree-accent` hook. Lead job: **afford action**.
 *
 * ### When to use it
 * - A skill / talent / rite tree on a page that speaks the gothic idiom.
 * - Anywhere else: use viz `TalentTree` directly — the skin adds chrome, zero behavior.
 *
 * ### Data & key props
 * - `data: ConstellationContract` — nodes with REQUIRED stable `id`s, `requires`
 *   prerequisites (plain id or `{ id, rank }`), optional `maxRank` / `cost`, tiers with
 *   optional point `gate`s, and the build's `points` budget.
 * - `allocated` / `defaultAllocated` / `onAllocatedChange` — the id → rank allocation
 *   map trio; `readOnly` freezes a finished build.
 * - `selectedId` / `defaultSelectedId` / `onSelect` — the inspector selection trio.
 * - `tone` — default `accent` (gold) · `designation` — the top tab label.
 *
 * ### Accessibility
 * - The TalentTree spine intact: talents are real buttons — allocate with click /
 *   Enter / Space, deallocate with Shift+click / `-` / Delete; every change is spoken
 *   by the `aria-live` inspector.
 * - Tone rides borders, tints, and the accent lever ONLY — running text stays on the
 *   `--tcl-text` tiers (gold-as-text fails AA; the Badge precedent).
 * - The star specks twinkle only under `prefers-reduced-motion: no-preference`.
 *
 * ### Theming & setup
 * - Display serif is Cinzel when you load it (`@fontsource/cinzel`), else serif; most at
 *   home in `data-theme="reliquary"`, correct in light and dark.
 * - game-viz builds on ui + viz: import all three stylesheets —
 *   `@trembus/ui/styles.css`, `@trembus/viz/styles.css`, `@trembus/game-viz/styles.css`.
 */
const meta = {
  title: 'Game/Constellation',
  component: Constellation,
  args: { data: RITES, tone: 'danger', designation: 'Reliquary Archive · Rites' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Constellation>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Job: Reveal State — the rite as a night star-chart: the reliquary plate, HUD brackets, and
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
 * Job: Afford Action — the same skin re-tinted per tone. A read-only finished rite (accent
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
 * Job: Acknowledge Input — an unlit chart. Ignite rites with click / Enter / Space where the
 * prerequisites, ordination gate, and the 18-point devotion allow; Shift+click, `-`, or
 * Delete recants a rank when it won't strand a later rite. The inspector speaks each change.
 */
export const Interaction: Story = {
  args: {
    defaultSelectedId: 'ember',
  },
};
