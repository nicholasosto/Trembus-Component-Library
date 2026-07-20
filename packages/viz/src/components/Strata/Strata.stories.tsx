import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Strata } from './Strata';
import type { StrataContract } from './Strata';

// The library's own doctrine as a strata contract: the five irreducible UI
// primitives are bedrock, the three UI Jobs rest on them, components rest on
// the Jobs. One reference to an unarticulated principle ("attention-budget")
// auto-materializes a GAP arc — the discovery-opportunity mechanic.
const interactionDesign: StrataContract = {
  brand: 'Trembus',
  code: 'vault.first-principles.ui',
  title: 'Interaction Design',
  caption:
    'Radial depth = fundamentality. Select a principle to see what it rests on — and what would collapse without it.',
  principles: [
    { id: 'surface', label: 'Surface', note: 'Somewhere for the interface to exist.' },
    { id: 'mark', label: 'Mark', note: 'Anything drawn on a Surface.' },
    { id: 'relation', label: 'Relation', note: 'Meaning from arrangement.' },
    { id: 'affordance', label: 'Affordance', note: 'An invitation to act.' },
    { id: 'state', label: 'State', note: 'The system’s memory of now.' },
    {
      id: 'reveal-state',
      label: 'Reveal State',
      sub: 'UI job',
      restsOn: ['surface', 'mark', 'state'],
      note: 'Make what IS perceivable.',
    },
    {
      id: 'afford-action',
      label: 'Afford Action',
      sub: 'UI job',
      restsOn: ['affordance', 'relation'],
      note: 'Make what COULD BE discoverable.',
    },
    {
      id: 'acknowledge-input',
      label: 'Acknowledge Input',
      sub: 'UI job',
      restsOn: ['state', 'affordance'],
      note: 'Make what JUST HAPPENED undeniable.',
    },
    {
      id: 'button',
      label: 'Button',
      restsOn: ['reveal-state', 'afford-action', 'acknowledge-input'],
      note: 'surface + mark + affordance + state.',
    },
    {
      id: 'progressive-disclosure',
      label: 'Progressive Disclosure',
      restsOn: ['reveal-state', 'attention-budget'],
      note: 'Reveal in the order attention is earned.',
    },
    {
      id: 'feedback-loop',
      label: 'Feedback Loop',
      conjecture: true,
      restsOn: ['acknowledge-input', 'state'],
      note: 'Proposed: every interaction closes a loop.',
    },
  ],
};

// A sparser, toned map mid-discovery: two named fundamentals, one bedrock
// conjecture, and TWO gaps (a shared missing support + a deeper one).
const combatDoctrine: StrataContract = {
  code: 'soul-steel.combat.axioms',
  title: 'Combat Feel',
  caption: 'A first-principles audit in progress — the dashed ground is unexplored.',
  principles: [
    {
      id: 'readability',
      label: 'Readability',
      tone: 'info',
      note: 'The player can parse the fight.',
    },
    {
      id: 'commitment',
      label: 'Commitment',
      tone: 'warning',
      note: 'Actions have weight; no free cancels.',
    },
    {
      id: 'fairness',
      label: 'Fairness',
      conjecture: true,
      note: 'Suspected bedrock: deaths must feel earned.',
    },
    {
      id: 'telegraphing',
      label: 'Telegraphing',
      tone: 'info',
      restsOn: ['readability', 'fairness'],
    },
    {
      id: 'hitstop',
      label: 'Hitstop',
      tone: 'danger',
      restsOn: ['commitment', 'impact-perception'],
      note: 'Rests on an unarticulated theory of impact.',
    },
    {
      id: 'dodge-windows',
      label: 'Dodge Windows',
      restsOn: ['telegraphing', 'commitment', 'impact-perception'],
    },
  ],
};

/**
 * Concentric first-principles strata — "what rests on what". Radius encodes
 * FUNDAMENTALITY: bedrock principles (empty `restsOn`) fill the core, and each derived
 * principle sits in the ring matching its longest support chain. It is strata with
 * DAG links, deliberately NOT a sunburst — no part-of-whole is implied, and rings
 * compress as depth grows so deep maps never escape the plot box.
 *
 * ### When to use it
 * - First-principles maps, capability stacks, knowledge foundations — anywhere the
 *   question is "what does this rest on?" and "what would collapse if this failed?"
 * - Not for part-of-whole shares → ui `DonutChart` / `Treemap`; not for flow between
 *   peers → `Lineage`.
 *
 * ### Data & key props
 * - `data.principles` — `{ id, label, restsOn?, conjecture?, tone?, sub?, note? }`
 *   (`id` REQUIRED + unique); `data.title` draws in the center hub.
 * - A dangling `restsOn` reference auto-materializes a dashed GAP arc in the ring
 *   beneath — an undiscovered support surfaced as an opportunity, never an error.
 *   Don't "fix" a gap by deleting the reference; add the missing principle or keep
 *   the gap visible.
 * - `conjecture: true` renders a dashed arc — proposed, not yet established.
 * - `selectedId` / `defaultSelectedId` / `onSelect` — the selection trio.
 *
 * ### Accessibility
 * - The SVG geology is `aria-hidden` decoration; every principle (gaps included) is a
 *   real focusable HTML `<button>` with full Arrow/Home/End roving.
 * - Selecting lights the LOAD CONE — everything resting on the selection — and the
 *   `aria-live` inspector names direct supports in both directions.
 *
 * ### Theming & setup
 * - Untoned arcs carry the accent, fading with distance from bedrock; explicit `tone`
 *   overrides per principle.
 * - Setup: import `@trembus/viz/styles.css` once at the app root (it carries the full
 *   tokens foundation). `@trembus/viz` depends only on `@trembus/tokens` — no ui needed.
 */
const meta = {
  title: 'Visualizations/Strata',
  component: Strata,
  args: { data: interactionDesign },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 640, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Strata>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — bedrock fills the core; derived principles layer outward; the
 * unarticulated "attention-budget" support materializes as a dashed gap arc. */
export const Default: Story = {};

/** Job: Afford Action — tones, conjectures, and multiple gaps; every arc (including
 * the undiscovered ones) is a focusable core-sample button, with the legend naming
 * the dashed vocabulary. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <Strata data={combatDoctrine} defaultSelectedId="hitstop" />
      <Strata
        data={{ ...interactionDesign, title: 'Interaction Design (bedrock view)' }}
        defaultSelectedId="state"
      />
    </div>
  ),
};

/** Job: Acknowledge Input — selecting bedrock lights its full load cone (the blast
 * radius of a false axiom) and the inspector announces foundations + load. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const state = canvas.getByRole('button', { name: /^State, layer 0$/ });
    await expect(state).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(state);
    await expect(state).toHaveAttribute('aria-pressed', 'true');
    // State's load: Reveal State, Acknowledge Input, Button, Progressive Disclosure, Feedback Loop.
    await expect(canvas.getByText(/Load: 5/)).toBeInTheDocument();
    await expect(canvas.getByText(/bedrock/)).toBeInTheDocument();
    // Direct dependents are on the load cone…
    await expect(canvas.getByRole('button', { name: /^Reveal State/ })).toHaveClass('is-cone');
    // …while an unrelated bedrock sibling stays legible and un-highlighted.
    await expect(canvas.getByRole('button', { name: /^Relation/ })).not.toHaveClass('is-cone');
  },
};
