import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { DecisionMap } from './DecisionMap';
import type { DecisionMapContract } from './DecisionMap';

// A real (and self-documenting) open decision: where this very component should
// live. The recommendation auto-seeds the selection, so the recommended path's
// consequence cascade is visible on first paint.
const whereToLive: DecisionMapContract = {
  view: 'decision-map',
  title: 'Where should DecisionMap itself live?',
  context:
    'The component renders option cards + consequence cascades with a deterministic layout. ' +
    'The repo splits visualizations by tier: Tier-1 (no layout engine) in @trembus/ui, ' +
    'Tier-2 node-link (d3/dagre) in @trembus/viz.',
  recommendation: {
    optionId: 'ui',
    strength: 'strong',
    confidence: 88,
    rationale:
      'A deterministic card/cascade layout needs no layout engine, and the Tier-1 spine ' +
      '(button cards + aria-live inspector) is exactly this shape.',
  },
  options: [
    {
      id: 'ui',
      label: '@trembus/ui (Tier-1)',
      summary: 'Ship it beside Hub/Timeline/Funnel on the Tier-1 interaction spine.',
      tone: 'success',
      effort: 'medium',
      reversibility: 'reversible',
      confidence: 88,
      consequences: [
        {
          label: 'Ships behind the 3-jobs contract gate',
          tone: 'success',
          likelihood: 'certain',
          horizon: 'immediate',
          then: [
            {
              label: 'check:contracts + the axe test keep the a11y spine honest',
              tone: 'success',
              likelihood: 'likely',
            },
          ],
        },
        {
          label: 'Can compose Box/Stack/Text primitives when useful',
          tone: 'info',
          likelihood: 'likely',
          horizon: 'near',
        },
        {
          label: 'Must stay layout-engine-free',
          tone: 'warning',
          likelihood: 'likely',
          horizon: 'near',
          then: [
            {
              label: 'A future radial/graph layout would force a Tier-2 split',
              tone: 'danger',
              likelihood: 'possible',
              horizon: 'later',
            },
          ],
        },
      ],
    },
    {
      id: 'viz',
      label: '@trembus/viz (Tier-2)',
      summary: 'Join Tree/Lineage/Strata and inherit the SVG node-link spine.',
      tone: 'warning',
      effort: 'high',
      reversibility: 'costly',
      confidence: 55,
      consequences: [
        {
          label: 'VizOverlay’s %-positioned buttons fight in-flow expanding cards',
          tone: 'danger',
          likelihood: 'likely',
          horizon: 'immediate',
        },
        {
          label: 'Pulls d3/dagre for a layout that needs neither',
          tone: 'warning',
          likelihood: 'certain',
          horizon: 'immediate',
        },
        {
          label: 'Free SVG edge routing if cascades ever become true graphs',
          tone: 'success',
          likelihood: 'possible',
          horizon: 'later',
        },
      ],
    },
    {
      id: 'example',
      label: 'Example-only composition',
      summary: 'No new component — compose Cards + Badges in an Examples/* story.',
      tone: 'neutral',
      effort: 'low',
      reversibility: 'reversible',
      confidence: 30,
      consequences: [
        {
          label: 'Zero new public API to maintain',
          tone: 'success',
          likelihood: 'certain',
          horizon: 'immediate',
        },
        {
          label: 'No reusable contract for LLM sessions to emit',
          tone: 'danger',
          likelihood: 'certain',
          horizon: 'near',
          then: [
            {
              label: 'Every planning doc reinvents the layout by hand',
              tone: 'danger',
              likelihood: 'likely',
              horizon: 'later',
            },
          ],
        },
        {
          label: 'Examples carry no contract gate or axe test',
          tone: 'warning',
          likelihood: 'certain',
        },
      ],
    },
  ],
};

