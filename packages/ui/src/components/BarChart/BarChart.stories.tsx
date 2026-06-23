import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { BarChart } from './BarChart';
import type { BarChartContract } from './BarChart';

// A real bar-chart contract instance — the authored Visual Grammar shape.
const coverage: BarChartContract = {
  view: 'bar-chart',
  brand: 'Trembus',
  code: 'trembus.ui.coverage',
  title: 'Test coverage by area',
  caption:
    'Line coverage across the library, measured against the 90% target. Click a bar to inspect it.',
  unit: '%',
  markers: [{ value: 90, label: 'target', tone: 'success' }],
  bars: [
    {
      id: 'tokens',
      label: 'Tokens',
      value: 98,
      tone: 'success',
      sub: '45/46 lines',
      note: 'Token scales and theme overrides are fully exercised.',
    },
    {
      id: 'primitives',
      label: 'Primitives',
      value: 94,
      tone: 'success',
      note: 'Box, Stack, Text, and Pressable carry the most cases.',
    },
    {
      id: 'components',
      label: 'Components',
      value: 86,
      tone: 'warning',
      sub: '24 components',
      note: 'Most components are covered; a few Table edge cases are still pending.',
    },
    {
      id: 'hooks',
      label: 'Hooks',
      value: 72,
      tone: 'warning',
      note: 'Focus-trap and dismissable paths need more cases.',
    },
    {
      id: 'viz',
      label: 'Viz',
      value: 61,
      tone: 'danger',
      note: 'Only Hub and Brief have full coverage so far — BarChart is next.',
    },
  ],
};

const meta = {
  title: 'Visualizations/BarChart',
  component: BarChart,
  args: { data: coverage },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 560, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — every value as a bar on one axis, color-coded, with a target line. */
export const Default: Story = {};

/** Job: Afford Action — the same contract drawn horizontally; each bar is a button, one per tone. */
export const States: Story = {
  args: {
    data: {
      view: 'bar-chart',
      code: 'trembus.ui.issues',
      title: 'Open issues by severity',
      caption: 'The tone ontology as a horizontal chart — each bar is a selectable button.',
      orientation: 'horizontal',
      bars: [
        {
          id: 'crit',
          label: 'Critical',
          value: 2,
          tone: 'danger',
          note: 'Two crashes on portal teardown — being triaged.',
        },
        {
          id: 'high',
          label: 'High',
          value: 5,
          tone: 'warning',
          note: 'Mostly contrast regressions in dark theme.',
        },
        { id: 'med', label: 'Medium', value: 9, tone: 'info', note: 'Polish and docs gaps.' },
        { id: 'low', label: 'Low', value: 14, tone: 'neutral', note: 'Nice-to-have refinements.' },
        {
          id: 'done',
          label: 'Resolved',
          value: 38,
          tone: 'success',
          note: 'Closed this milestone.',
        },
      ],
    },
  },
};

/** Job: Acknowledge Input — selecting a bar rings it and reveals its detail. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole('button', { name: /Components: 86%/ });
    await expect(bar).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(bar);
    await expect(bar).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/Table edge cases/)).toBeInTheDocument();
  },
};

/**
 * Clustered multi-series — one bar per series under each category, with a legend.
 * Selecting any bar names its series + category in the inspector.
 */
export const Grouped: Story = {
  args: {
    data: {
      view: 'bar-chart',
      code: 'pmo.utilization.byteam',
      title: 'Utilization vs target by team',
      caption: 'Billable vs target utilization across delivery teams. Click any bar to inspect it.',
      unit: '%',
      max: 100,
      markers: [{ value: 80, label: 'target', tone: 'success' }],
      categories: ['Platform', 'Data', 'Cloud', 'Advisory'],
      series: [
        { id: 'billable', name: 'Billable', tone: 'accent', values: [78, 84, 71, 66] },
        { id: 'target', name: 'Target', tone: 'neutral', values: [80, 80, 80, 75] },
        { id: 'forecast', name: 'Forecast', tone: 'info', values: [82, 86, 74, 70] },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole('button', { name: 'Forecast, Data: 86%' });
    await expect(bar).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(bar);
    await expect(bar).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/Data · 86%/)).toBeInTheDocument();
  },
};
