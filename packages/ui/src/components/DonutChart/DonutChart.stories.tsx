import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { DonutChart } from './DonutChart';
import type { DonutContract } from './DonutChart';

// The PMO "Hours Mix — engagement type" donut.
const hoursMix: DonutContract = {
  view: 'donut',
  code: 'pmo.exec.hours-mix',
  title: 'Hours mix — engagement type',
  caption: 'Person hours by engagement type, latest week. Select a part to inspect its share.',
  unit: 'h',
  centerLabel: 'hours · wk',
  segments: [
    {
      id: 'tm',
      label: 'Time & Materials',
      value: 1840,
      tone: 'warning',
      note: 'Largest book; rate-card driven.',
    },
    {
      id: 'fp',
      label: 'Fixed Price',
      value: 1120,
      tone: 'success',
      note: 'Margin depends on delivery efficiency.',
    },
    {
      id: 'staff',
      label: 'Staff Aug',
      value: 760,
      tone: 'info',
      note: 'Embedded resources at client sites.',
    },
    {
      id: 'support',
      label: 'Support / MSA',
      value: 410,
      tone: 'accent',
      note: 'Recurring retainer hours.',
    },
    {
      id: 'internal',
      label: 'Internal',
      value: 280,
      tone: 'neutral',
      note: 'Non-billable investment time.',
    },
  ],
};

/**
 * A part-of-whole proportion ring with a center readout and an interactive legend.
 * It consumes the Trembus Visual Grammar **donut contract**. Lead job: **reveal
 * state** — the ring shows composition at a glance; selecting a legend row
 * emphasizes its segment, dims the rest, and swaps the center readout to that part.
 *
 * ### When to use it
 * - Part-of-whole composition with up to ~6 slices (hours mix, budget split).
 * - Not for more slices or nested composition — use `Treemap`; not for categories
 *   against a shared axis — use `BarChart`.
 *
 * ### Data & key props
 * - `data.segments` — `{ id?, label, value, tone?, color?, note? }[]`; give stable
 *   `id`s (a missing id falls back to the segment index, never the label).
 *   Negative values are floored at 0; untoned segments cycle the tone ontology.
 * - `data.centerValue` / `centerLabel` — the center readout (defaults to the
 *   total); `unit` suffixes every value.
 * - `selectedId` / `defaultSelectedId` / `onSelect` — the standard selection trio.
 * - `size` — ring diameter in px (default 160).
 *
 * ### Accessibility
 * - The ring SVG is decorative (`aria-hidden`); each legend row is a real
 *   `<button>` with `aria-pressed` and a "label: value, share%" accessible name,
 *   grouped under `role="group"` named by the title.
 * - The selected segment's value, share, and note are announced through the
 *   `aria-live` inspector; segment/legend transitions stop under
 *   `prefers-reduced-motion`.
 *
 * ### Theming & setup
 * - Tones map to `--tcl-accent` / `--tcl-status-*`; explicit `color` hex overrides.
 *   Correct in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Visualizations/DonutChart',
  component: DonutChart,
  args: { data: hoursMix },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 420, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DonutChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — proportions as a ring with the total in the center and a legend. */
export const Default: Story = {};

/** Job: Afford Action — one part pre-selected: its segment pops, the rest dim, the center swaps. */
export const States: Story = {
  args: { defaultSelectedId: 'fp' },
};

/** Job: Acknowledge Input — selecting a legend row emphasizes its segment and inspects its share. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const item = canvas.getByRole('button', { name: /Staff Aug: 760h/ });
    await expect(item).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(item);
    await expect(item).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/Embedded resources/)).toBeInTheDocument();
  },
};
