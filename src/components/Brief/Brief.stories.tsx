import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Brief } from './Brief';
import type { BriefContract } from './Brief';

// ── SCOPE A: an instruction doc (this project's own CLAUDE.md) ──────────────
// The generator's job here is pure transcription of the markdown outline.
const claudeMd: BriefContract = {
  view: 'brief',
  kind: 'claude',
  id: 'claude.trembus-ui',
  title: '@trembus/ui — guide for Claude',
  summary:
    'Web React component library (not Roblox). First-principles UX: tokens → primitives → components, each carrying a machine-checked "3 UI jobs" contract.',
  meta: [
    { label: 'package', value: '@trembus/ui' },
    { label: 'status', value: 'living' },
    { label: 'gate', value: 'pnpm validate' },
  ],
  sections: [
    {
      heading: 'Commands',
      kind: 'commands',
      items: [
        { text: 'pnpm run validate', desc: 'the full gate — run before declaring work done' },
        { text: 'pnpm test', desc: 'unit tests (jsdom + axe)' },
        { text: 'pnpm dev', desc: 'Storybook on :6006' },
        { text: 'pnpm check:contracts', desc: 'enforce the 3-jobs contract per component' },
      ],
    },
    {
      heading: 'Adding a component',
      kind: 'rules',
      note: 'Every component in src/components/<Name>/ has exactly five files.',
      items: [
        'Scaffold with node .claude/skills/new-component/scaffold.mjs <Name>.',
        'Export it from src/index.ts; contract.name must equal the directory name.',
        'Story names stay Default / States / Interaction — check:contracts verifies them.',
      ],
    },
    {
      heading: 'Conventions',
      kind: 'rules',
      items: [
        { text: 'Tokens only', desc: 'reference var(--tcl-*), never hardcode a hex' },
        { text: 'import type { … }', desc: 'verbatimModuleSyntax is on' },
        { text: 'Compose from primitives', desc: 'Box / Stack / Text / Pressable' },
      ],
    },
    {
      heading: 'Gotchas',
      kind: 'checklist',
      items: [
        {
          text: 'Required prop + render-only story → put a default in meta args',
          severity: 'warn',
        },
        {
          text: 'Keep interaction handlers off composite-role containers (tablist/menu)',
          severity: 'warn',
        },
        {
          text: 'Portals render synchronously — parent focus/measure sees the node same commit',
          severity: 'info',
        },
        { text: 'ESM-only package — verify:exports runs --profile esm-only', severity: 'info' },
      ],
    },
    {
      heading: 'Required artifacts',
      kind: 'artifacts',
      items: [
        { text: 'barrel', desc: 'every component re-exported', ref: 'src/index.ts' },
        {
          text: 'contract checker',
          desc: 'enforces the 5-file shape + 3 jobs',
          ref: 'scripts/check-contracts.ts',
        },
        {
          text: 'a11y helper',
          desc: 'axe assertions for every component test',
          ref: 'src/test/a11y.ts',
        },
      ],
    },
    {
      heading: 'Visualizations',
      kind: 'prose',
      body: 'Data-driven viz components (Hub, Brief) consume the Trembus Visual Grammar JSON contracts. Mirror the schema as a TS type so ONE contract renders in both the static HTML kit and React. Title these Visualizations/* in Storybook.',
    },
  ],
};

