import type { Meta, StoryObj } from '@storybook/react-vite';
import { Gauge } from './Gauge';
import type { GaugeProps } from './Gauge';

// The PMO DIRT-lag gauge: green ≤ target, amber ≤ 2×target, red beyond.
const dirtZones: GaugeProps['zones'] = [
  { upTo: 1, tone: 'success', label: 'on target' },
  { upTo: 2, tone: 'warning', label: 'slipping' },
  { upTo: 3, tone: 'danger', label: 'late' },
];

/**
 * A 180° needle dial: one measurement drawn against optional colored quality
 * zones (green/amber/red) and a target tick. Lead job: **reveal state** — and it
 * is the viz spine's *presentational* exception: no selection, no inspector, no
 * focusable data points; the whole component is a single `role="meter"`.
 *
 * ### When to use it
 * - One current value judged against quality bands: latency, utilization, lag.
 * - Not for task completion — use `Progress`; not for value-against-capacity with
 *   segments/thresholds — use `Meter`; not for trends — `Sparkline` / `LineChart`.
 *
 * ### Data & key props
 * - `value` + `max` — required; `min` defaults to 0.
 * - `zones` — `{ upTo, tone?, color?, label? }[]`; each band runs from the prior
 *   bound. Without zones the arc fills to `value` in `tone` (default `accent`).
 * - `target` — `{ value, label? }` threshold tick; `unit` suffixes the readout.
 * - `label` — metric name under the value; `ariaLabel` — accessible name override
 *   (defaults to `label`; give one of them so the meter is named).
 * - Out-of-range values clamp once and everywhere — needle, readout,
 *   `aria-valuenow`, and `aria-valuetext` all report the same bounded value.
 *
 * ### Accessibility
 * - `role="meter"` with `aria-valuenow` / `aria-valuemin` / `aria-valuemax`, plus
 *   an `aria-valuetext` that appends the active zone's label ("1.2d, slipping") —
 *   the band's meaning travels in words, not color alone.
 * - The SVG dial and the min/max scale ends are decorative (`aria-hidden`); there
 *   are no interactive parts (the Badge/Skeleton presentational precedent).
 *
 * ### Theming & setup
 * - Zone tones map to `--tcl-status-*` / `--tcl-accent`; explicit `color` hex
 *   overrides. Correct in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Visualizations/Gauge',
  component: Gauge,
  args: {
    value: 1.2,
    max: 3,
    unit: 'd',
    zones: dirtZones,
    target: { value: 1.0, label: '≤ 1.0d' },
    label: 'DIRT lag',
  },
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Gauge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a single DIRT gauge with quality bands and a target tick. */
export const Default: Story = {};

/** Job: Reveal State — the same dial reading into each band: on-target, slipping, late. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      {[
        { value: 0.7, label: 'On target' },
        { value: 1.6, label: 'Slipping' },
        { value: 2.6, label: 'Late' },
      ].map((s) => (
        <div key={s.label} style={{ width: 200 }}>
          <Gauge
            value={s.value}
            max={3}
            unit="d"
            zones={dirtZones}
            target={{ value: 1.0, label: '≤ 1.0d' }}
            label={s.label}
          />
        </div>
      ))}
    </div>
  ),
};

/** Job: Acknowledge Input — a utilization dial with custom zones; value exposed via role=meter. */
export const Zones: Story = {
  args: {
    value: 68,
    max: 100,
    unit: '%',
    label: 'Utilization',
    zones: [
      { upTo: 45, tone: 'danger', label: 'under-utilized' },
      { upTo: 75, tone: 'warning', label: 'below target' },
      { upTo: 100, tone: 'success', label: 'healthy' },
    ],
    target: { value: 75, label: '75%' },
  },
};
