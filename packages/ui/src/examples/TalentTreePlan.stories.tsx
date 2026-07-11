// Example PAGE — a composition of multiple components, NOT a library component.
// Lives in src/examples/ (outside src/components/) so `check:contracts` ignores it.
// Compose from the public barrel ('../index') so the example exercises the same
// API a consumer would.
//
// The scenario: a design plan rendered through the library's own doc/decision
// components. `Brief` carries the plan itself (the ledger of made calls), a decided
// `DecisionMap` shows the keystone placement decision with its consequence trail,
// and a `Timeline` lays out the 8-step build sequence as a horizontal roadmap.
// This is the "talent-tree system" plan viewed with the components it plans to add.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Brief, Card, Inline, Stack, Text, DecisionMap, Timeline } from '../index';
import type { BriefContract, DecisionMapContract, TimelineContract } from '../index';

// ── the plan doc (Brief = the whole plan, made calls + the shape of the work) ──
const TALENT_PLAN: BriefContract = {
  view: 'brief',
  kind: 'plan',
  id: 'plan.talent-tree',
  title: 'Talent-tree system — TalentTree + Constellation',
  summary:
    'A game skill-tree family: a structural TalentTree in @trembus/viz (a prerequisite DAG with ' +
    'multi-rank nodes, point costs, a points budget, and tier gates) plus a thin gothic ' +
    'Constellation skin in @trembus/game-viz. The lead UI job is afford-action — the point of the ' +
    'component is spending points — a first for the viz roster.',
  meta: [
    { label: 'packages', value: 'viz + game-viz' },
    { label: 'new components', value: 2 },
    { label: 'lead job', value: 'afford-action' },
    { label: 'build steps', value: 8 },
  ],
  sections: [
    {
      id: 'thesis',
      heading: 'Design thesis',
      kind: 'prose',
      body:
        'A talent tree is a Tier-2 prerequisite DAG whose lead job — uniquely among the viz roster — ' +
        'is afford-action: reveal-state (the build at a glance) and acknowledge-input (every spend ' +
        'announced) are in service of the spending.\n\n' +
        'Structure lives in @trembus/viz; the gothic theatrics are a thin skin in @trembus/game-viz, ' +
        'per the Chronicle-over-Timeline precedent — theatrical surface, accessible spine. The ' +
        'genuinely new invention is the allocation engine: a guarded, controllable Record<id, rank> ' +
        'state machine that nothing in the library models yet.',
    },
    {
      id: 'decisions',
      heading: 'Decisions locked',
      kind: 'decisions',
      note: 'Three calls confirmed before build. The placement call is expanded to the right.',
      items: [
        { text: 'Placement', choice: 'viz structure + game-viz skin' },
        {
          text: 'Interactivity',
          choice: 'full allocation engine — the component enforces the rules',
        },
        { text: 'Layout', choice: 'authored tiers + derived fallback (no dagre)' },
      ],
    },
    {
      id: 'engine',
      heading: 'Allocation engine',
      kind: 'rules',
      note: 'The net-new surface — a controllable id→rank map with guarded transitions.',
      items: [
        {
          text: 'useControllableMap',
          desc: 'third viz primitive beside selection/set; content-digest stable memo; commit(id, rank)',
        },
        {
          text: 'canAllocate',
          desc: 'not maxed · prereqs met at required rank · tier gate met · budget ≥ cost',
        },
        {
          text: 'canDeallocate',
          desc: 'full-recheck simulation — removing a rank may not orphan any allocated node or break a tier gate',
        },
        {
          text: 'Clamp once',
          desc: 'rank clamped at derive; pips, budget math, and aria all read the same number (the Gauge lesson)',
        },
        {
          text: 'Never fight the parent',
          desc: 'illegal controlled maps render at their real state; further allocation is blocked, deallocation stays open to repair',
        },
      ],
    },
    {
      id: 'contract',
      heading: 'Data contract',
      kind: 'prose',
      body:
        'TalentTreeContract mirrors a future VG JSON schema — JSON-serializable, no ReactNode. Nodes ' +
        'carry id, label, maxRank, cost, tier, and requires (a bare id = rank ≥ 1, or { id, rank }). ' +
        'Lenient parse, strict render: duplicate ids first-wins, dangling requires dropped (never ' +
        'brick a node), cycles broken deterministically, every coordinate clamped, empty → a message. ' +
        'It never throws.',
    },
    {
      id: 'wiring',
      heading: 'Skin wiring costs',
      kind: 'checklist',
      note: 'Constellation creates the first game-viz → viz dependency — three one-line costs.',
      items: [
        {
          text: 'Add @trembus/viz workspace:^ to game-viz package.json, then pnpm install.',
          severity: 'info',
        },
        {
          text: 'Add the /^@trembus\\/viz$/ → source alias in .storybook/main.ts, or the skin renders unstyled.',
          severity: 'warn',
        },
        {
          text: "Import '@trembus/viz/styles.css' in the game-viz styles entry.",
          severity: 'info',
        },
      ],
    },
    {
      id: 'files',
      heading: 'Key files',
      kind: 'reference',
      items: [
        {
          text: 'TalentTree component — contract, sanitize, derive, layout',
          ref: 'packages/viz/src/components/TalentTree/TalentTree.tsx',
        },
        {
          text: 'useControllableMap — the third controllable primitive',
          ref: 'packages/viz/src/internal/useControllableMap.ts',
        },
        {
          text: 'Constellation — the game-viz skin',
          ref: 'packages/game-viz/src/components/Constellation/Constellation.tsx',
        },
        {
          text: 'Model: roving tabindex + re-seed guard + inspector',
          ref: 'packages/viz/src/components/Strata/Strata.tsx',
        },
      ],
    },
    {
      id: 'followups',
      heading: 'Out of scope / follow-ups',
      kind: 'checklist',
      items: [
        {
          text: 'talent-tree.schema.json into the external VG kit (DecisionMap precedent).',
          severity: 'info',
        },
        {
          text: 'soul-steel /talents route dog-food — Constellation beside the SoulCard dossier.',
          severity: 'info',
        },
        {
          text: 'direction: bottom-up prop; barycenter crossing-reduction for derived tiers.',
          severity: 'info',
        },
      ],
    },
  ],
};

