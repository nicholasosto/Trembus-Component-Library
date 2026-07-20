import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Dialog } from './Dialog';
import type { DialogProps } from './Dialog';

function DialogDemo({
  triggerLabel = 'Open dialog',
  ...props
}: Partial<DialogProps> & { triggerLabel?: string }) {
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

/**
 * A focus-trapped modal on the overlay layer — the portal + focus-trap + ARIA spine
 * the other floating surfaces build on. Lead job: **acknowledge input** — it holds
 * the user in one short, blocking exchange (confirm, small form) and hands focus
 * back when it's done.
 *
 * ### When to use it
 * - Blocking confirmations and short focused tasks that must interrupt the page
 *   (destructive confirms, quick edits).
 * - Not for transient event confirmations — use `Toast`; not for page/section
 *   notices that can sit inline — use `Callout`.
 *
 * ### Data & key props
 * - `open` / `onClose` — required; the dialog is fully controlled (keep `open` in state).
 * - `title` / `description` — rendered and wired to `aria-labelledby` / `aria-describedby`.
 * - `children` — the body; `footer` — the action row slot (host your Buttons there).
 * - `size` — `sm | md | lg` (default `md`); `closeOnOverlayClick` / `closeOnEsc` (both default `true`).
 *
 * ### Accessibility
 * - `role="dialog"` + `aria-modal="true"`; on open focus moves inside and Tab is
 *   trapped; on close focus returns to the element that opened it; background
 *   scroll is locked while open.
 * - Escape closes; a press outside the panel closes — but presses inside a portaled
 *   popup opened from the dialog (`[role="menu"]`) are exempt, so a `Menu` inside
 *   survives its own clicks and Escape peels one layer per press
 *   (`Components/Menu → InsideDialog` is the regression story).
 *
 * ### Theming & setup
 * - Overlay + raised panel ride the `--tcl-overlay` / `--tcl-surface-raised` /
 *   `--tcl-z-modal` tokens; correct in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
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
