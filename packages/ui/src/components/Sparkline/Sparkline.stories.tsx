import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkline } from './Sparkline';
import type { SparklineTone } from './Sparkline';

// A DIRT-lag series lifted from the PMO dashboard's KPI cards.
const dirt = [2.1, 1.9, 2.0, 1.7, 1.5, 1.6, 1.3, 1.2, 1.4, 1.1, 0.9, 1.0];

/**
 * A word-sized trend line — the series becomes one path in a tiny box so its
 * trajectory reads at a glance. An accent, not a chart: no axes, no interaction.
 * Presentational by design — pair it with a `Stat` value or a table cell (`Stat`
 * embeds one via its `trend` prop).
 *
 * ### When to use it
 * - Showing the direction/shape of a series beside a number or in a dense row.
 * - Not when values must be read precisely or series compared — use `LineChart`.
 *
 * ### Data & key props
 * - `values: (number | null | undefined)[]` — `null`/non-finite entries are gaps
 *   the line skips over (never zero-fill missing data).
 * - `tone` (default `accent`) or `color` (explicit stroke, overrides `tone`).
 * - `area` fill (default `true`) · `markLast` dot on the final point (default
 *   `true`) · `min`/`max` force the y-domain so sibling sparklines share one scale.
 * - `width`/`height` set the intrinsic viewBox (100×30); CSS may stretch it — the
 *   stroke stays crisp (`vectorEffect="non-scaling-stroke"`).
 *
 * ### Accessibility
 * - `label` given → exposed as `role="img"` with `aria-label` + an SVG `<title>`;
 *   omitted → decorative (`aria-hidden`). Not focusable; takes no input.
 * - A forced `min`/`max` on the wrong side clamps rather than inverting the domain.
 *
 * ### Theming & setup
 * - Tones map to `var(--tcl-accent)` / `var(--tcl-status-*)`; works in light ·
 *   dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Visualizations/Sparkline',
  component: Sparkline,
  args: { values: dirt, label: 'DIRT lag — last 12 weeks, latest 1.0 days' },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Sparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

// Single-sparkline stories get a small fixed box; the grid story lays itself out.
const oneSpark: Story['decorators'] = [
  (Story) => (
    <div style={{ width: 180 }}>
      <Story />
    </div>
  ),
];

/** Job: Afford Action — a single presentational trend, sized to its container. */
export const Default: Story = { decorators: oneSpark };

/** Job: Reveal State — rising / falling / flat / volatile shapes across the tone ontology. */
export const States: Story = {
  render: () => {
    const rows: { label: string; values: number[]; tone: SparklineTone }[] = [
      { label: 'Rising', values: [3, 4, 4, 6, 7, 9, 11, 14], tone: 'success' },
      { label: 'Falling', values: [14, 12, 11, 9, 8, 6, 5, 3], tone: 'danger' },
      { label: 'Flat', values: [7, 7, 7, 7, 7, 7, 7, 7], tone: 'neutral' },
      { label: 'Volatile', values: [4, 11, 5, 13, 6, 12, 4, 10], tone: 'warning' },
      { label: 'Gappy', values: [3, 5, NaN, 8, 6, NaN, 9, 12], tone: 'info' },
    ];
    return (
      <div style={{ display: 'grid', gap: 14, width: 260 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 64,
                fontFamily: 'var(--tcl-font-mono)',
                fontSize: 'var(--tcl-text-xs)',
                color: 'var(--tcl-text-dim)',
              }}
            >
              {r.label}
            </span>
            <Sparkline
              values={r.values}
              tone={r.tone}
              label={`${r.label} trend`}
              className="tcl-sb-spark"
            />
          </div>
        ))}
        <style>{'.tcl-sb-spark{width:160px;height:32px}'}</style>
      </div>
    );
  },
};

/** Job: Acknowledge Input — the labeled trend exposed to assistive tech (role=img + title). */
export const Labeled: Story = {
  decorators: oneSpark,
  args: {
    values: dirt,
    tone: 'warning',
    label: 'DIRT lag falling from 2.1 to 1.0 days over 12 weeks',
  },
};
