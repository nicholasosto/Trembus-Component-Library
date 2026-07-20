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

/**
 * The transient-confirmation system — a provider + hook pair rather than a rendered
 * component. Mount `ToastProvider` once at the app root; anywhere below it, call
 * `useToast()` and fire `toast({ title, description?, tone?, duration? })`. Toasts
 * stack in a portaled corner viewport and auto-dismiss. Lead job: **acknowledge
 * input** — the action you just took gets answered.
 *
 * ### When to use it
 * - Confirming completed actions: saved, sent, copied, failed.
 * - Not for messages that must persist or block — use `Callout` (inline) or
 *   `Dialog` (modal).
 *
 * ### Data & key props
 * - Provider: `duration` (default auto-dismiss, 5000 ms) · `placement` (`bottom`
 *   default | `top`).
 * - `toast(opts)` returns an id; `dismiss(id)` removes it programmatically.
 * - Per-toast options: `title` (required) · `description` · `tone` (`neutral`
 *   default | status tones) · `duration` (`0` = sticky until dismissed).
 * - Auto-dismiss pauses while the pointer hovers a toast.
 *
 * ### Accessibility
 * - The viewport is a portaled `role="region"` labelled "Notifications".
 * - Each toast announces itself: `role="status"` / `aria-live="polite"` normally,
 *   escalating to `role="alert"` / `assertive` for `danger` and `warning` tones.
 * - Every toast carries a labelled Dismiss button.
 *
 * ### Theming & setup
 * - Tones map to the status tokens; the viewport stacks on `--tcl-z-toast`. Works in
 *   light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
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
