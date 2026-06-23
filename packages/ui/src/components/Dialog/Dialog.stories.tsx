import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Dialog } from './Dialog';
import type { DialogProps } from './Dialog';

function DialogDemo({ triggerLabel = 'Open dialog', ...props }: Partial<DialogProps> & { triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onPress={() => setOpen(true)}>{triggerLabel}</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete project?"
        description="This permanently removes the project and all of its data. This cannot be undone."
        footer={
          <>
            <Button variant="ghost" tone="neutral" onPress={() => setOpen(false)}>
              Cancel
            </Button>
            <Button tone="danger" onPress={() => setOpen(false)}>
              Delete
            </Button>
          </>
        }
        {...props}
      >
        Everything in this workspace will be erased.
      </Dialog>
    </>
  );
}

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  // Stories drive open state via the DialogDemo wrapper; these satisfy the
  // component's required props at the meta level.
  args: { open: false, onClose: () => {} },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a trigger opens a focus-trapped modal with footer actions. */
export const Default: Story = {
  render: () => <DialogDemo />,
};

/** Job: Reveal State — open/closed and the three sizes. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <DialogDemo triggerLabel="Small" size="sm" />
      <DialogDemo triggerLabel="Medium" size="md" />
      <DialogDemo triggerLabel="Large" size="lg" />
    </div>
  ),
};

/** Job: Acknowledge Input — opens, traps focus, closes on Escape. */
export const Interaction: Story = {
  render: () => <DialogDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await screen.findByRole('dialog');
    await expect(dialog).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
};
