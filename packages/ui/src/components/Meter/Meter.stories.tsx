import type { Meta, StoryObj } from '@storybook/react-vite';
import { Meter } from './Meter';

/**
 * A static measurement read against capacity — disk, quota, load — rendered as a
 * bordered track with a tone-coded fill (`role="meter"`). Three variants: `solid`
 * fills to the value, `stacked` lays proportional segments across the track, and
 * `threshold` recolors the fill as the value crosses configured markers. Lead job:
 * reveal state — a read-out, not a control.
 *
 * ### When to use it
 * - Showing how much of a fixed capacity is used or measured right now.
 * - Not for task completion that advances over time — use `Progress` (`role="progressbar"`).
 * - Not for a needle dial with zone semantics — use `Gauge`.
 *
 * ### Data & key props
 * - `value` (default `0`) against `min`/`max` (defaults `0`/`100`).
 * - `variant` — `solid` (default) · `stacked` (give `segments: {value, tone?, label?}[]`) ·
 *   `threshold` (give `thresholds: {value, tone?}[]`; the fill takes the tone of the
 *   highest marker the value has crossed).
 * - `tone` (default `success`) · `size` (`sm|md|lg`, default `md`) · `glow` (HUD skin) ·
 *   `icon` (leading chip) · `showValue` (default on for solid/threshold, off for stacked).
 * - `label` — the accessible name; always pass one.
 *
 * ### Accessibility
 * - The track is `role="meter"` with `aria-valuenow` (clamped to `[min, max]`),
 *   `aria-valuemin`/`aria-valuemax`, and `label` as `aria-label`.
 * - `stacked` exposes the per-segment breakdown via `aria-valuetext`; threshold
 *   markers and the icon chip are `aria-hidden` decoration.
 * - Not interactive — no focus stop, nothing to press.
 *
 * ### Theming & setup
 * - Tones map to `var(--tcl-status-*)` / `var(--tcl-accent)`; `glow` is a static
 *   decorative sheen. Works in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Meter',
  component: Meter,
  args: { value: 57, label: 'Disk usage' },
  argTypes: {
    tone: {
      control: 'select',
      options: ['accent', 'info', 'success', 'warning', 'danger', 'neutral'],
    },
    variant: { control: 'inline-radio', options: ['solid', 'stacked', 'threshold'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — a measurement filled to its value. */
export const Default: Story = {};

/** Job: Afford Action — solid, threshold (recoloring gauge), and stacked proportions. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, minWidth: 420 }}>
      <Meter value={57} tone="success" label="Solid" />
      <Meter
        value={57}
        tone="success"
        variant="threshold"
        thresholds={[
          { value: 50, tone: 'warning' },
          { value: 80, tone: 'danger' },
        ]}
        glow
        label="Threshold gauge (warning at 50, danger at 80)"
      />
      <Meter
        variant="stacked"
        showValue={false}
        segments={[
          { value: 45, tone: 'info', label: '45%' },
          { value: 30, tone: 'success', label: '30%' },
          { value: 25, tone: 'neutral', label: '25%' },
        ]}
        label="Storage by type"
      />
    </div>
  ),
};

/** Job: Acknowledge Input — values, threshold crossings, and sizes. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, minWidth: 420 }}>
      <Meter
        value={20}
        tone="success"
        variant="threshold"
        thresholds={[
          { value: 50, tone: 'warning' },
          { value: 80, tone: 'danger' },
        ]}
        label="Healthy"
      />
      <Meter
        value={65}
        tone="success"
        variant="threshold"
        thresholds={[
          { value: 50, tone: 'warning' },
          { value: 80, tone: 'danger' },
        ]}
        label="Warning"
      />
      <Meter
        value={92}
        tone="success"
        variant="threshold"
        thresholds={[
          { value: 50, tone: 'warning' },
          { value: 80, tone: 'danger' },
        ]}
        glow
        label="Critical"
      />
      <Meter value={40} size="sm" tone="info" label="Small" />
    </div>
  ),
};
