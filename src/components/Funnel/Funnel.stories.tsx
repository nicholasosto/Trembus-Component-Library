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