// ── the kinds legend — one section of every kind (Afford Action demo) ───────
const kindsLegend: BriefContract = {
  view: 'brief',
  kind: 'spec',
  id: 'brief.section-kinds',
  title: 'Section kinds — the rendering legend',
  summary:
    'Every section kind the Brief contract supports. Each heading is a disclosure button — click to collapse.',
  sections: [
    {
      heading: 'prose',
      kind: 'prose',
      body: 'A paragraph of explanation. Any unknown kind falls back to this.',
    },
    {
      heading: 'rules',
      kind: 'rules',
      items: ['First directive.', 'Second directive, with a rationale.'],
    },
    {
      heading: 'commands',
      kind: 'commands',
      items: [{ text: 'pnpm dev', desc: 'start Storybook' }],
    },
    {
      heading: 'checklist',
      kind: 'checklist',
      items: [
        { text: 'an info item', severity: 'info' },
        { text: 'a warning item', severity: 'warn' },
        { text: 'a danger item', severity: 'danger' },
      ],
    },
    {
      heading: 'phases',
      kind: 'phases',
      items: [
        { text: 'done phase', status: 'done' },
        { text: 'active phase', status: 'active' },
        { text: 'pending phase', status: 'pending' },
      ],
    },
    {
      heading: 'artifacts',
      kind: 'artifacts',
      items: [{ text: 'barrel', desc: 'exports', ref: 'src/index.ts' }],
    },
    {
      heading: 'boundaries',
      kind: 'boundaries',
      items: [{ text: 'project root', ref: 'Trembus-Component-Library/' }],
    },
    {
      heading: 'decisions',
      kind: 'decisions',
      items: [{ text: 'Schema format?', choice: 'JSON Schema draft-07, mirrored as a TS type' }],
    },
    {
      heading: 'reference',
      kind: 'reference',
      items: [{ text: 'agents.md standard', ref: 'https://agents.md' }],
    },
  ],
};

// ── SCOPE B: an instruction doc that also carries a light plan ──────────────
const withPlan: BriefContract = {
  view: 'brief',
  kind: 'plan',
  id: 'plan.brief-rollout',
  title: 'Brief rollout — agent plan',
  summary:
    'Scope B: one contract spans an instruction doc AND a lightweight plan — rules up top, phases + decisions below.',
  meta: [
    { label: 'mood', value: 'grinding' },
    { label: 'updated', value: '2026-06-21' },
  ],
  sections: [
    {
      heading: 'Operating rules',
      kind: 'rules',
      items: ['Read the manifest first.', 'Local markdown is the source of truth.'],
    },
    {
      heading: 'Phases',
      kind: 'phases',
      items: [
        { text: 'Phase 1 — schema + component', status: 'done' },
        { text: 'Phase 2 — generator + lenient validator', status: 'active' },
        { text: 'Phase 3 — round-trip md ⇄ contract', status: 'pending' },
      ],
    },
    {
      heading: 'Decisions',
      kind: 'decisions',
      items: [
        {
          text: 'Scope of one contract',
          choice: 'Medium — bless claude/agents/plan + a phases kind',
        },
      ],
    },
  ],
};

// ── SCOPE C: any sectioned markdown (a design spec) ─────────────────────────
const genericDoc: BriefContract = {
  view: 'brief',
  kind: 'spec',
  id: 'spec.any-markdown',
  title: 'Any sectioned markdown — a design spec',
  summary:
    'Scope C: the Brief renders arbitrary docs — design notes, specs, READMEs — so long as they are sections of prose/lists.',
  sections: [
    {
      heading: 'Problem',
      kind: 'prose',
      body: 'Generic docs vary wildly. A permissive contract renders them, but a looser vocabulary gives the generator fewer guardrails — more drift, more fix-ups.',
    },
    {
      heading: 'Approach',
      kind: 'rules',
      items: ['Lenient parse, strict render.', 'Unknown kinds degrade to prose.'],
    },
    {
      heading: 'Open questions',
      kind: 'checklist',
      items: [
        { text: 'Where does spec end and plan begin?', severity: 'warn' },
        { text: 'Do we need a tables / kv kind?', severity: 'info' },
      ],
    },
    {
      heading: 'References',
      kind: 'reference',
      items: [
        { text: 'agents.md standard', ref: 'https://agents.md' },
        { text: 'plan-board schema', ref: 'visual-grammar/schema/plan-board.schema.json' },
      ],
    },
  ],
};

const meta = {
  title: 'Visualizations/Brief',
  component: Brief,
  args: { data: claudeMd },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Brief>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — a whole instruction doc (Scope A: this project's CLAUDE.md). */
export const Default: Story = {};

/** Job: Afford Action — every section kind; each heading is a disclosure button. */
export const States: Story = { args: { data: kindsLegend } };

/** Job: Acknowledge Input — clicking a section toggles its body. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Commands' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(toggle);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  },
};

/** Scope B — an instruction doc that also carries a lightweight plan. */
export const WithPlan: Story = { args: { data: withPlan } };

/** Scope C — any sectioned markdown (a design spec). */
export const GenericDoc: Story = { args: { data: genericDoc } };
