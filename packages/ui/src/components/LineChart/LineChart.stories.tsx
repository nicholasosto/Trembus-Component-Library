import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { LineChart } from './LineChart';
import type { LineChartContract } from './LineChart';

const weeks = [
  'Apr 7',
  'Apr 14',
  'Apr 21',
  'Apr 28',
  'May 5',
  'May 12',
  'May 19',
  'May 26',
  'Jun 2',
  'Jun 9',
  'Jun 16',
  'Jun 23',
];
const dirtRaw = [2.1, 1.9, 2.0, 1.7, 1.5, 1.6, 1.3, 1.2, 1.4, 1.1, 0.9, 1.0];
const dirtMon = [1.4, 1.3, 1.5, 1.2, 1.0, 1.1, 0.9, 0.8, 1.0, 0.7, 0.6, 0.7];

// The PMO Time-Entry DIRT trend: two series against a target line.
const dirt: LineChartContract = {
  view: 'line-chart',
  code: 'pmo.time.dirt',
  title: 'Time-entry lag — DIRT trend',
  caption:
    'Raw vs Monday-anchored average days from work date to submission. Select a point to inspect it.',
  unit: 'd',
  target: { value: 1.0, label: 'target 1.0d' },
  series: [
    {
      id: 'raw',
      name: 'DIRT raw',
      tone: 'warning',
      fill: true,
      points: weeks.map((w, i) => ({
        x: w,
        y: dirtRaw[i],
        note: i === 10 ? 'Lowest lag of the quarter — a clean Monday close.' : undefined,
      })),
    },
    {
      id: 'mon',
      name: 'DIRT Monday-anchored',
      tone: 'info',
      dashed: true,
      points: weeks.map((w, i) => ({ x: w, y: dirtMon[i] })),
    },
  ],
};

const meta = {
  title: 'Visualizations/LineChart',
  component: LineChart,
  args: { data: dirt },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 620, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — two series on one axis with a dashed target line and a legend. */
export const Default: Story = {};

/** Job: Afford Action — a single filled series against a shaded tolerance band; points are buttons. */
export const States: Story = {
  args: {
    data: {
      view: 'line-chart',
      code: 'pmo.exec.margin',
      title: 'Realized labor margin % — weekly',
      caption: 'Measured against the 28–32% deal-margin tolerance band.',
      unit: '%',
      band: { lo: 28, hi: 32, label: 'deal-margin target 28–32%' },
      series: [
        {
          id: 'margin',
          name: 'Realized margin %',
          tone: 'success',
          fill: true,
          points: weeks.map((w, i) => ({
            x: w,
            y: [24, 26, 25, 27, 29, 28, 30, 31, 29, 30, 32, 31][i],
          })),
        },
      ],
    },
  },
};

/** Job: Acknowledge Input — selecting a point rings it and reveals its detail. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const point = canvas.getByRole('button', { name: 'DIRT raw, Jun 16: 0.9d' });
    await expect(point).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(point);
    await expect(point).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/Lowest lag of the quarter/)).toBeInTheDocument();
  },
};