// ── the keystone decision, shown DECIDED (the at-rest ledger view) ──
const PLACEMENT: DecisionMapContract = {
  view: 'decision-map',
  title: 'Where should the talent-tree family live?',
  context:
    'A talent tree is a node-link prerequisite DAG with a rich allocation model. Which package owns the structure — and does the gothic surface come now?',
  status: 'decided',
  decidedId: 'both',
  decidedNote:
    'Locked 2026-07-11: structural TalentTree in @trembus/viz + a thin Constellation skin in @trembus/game-viz — the Chronicle-over-Timeline precedent, near-total spine reuse.',
  recommendation: {
    optionId: 'both',
    strength: 'strong',
    confidence: 88,
    rationale:
      'The viz Tier-2 spine (VizOverlay, roving tabindex, controllable state, aria-live inspector) covers ~80%; the skin is thin.',
  },
  options: [
    {
      id: 'both',
      label: 'viz structure + game-viz skin',
      summary: 'Structure in @trembus/viz; gothic theatrics as a thin skin.',
      tone: 'success',
      effort: 'medium',
      reversibility: 'reversible',
      confidence: 88,
      consequences: [
        {
          label: 'Near-total reuse of the Tier-2 viz spine',
          tone: 'success',
          likelihood: 'certain',
          horizon: 'immediate',
        },
        {
          label: 'First game-viz → viz package dependency',
          tone: 'warning',
          likelihood: 'certain',
          horizon: 'immediate',
          then: [
            {
              label: 'Needs one .storybook alias or the skin renders unstyled',
              tone: 'warning',
              likelihood: 'certain',
              horizon: 'near',
            },
          ],
        },
        {
          label: 'Theatrical surface, accessible spine — the house pattern holds',
          tone: 'success',
          likelihood: 'likely',
          horizon: 'near',
        },
      ],
    },
    {
      id: 'viz-only',
      label: 'viz only, skin later',
      summary: 'Ship the structural component now; defer the skin and the package edge.',
      tone: 'info',
      effort: 'low',
      reversibility: 'reversible',
      confidence: 64,
      consequences: [
        {
          label: 'Smallest first step; no new package edge yet',
          tone: 'success',
          likelihood: 'certain',
          horizon: 'immediate',
        },
        {
          label: 'No game-native surface for soul-steel yet',
          tone: 'warning',
          likelihood: 'likely',
          horizon: 'later',
        },
      ],
    },
    {
      id: 'gameviz-only',
      label: 'game-viz only',
      summary: 'One component in game-viz, no viz structure.',
      tone: 'danger',
      effort: 'high',
      reversibility: 'costly',
      confidence: 22,
      consequences: [
        {
          label: 'Re-implements the layout + node-link spine viz already ships',
          tone: 'danger',
          likelihood: 'certain',
          horizon: 'immediate',
        },
        {
          label: 'No tokens-only structural component for non-game consumers',
          tone: 'warning',
          likelihood: 'certain',
          horizon: 'near',
        },
      ],
    },
  ],
};

