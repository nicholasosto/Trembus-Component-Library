import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Heatmap } from './Heatmap';
import type { HeatmapContract } from './Heatmap';

const weeks = ['Apr 7', 'Apr 14', 'Apr 21', 'Apr 28', 'May 5', 'May 12', 'May 19', 'May 26'];

// The PMO utilization heatmap: resource × week, bucketed against the 75% target.
const util: HeatmapContract = {
  view: 'heatmap',
  code: 'pmo.delivery.util',
  title: 'Utilization heatmap — resource × week',
  caption: 'Utilized ÷ basis hours, billable resources. Select a cell to inspect it.',
  unit: '%',
  columns: weeks,
  stops: [
    { at: 0, tone: 'danger', label: '< 45%' },
    { at: 45, tone: 'warning', label: '45–65' },
    { at: 65, tone: 'info', label: '65–75' },
    { at: 75, tone: 'success', label: '≥ 75%' },
  ],
  rows: [
    { label: 'Dana Okafor', sub: 'Cloud', cells: [82, 88, 91, 92, 86, 78, 84, 90] },
    { label: 'Sam Reyes', sub: 'Data', cells: [71, 68, 74, 80, 83, 79, 72, 76] },
    { label: 'Priya Nair', sub: 'Cloud', cells: [55, 61, 58, 64, 70, 66, 62, 59] },
    { label: 'Jonah Kim', sub: 'Security', cells: [44, 39, 52, 48, 55, 61, 47, 43] },
    { label: 'Mara Vance', sub: 'Data', cells: [90, 92, 88, 85, 91, 94, 89, 87] },
    { label: 'Theo Blume', sub: 'Design', cells: [38, 42, 35, 49, 51, 44, 40, 46] },
  ],
};

const meta = {
  title: 'Visualizations/Heatmap',
  component: Heatmap,
  args: { data: util },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 560, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Heatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — resource × week shaded by a bucketed utilization scale. */
export const Default: Story = {};

/** Job: Afford Action — a compact continuous-scale grid with values and a no-data cell. */
export const States: Story = {
  args: {
    data: {
      view: 'heatmap',
      code: 'pmo.time.dirt-dow',
      title: 'DIRT by day-of-week × cost center',
      caption: 'Average submission lag (days); hatched = no hours that day.',
      unit: 'd',
      tone: 'warning',
      showValues: true,
      columns: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      rows: [
        { label: 'CC-Cloud', cells: [2.1, 1.4, 1.2, 0.9, 0.6] },
        { label: 'CC-Data', cells: [1.8, 1.6, 1.1, 1.0, 0.8] },
        { label: 'CC-Security', cells: [2.4, 1.9, null, 1.3, 0.7] },
      ],
    },
  },
};

/** Job: Acknowledge Input — selecting a cell rings it and reveals its value. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByRole('button', { name: 'Dana Okafor, Apr 28: 92%' });
    await expect(cell).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(cell);
    await expect(cell).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/Apr 28 · 92%/)).toBeInTheDocument();
  },
};
