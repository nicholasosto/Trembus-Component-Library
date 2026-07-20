import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Funnel } from './Funnel';
import type { FunnelContract } from './Funnel';

// A real funnel contract instance — the authored Visual Grammar shape.
const pipeline: FunnelContract = {
  view: 'funnel',
  brand: 'Trembus',
  code: 'pmo.pipeline.conversion',
  title: 'Engagement pipeline',
  caption:
    'Deals progressing from booked to revenue. Each stage is sized against the top; click one to inspect its conversion.',
  unit: ' deals',
  stages: [
    {
      id: 'booked',
      label: 'Booked',
      value: 120,
      tone: 'info',
      note: 'All opportunities marked closed-won this quarter.',
    },
    {
      id: 'approved',
      label: 'Approved',
      value: 96,
      tone: 'accent',
      note: 'Passed finance + resourcing review.',
    },
    {
      id: 'staffed',
      label: 'Staffed',
      value: 71,
      tone: 'success',
      note: 'Engagement manager and team assigned.',
    },
    {
      id: 'pending',
      label: 'Pending WSC',
      value: 38,
      tone: 'warning',
      note: 'Awaiting the work-start confirmation source.',
    },
    {
      id: 'invoiced',
      label: 'Invoiced',
      value: 22,
      tone: 'danger',
      note: 'First invoice raised in NetSuite.',
    },
  ],
};

/**
 * An ordered stage-drop-off chart: each stage of one flow is a horizontal bar on a
 * shared track, and selecting a stage reports its conversion versus the top AND
 * the drop from the previous stage. It consumes the Trembus Visual Grammar
 * **funnel contract**. Lead job: **reveal state** — the descending shape makes
 * drop-off perceivable at a glance.
 *
 * ### When to use it
 * - One directional flow with ordered stages: pipeline, signup, checkout,
 *   compliance gates.
 * - Not for independent categories on a shared axis — use `BarChart`; not for
 *   part-of-whole composition — use `DonutChart`.
 *
 * ### Data & key props
 * - `data.stages` — `{ id?, label, value, tone?, color?, note? }[]` in flow order;
 *   give stable `id`s (a missing id falls back to the stage index, never the label).
 * - `data.unit` suffixes every value; header fields (`title` / `caption` / `code`) are optional.
 * - `selectedId` / `defaultSelectedId` / `onSelect` — the standard selection trio.
 * - Conversion is measured against the first stage; bars are sized against the
 *   *largest* stage and the printed % clamps to 100, so non-monotonic data can
 *   never overflow the track or contradict its own label.
 *
 * ### Accessibility
 * - Stages sit under `role="group"` named by the title; each stage is a real
 *   `<button>` with `aria-pressed` and a "label: value, N% of top" accessible name.
 * - The selected stage's value, conversion, drop from the previous stage, and note
 *   are announced through the `aria-live` inspector; bar/row transitions stop
 *   under `prefers-reduced-motion`.
 *
 * ### Theming & setup
 * - Stage tones map to `--tcl-accent` / `--tcl-status-*` (default `accent`);
 *   explicit `color` hex overrides. Correct in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Visualizations/Funnel',
  component: Funnel,
  args: { data: pipeline },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 520, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Funnel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — descending stages on one track, color-coded, with conversion read out. */
export const Default: Story = {};

/** Job: Afford Action — a leaner funnel; each stage is a selectable button, one per tone. */
export const States: Story = {
  args: {
    data: {
      view: 'funnel',
      code: 'pmo.timesheet.compliance',
      title: 'Timesheet compliance',
      caption: 'Share of the team clearing each gate of the weekly time-entry process.',
      unit: '%',
      stages: [
        { id: 'opened', label: 'Opened', value: 100, tone: 'neutral', note: 'Period is open.' },
        { id: 'entered', label: 'Entered', value: 88, tone: 'info', note: 'Hours logged.' },
        {
          id: 'submitted',
          label: 'Submitted',
          value: 74,
          tone: 'accent',
          note: 'Sent for approval.',
        },
        {
          id: 'approved',
          label: 'Approved',
          value: 61,
          tone: 'success',
          note: 'Manager signed off.',
        },
      ],
    },
  },
};

/** Job: Acknowledge Input — selecting a stage rings it and reveals its drop-off. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stage = canvas.getByRole('button', { name: /Staffed: 71 deals/ });
    await expect(stage).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(stage);
    await expect(stage).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/from Approved/)).toBeInTheDocument();
  },
};
