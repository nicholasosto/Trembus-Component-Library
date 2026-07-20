import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Stat } from './Stat';
import { Badge } from '../Badge/Badge';

const dirt = [2.1, 1.9, 2.0, 1.7, 1.5, 1.6, 1.3, 1.2, 1.4, 1.1, 0.9, 1.0];
const revenue = [210, 224, 198, 240, 232, 251, 268, 274, 281, 296, 305, 318];

/**
 * The KPI tile: a labeled headline value with an optional period-over-period delta
 * chip, target/context line, status badge, and an embedded trend sparkline — the
 * signature card of the PMO dashboard. Presentational by default; `onSelect` or
 * `href` turns the whole tile into a drill-in control. Lead job: reveal state.
 *
 * ### When to use it
 * - One metric per tile, at dashboard/hero altitude.
 * - Not for a series that must be read precisely — use `LineChart`; the embedded
 *   `trend` is a `Sparkline` accent, not a chart.
 * - Not for a measurement against capacity — use `Meter` or `Gauge`.
 *
 * ### Data & key props
 * - `label` (required) · `value` (defaults to `"—"` for awaiting-data tiles) ·
 *   `unit` · `strap` (eyebrow) · `target` (context line) · `badge` (slot, e.g. a
 *   `Badge`).
 * - `delta: { value, text?, invert? }` — signed change as a ▲/▼ chip; set `invert`
 *   when a DECREASE is good (latency/lag metrics).
 * - `trend: (number | null)[]` — embeds a tone-matched sparkline strip.
 * - `tone` (default `accent`) · `onSelect` (renders a `<button>`) · `href` (renders
 *   an `<a>`; takes precedence over `onSelect`).
 *
 * ### Accessibility
 * - The delta chip carries a worded `aria-label` ("down by 0.20d", "no change, …");
 *   the arrow glyph is `aria-hidden`, so direction is never glyph- or color-only.
 * - As a drill-in the tile is a real `<button>`/`<a>`: focusable with the library
 *   focus ring, activated by click or Enter/Space.
 * - The embedded sparkline is decorative (no label), so it adds no SR noise.
 *
 * ### Theming & setup
 * - `tone` drives the top accent rail, strap, and sparkline; delta good/bad colors
 *   come from the status tokens. Works in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Stat',
  component: Stat,
  args: {
    label: 'DIRT — avg lag',
    value: '1.0',
    unit: 'days',
    strap: 'Cat 2 · Time Entry',
    tone: 'warning',
    delta: { value: -0.2, text: '0.20d', invert: true },
    target: 'Target ≤ 1.0d · Mon-cleared 92% · premature 3%',
    trend: dirt,
    badge: (
      <Badge tone="success" dot>
        Live
      </Badge>
    ),
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Stat>;

export default meta;
type Story = StoryObj<typeof meta>;

// Single-card stories get a column-width wrapper; the grid stories run full width.
const oneCard: Story['decorators'] = [
  (Story) => (
    <div style={{ width: 280 }}>
      <Story />
    </div>
  ),
];

/** The canonical PMO hero card: value, inverted delta (lower lag is good), target, trend. */
export const Default: Story = { decorators: oneCard };

/** Job: Reveal State — the metric vocabulary: good/bad/inverted deltas, pending, and tones. */
export const States: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
      }}
    >
      <Stat
        strap="Cat 5 · Delivery"
        label="Portfolio deal margin"
        value="31.4"
        unit="%"
        tone="success"
        delta={{ value: 1.8, text: '+1.8pp' }}
        target="Target ≥ 28% · 42 engagements priced"
        trend={revenue}
        badge={<Badge tone="success">Live</Badge>}
      />
      <Stat
        strap="Cat 4 · Process"
        label="Hours approved"
        value="93.2"
        unit="%"
        tone="info"
        delta={{ value: -0.6, text: '0.6pp' }}
        target="Target 95% · time-card workflow"
        trend={[88, 90, 91, 89, 92, 94, 93, 95, 92, 93]}
        badge={<Badge tone="info">Live</Badge>}
      />
      <Stat
        strap="Cat 2 · Time Entry"
        label="DIRT — avg lag"
        value="1.0"
        unit="days"
        tone="warning"
        delta={{ value: -0.2, text: '0.20d', invert: true }}
        target="Target ≤ 1.0d · lower is better"
        trend={dirt}
        badge={<Badge tone="warning">Live</Badge>}
      />
      <Stat
        strap="Cat 1 · Project Creation"
        label="Onboarding health"
        tone="neutral"
        target="Needs KPI_PROJECT_MASTER + KPI_MISSING_PROJECTS"
        badge={<Badge tone="neutral">Awaiting WSC</Badge>}
      />
    </div>
  ),
};

/** Job: Afford Action — a drill-in card; the whole tile is a button with a hover affordance. */
export const Interactive: Story = {
  decorators: oneCard,
  args: {
    onSelect: fn(),
    badge: <Badge tone="success">Live</Badge>,
  },
};

/** Job: Acknowledge Input — clicking the drill-in card fires onSelect and the tile takes focus. */
export const Interaction: Story = {
  decorators: oneCard,
  args: { onSelect: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole('button', { name: /DIRT — avg lag/ });
    // pointer activation
    await userEvent.click(card);
    await expect(card).toHaveFocus();
    await expect(args.onSelect).toHaveBeenCalledTimes(1);
    // keyboard activation (backs the contract's Enter/Space claim)
    await userEvent.keyboard('{Enter}');
    await expect(args.onSelect).toHaveBeenCalledTimes(2);
  },
};
