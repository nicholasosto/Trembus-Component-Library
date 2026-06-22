import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Treemap } from './Treemap';
import type { TreemapContract } from './Treemap';

// A real treemap contract instance — the authored Visual Grammar shape.
const portfolio: TreemapContract = {
  view: 'treemap',
  brand: 'Trembus',
  code: 'pmo.portfolio.hours',
  title: 'Delivered hours by engagement',
  caption:
    'Each engagement sized by hours delivered this quarter. Click a cell to inspect its share.',
  unit: 'h',
  nodes: [
    {
      id: 'atlas',
      label: 'Atlas Migration',
      value: 1840,
      tone: 'accent',
      sub: 'Cat 1',
      note: 'Largest active engagement; on track.',
    },
    {
      id: 'borealis',
      label: 'Borealis Rollout',
      value: 1260,
      tone: 'info',
      sub: 'Cat 2',
      note: 'Phase 2 staffing ramping up.',
    },
    {
      id: 'cedar',
      label: 'Cedar Audit',
      value: 880,
      tone: 'success',
      sub: 'Cat 1',
      note: 'Closing out ahead of plan.',
    },
    {
      id: 'delta',
      label: 'Delta Integration',
      value: 640,
      tone: 'warning',
      sub: 'Cat 3',
      note: 'Awaiting client environment.',
    },
    {
      id: 'echo',
      label: 'Echo Support',
      value: 420,
      tone: 'neutral',
      sub: 'Run',
      note: 'Steady-state managed service.',
    },
    {
      id: 'foxtrot',
      label: 'Foxtrot POC',
      value: 240,
      tone: 'danger',
      sub: 'Cat 4',
      note: 'Time-boxed proof of concept.',
    },
    {
      id: 'golf',
      label: 'Golf Advisory',
      value: 150,
      tone: 'info',
      sub: 'Cat 4',
      note: 'Fractional advisory hours.',
    },
    {
      id: 'hotel',
      label: 'Hotel Discovery',
      value: 90,
      tone: 'accent',
      sub: 'Cat 4',
      note: 'Pre-sales discovery.',
    },
  ],
};

const meta = {
  title: 'Visualizations/Treemap',
  component: Treemap,
  args: { data: portfolio },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 560, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Treemap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — area encodes share; cells color-coded and labelled when large enough. */
export const Default: Story = {};

/** Job: Afford Action — a smaller set with one dominant node; each cell is a selectable button. */
export const States: Story = {
  args: {
    data: {
      view: 'treemap',
      code: 'pmo.revenue.byline',
      title: 'Revenue by service line',
      caption:
        'A few service lines, one dominant — squarified tiles keep aspect ratios near square.',
      unit: 'k',
      nodes: [
        { id: 'impl', label: 'Implementation', value: 920, tone: 'accent', note: 'Core delivery.' },
        {
          id: 'advisory',
          label: 'Advisory',
          value: 340,
          tone: 'info',
          note: 'Strategy + roadmap.',
        },
        {
          id: 'managed',
          label: 'Managed Services',
          value: 210,
          tone: 'success',
          note: 'Recurring run.',
        },
        { id: 'training', label: 'Training', value: 70, tone: 'warning', note: 'Enablement.' },
      ],
    },
  },
};

/** Job: Acknowledge Input — selecting a cell rings it and reveals its share. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByRole('button', { name: /Cedar Audit: 880h/ });
    await expect(cell).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(cell);
    await expect(cell).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/ahead of plan/)).toBeInTheDocument();
  },
};
