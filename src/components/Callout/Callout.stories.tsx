import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Callout } from './Callout';

const meta = {
  title: 'Components/Callout',
  component: Callout,
  parameters: { layout: 'padded' },
  args: {
    tone: 'info',
    title: 'Source not yet exposed',
    children: (
      <>
        The work-start confirmation feed (<code>wsc.pending</code>) isn’t wired up yet — values fall
        back to the last snapshot. See the <a href="#integration">integration runbook</a> for the
        rollout date.
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a dismissable info banner whose body carries inline code + a link. */
export const Default: Story = {
  args: { onDismiss: fn() },
};

/** Job: Reveal State — the same component across the tone ontology. */
export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
      <Callout tone="info" title="Heads up">
        A new dashboard build is rolling out this week.
      </Callout>
      <Callout tone="success" title="All clear">
        Every timesheet for the period has been approved.
      </Callout>
      <Callout tone="warning" title="Action needed">
        Three engagements are missing a work-start confirmation.
      </Callout>
      <Callout tone="danger" title="Sync failed">
        The NetSuite revenue pull errored — figures may be stale.
      </Callout>
      <Callout tone="neutral" title="Note">
        Figures refresh nightly at 02:00 UTC.
      </Callout>
      <Callout tone="accent" title="Tip">
        Click any chart datum to inspect it in the live panel.
      </Callout>
    </div>
  ),
};

/** Job: Acknowledge Input — dismissing the banner removes it from the page. */
export const Interaction: Story = {
  render: (args) => {
    const [open, setOpen] = useState(true);
    if (!open) return <p>Callout dismissed.</p>;
    return (
      <div style={{ maxWidth: 560 }}>
        <Callout {...args} tone="warning" title="Action needed" onDismiss={() => setOpen(false)}>
          Three engagements are missing a work-start confirmation.
        </Callout>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Dismiss' }));
    await expect(canvas.getByText('Callout dismissed.')).toBeInTheDocument();
  },
};
