import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { EmptyState } from './EmptyState';
import { Button } from '../Button/Button';
import { Badge } from '../Badge/Badge';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
  args: {
    title: 'No engagements in range',
    description: 'Nothing matched the current filters. Widen the date range or clear a filter.',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — the canonical "nothing here" placeholder. */
export const Default: Story = {};

/** Job: Afford Action — pending-source variant with a status badge and a call-to-action. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <EmptyState
        title="No engagements in range"
        description="Nothing matched the current filters."
      />
      <EmptyState
        badge={<Badge tone="warning">Awaiting WSC</Badge>}
        title="Pending work-start confirmation"
        description="This metric will populate once the source feed is connected."
        pendingSource="wsc.pending"
      />
      <EmptyState
        title="Connect a data source"
        description="Wire up a feed to start tracking this KPI."
        action={<Button>Connect source</Button>}
      />
    </div>
  ),
};

/** Job: Acknowledge Input — activating the action resolves the empty state. */
export const Interaction: Story = {
  render: () => {
    const [connected, setConnected] = useState(false);
    if (connected) return <p>Source connected — data loading.</p>;
    return (
      <div style={{ maxWidth: 480 }}>
        <EmptyState
          title="Connect a data source"
          description="Wire up a feed to start tracking this KPI."
          pendingSource="wsc.pending"
          action={<Button onPress={() => setConnected(true)}>Connect source</Button>}
        />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Connect source' }));
    await expect(canvas.getByText(/Source connected/)).toBeInTheDocument();
  },
};