// ── the 8-step build sequence as a horizontal roadmap ──
const BUILD: TimelineContract = {
  view: 'timeline',
  code: '8',
  title: 'Build sequence',
  caption: 'Ordered so each step leaves the repo green.',
  meta: 'VIZ → GAME-VIZ · 8 STEPS',
  scale: 'ordinal',
  categories: [
    { key: 'scaffold', label: 'Scaffold', tone: 'info' },
    { key: 'build', label: 'Build', tone: 'accent' },
    { key: 'skin', label: 'Skin', tone: 'warning' },
    { key: 'gate', label: 'Gate', tone: 'success' },
  ],
  events: [
    {
      id: 's1',
      at: 1,
      dateLabel: 'Step 1',
      label: 'Scaffold TalentTree',
      category: 'scaffold',
      sub: '@trembus/viz',
      note: 'new-component --pkg viz --lead afford-action; barrel wired; gate green from scaffold.',
    },
    {
      id: 's2',
      at: 2,
      dateLabel: 'Step 2',
      label: 'useControllableMap',
      category: 'scaffold',
      sub: 'internal hook',
      note: 'The third controllable primitive; exported from internal/index.ts, exercised by component tests.',
    },
    {
      id: 's3',
      at: 3,
      dateLabel: 'Step 3',
      label: 'Sanitize + layout',
      category: 'build',
      sub: 'static render',
      note: 'Contract types, sanitize pass, tier derivation, edges/rails, header/meter/inspector shells; Default story; degradation + clamp tests.',
    },
    {
      id: 's4',
      at: 4,
      dateLabel: 'Step 4',
      label: 'Allocation engine',
      category: 'build',
      sub: 'guards + keyboard',
      note: 'Derive memo, guards, deallocation simulation + blockers, roving + spatial arrows, live announcements.',
    },
    {
      id: 's5',
      at: 5,
      dateLabel: 'Step 5',
      label: 'Polish + viz gate',
      category: 'build',
      sub: 'both themes',
      note: 'Full state CSS, States/Interaction stories, contract prose; viz validate + visual verify + /finish-component.',
    },
    {
      id: 's6',
      at: 6,
      dateLabel: 'Step 6',
      label: 'Wire game-viz → viz',
      category: 'skin',
      sub: 'dep · alias · styles',
      note: 'The three one-line skin costs — the first game-viz → viz edge.',
    },
    {
      id: 's7',
      at: 7,
      dateLabel: 'Step 7',
      label: 'Constellation skin',
      category: 'skin',
      sub: '@trembus/game-viz',
      note: '5 files mirroring Chronicle; barrel export; game-viz validate + visual verify.',
    },
    {
      id: 's8',
      at: 8,
      dateLabel: 'Step 8',
      label: 'Root validate',
      category: 'gate',
      sub: 'full gate',
      note: 'pnpm validate green with the existing working-tree changes intact — the work is purely additive.',
    },
  ],
};

// ── the page ─────────────────────────────────────────────────────────
function TalentTreePlanPage() {
  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: 'var(--tcl-space-6)' }}>
      <Stack gap={6}>
        {/* header */}
        <Inline justify="between" align="center" wrap gap={4}>
          <Stack gap={1}>
            <Text
              size="xs"
              tone="faint"
              mono
              style={{ textTransform: 'uppercase', letterSpacing: '0.14em' }}
            >
              Trembus · Design plan
            </Text>
            <Text as="h1" size="xl" weight="bold">
              Talent-tree system
            </Text>
          </Stack>
          <Badge tone="success" dot variant="soft">
            Plan approved
          </Badge>
        </Inline>

        {/* plan doc beside the keystone decision */}
        <div
          style={{
            display: 'grid',
            gap: 'var(--tcl-space-5)',
            // collapses to one column on narrow viewports (inline styles can't media-query)
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))',
            alignItems: 'start',
          }}
        >
          {/* LEFT — the plan itself */}
          <Card>
            <Card.Body>
              <Brief data={TALENT_PLAN} />
            </Card.Body>
          </Card>

          {/* RIGHT — the placement decision, decided, with its consequence trail */}
          <Stack gap={3}>
            <Card>
              <Card.Body>
                <DecisionMap data={PLACEMENT} />
              </Card.Body>
            </Card>
            <Text size="sm" tone="dim">
              The decided map keeps the full consequence trail — the price of the chosen path (one
              new package edge, one alias) stays visible next to the win (near-total reuse).
            </Text>
          </Stack>
        </div>

        {/* full-width — the build sequence */}
        <Card>
          <Card.Body>
            <Timeline data={BUILD} defaultSelectedId="s4" />
          </Card.Body>
        </Card>
      </Stack>
    </div>
  );
}

const meta = {
  title: 'Examples/Talent Tree Plan',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The "talent-tree system" design plan, rendered through the library's own doc and
 * decision components: the plan as a `Brief` (thesis, locked decisions, the allocation
 * engine, wiring costs, key files), the keystone placement call as a decided
 * `DecisionMap` (options + recommendation strength + consequence cascades), and the
 * 8-step build sequence as an ordinal `Timeline`.
 */
export const Default: Story = {
  render: () => <TalentTreePlanPage />,
};