// A decided ledger state: the recommendation was taken; the chosen card keeps a
// success ring, and the non-chosen cards stay fully legible and selectable.
const sessionStateDecided: DecisionMapContract = {
  view: 'decision-map',
  title: 'Where should session state live?',
  context:
    'The API needs server-side session state for the collaborative editor. Pick the store before the beta.',
  status: 'decided',
  decidedId: 'pg',
  decidedNote:
    'Locked 2026-07-02: Postgres — one fewer moving part, and the session table rides the existing backup/restore story.',
  recommendation: {
    optionId: 'pg',
    strength: 'strong',
    confidence: 82,
    rationale: 'You already run Postgres; sessions are low-write and the ops story is free.',
  },
  options: [
    {
      id: 'pg',
      label: 'Postgres session table',
      summary: 'Sessions live beside the data they guard.',
      tone: 'success',
      effort: 'medium',
      reversibility: 'reversible',
      confidence: 82,
      consequences: [
        {
          label: 'One fewer service to operate',
          tone: 'success',
          likelihood: 'certain',
          horizon: 'immediate',
        },
        {
          label: 'Session reads join the primary DB load',
          tone: 'warning',
          likelihood: 'likely',
          horizon: 'near',
          then: [
            {
              label: 'May need a read replica if the editor takes off',
              tone: 'warning',
              likelihood: 'possible',
              horizon: 'later',
            },
          ],
        },
        {
          label: 'Backups already cover session recovery',
          tone: 'success',
          likelihood: 'certain',
          horizon: 'immediate',
        },
      ],
    },
    {
      id: 'redis',
      label: 'Redis',
      summary: 'A dedicated in-memory session store.',
      tone: 'info',
      effort: 'medium',
      reversibility: 'reversible',
      confidence: 60,
      consequences: [
        {
          label: 'Sub-millisecond session reads',
          tone: 'success',
          likelihood: 'certain',
          horizon: 'immediate',
        },
        {
          label: 'A new service to deploy, monitor, and upgrade',
          tone: 'danger',
          likelihood: 'certain',
          horizon: 'near',
        },
        {
          label: 'Persistence needs its own snapshot story',
          tone: 'warning',
          likelihood: 'likely',
          horizon: 'later',
        },
      ],
    },
    {
      id: 'jwt',
      label: 'Stateless JWT',
      summary: 'No server-side state at all — claims ride the token.',
      tone: 'warning',
      effort: 'low',
      reversibility: 'one-way',
      confidence: 35,
      consequences: [],
    },
  ],
};

const meta = {
  title: 'Visualizations/DecisionMap',
  component: DecisionMap,
  args: { data: whereToLive },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1100 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DecisionMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Job: Reveal State — the open decision at a glance: recommendation ribbon + strength,
 * clamped confidence bars, effort/door chips, valence tallies; the selection auto-seeds
 * to the recommended option so its consequence cascade (including the dashed `possible`
 * second-order path) is visible on first paint.
 */
export const Default: Story = {};

/**
 * Job: Afford Action — every option card is one focusable button; here the decision is
 * already `decided`: the chosen card keeps a success ring + "Chosen" chip while the other
 * cards stay fully legible and selectable (including one with no consequences mapped).
 */
export const States: Story = {
  args: { data: sessionStateDecided },
};

/**
 * Job: Acknowledge Input — clicking a card flips `aria-pressed`, swaps the consequence
 * cascade, and announces the pick + tally in the aria-live inspector.
 */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ui = canvas.getByRole('button', {
      name: /^Option A: @trembus\/ui \(Tier-1\) — recommended, strong/,
    });
    const viz = canvas.getByRole('button', { name: /^Option B: @trembus\/viz \(Tier-2\)/ });
    // the selection auto-seeds to the recommended option
    await expect(ui).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(viz);
    await expect(viz).toHaveAttribute('aria-pressed', 'true');
    await expect(ui).toHaveAttribute('aria-pressed', 'false');
    // the live inspector reveals the newly selected option and its tally
    await expect(canvas.getByText(/Option B — @trembus\/viz/)).toBeInTheDocument();
    await expect(
      canvas.getByText(/3 consequences: 1 benefit, 1 caution, 1 risk/),
    ).toBeInTheDocument();
  },
};
