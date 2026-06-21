import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { ToastProvider, useToast } from './ToastProvider';

function TriggerButton() {
  const { toast } = useToast();
  return (
    <Button
      onPress={() =>
        toast({ title: 'Changes saved', description: 'Your edits are live.', tone: 'success' })
      }
    >
      Show toast
    </Button>
  );
}

function ShowAllOnMount() {
  const { toast } = useToast();
  useEffect(() => {
    toast({ title: 'Saved', description: 'Document saved.', tone: 'success', duration: 0 });
    toast({ title: 'Heads up', description: 'New version available.', tone: 'info', duration: 0 });
    toast({ title: 'Storage low', tone: 'warning', duration: 0 });
    toast({ title: 'Upload failed', description: 'Please retry.', tone: 'danger', duration: 0 });
  }, [toast]);
  return <p style={{ color: 'var(--tcl-text-dim)' }}>Toasts appear in the corner →</p>;
}

const meta = {
  title: 'Components/Toast',
  component: ToastProvider,
  // Stories provide their own children; this satisfies the required prop.
  args: { children: null },
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — trigger a toast via useToast(). */
export const Default: Story = {
  render: () => (
    <ToastProvider>
      <TriggerButton />
    </ToastProvider>
  ),
};

/** Job: Reveal State — every tone of the color-coded ontology (sticky). */
export const States: Story = {
  render: () => (
    <ToastProvider duration={0}>
      <ShowAllOnMount />
    </ToastProvider>
  ),
};

/** Job: Acknowledge Input — an action produces an announced toast. */
export const Interaction: Story = {
  render: () => (
    <ToastProvider>
      <TriggerButton />
    </ToastProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Show toast' }));
    await expect(await screen.findByText('Changes saved')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    await expect(screen.queryByText('Changes saved')).not.toBeInTheDocument();
  },
};
