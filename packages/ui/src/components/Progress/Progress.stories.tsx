import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';

/**
 * A determinate task-completion bar (`role="progressbar"`) — the fill advances
 * proportional to `value / max`. `variant="segments"` renders discrete cells that
 * light up instead of a continuous fill. Lead job: reveal state — a read-out that
 * accompanies an operation, never a control.
 *
 * ### When to use it
 * - A task with measurable completion: uploads, installs, multi-step imports.
 * - Not for an unknown-length wait — use `Spinner` (or `Skeleton` when the coming
 *   layout is known).
 * - Not for a static measurement against capacity (disk, quota) — use `Meter`.
 *
 * ### Data & key props
 * - `value` (required) against `max` (default `100`); the fill clamps to 0–100%.
 * - `variant` — `solid` (default) or `segments` (+ `segments` cell count, default `10`).
 * - `tone` (default `accent`) · `size` (`sm|md|lg`, default `md`) · `glow` (opt-in
 *   neon HUD skin) · `icon` (leading chip) · `showValue` (right-side % read-out,
 *   default `true`).
 * - `label` — the accessible name; always pass one.
 *
 * ### Accessibility
 * - The track is `role="progressbar"` with `aria-valuenow` (clamped), `aria-valuemin`/
 *   `aria-valuemax`, and `label` as `aria-label`.
 * - The icon chip and cells are decorative; not interactive — no focus stop.
 * - The fill's width transition collapses to an instant change under
 *   `prefers-reduced-motion` (library-wide guard in `styles/a11y.css`).
 *
 * ### Theming & setup
 * - Tones map to `var(--tcl-accent)` / `var(--tcl-status-*)`; works in light ·
 *   dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Progress',
  component: Progress,
  args: { value: 72, label: 'Upload progress' },
  argTypes: {
    tone: {
      control: 'select',
      options: ['accent', 'info', 'success', 'warning', 'danger', 'neutral'],
    },
    variant: { control: 'inline-radio', options: ['solid', 'segments'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — a determinate fill proportional to value/max. */
export const Default: Story = {};

/** Job: Afford Action — solid vs segments, clean vs the opt-in glow skin. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, minWidth: 380 }}>
      <Progress value={72} tone="info" label="Solid" />
      <Progress value={68} tone="info" glow label="Solid + glow (HUD skin)" />
      <Progress value={60} variant="segments" segments={12} tone="info" label="Segments" />
      <Progress
        value={40}
        variant="segments"
        segments={6}
        tone="success"
        glow
        label="Segments + glow"
      />
    </div>
  ),
};

/** Job: Acknowledge Input — values across the range, sizes, and clamping. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, minWidth: 380 }}>
      <Progress value={0} tone="info" label="Empty" />
      <Progress value={40} tone="info" label="Partial" />
      <Progress value={100} tone="success" label="Complete" />
      <Progress value={120} tone="warning" label="Clamped over max" />
      <Progress value={50} size="sm" tone="info" label="Small" />
      <Progress value={50} size="lg" tone="info" glow label="Large + glow" />
    </div>
  ),
};
