import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Table } from '../Table/Table';
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
 * - Also the host for a data-dense or visualization component you want to inspect
 *   WITHOUT leaving the page — reach for `size="xl"` or `expandable`, not `lg`
 *   (`Brief` alone wants 760px, so `lg`'s 640 squeezes it).
 * - Not for transient event confirmations — use `Toast`; not for page/section
 *   notices that can sit inline — use `Callout`. A component that IS the page
 *   (a full `Hub` map, a document you edit for minutes) wants its own route, not
 *   a modal — a modal is for a look, not a workspace.
 *
 * ### Data & key props
 * - `open` / `onClose` — required; the dialog is fully controlled (keep `open` in state).
 * - `title` / `description` — rendered and wired to `aria-labelledby` / `aria-describedby`.
 * - `children` — the body; `footer` — the action row slot (host your Buttons there).
 * - `size` — `sm | md | lg | xl | full` (default `md`): 360/480/640/960, then
 *   viewport-filling. `closeOnOverlayClick` / `closeOnEsc` (both default `true`).
 * - `expandable` adds a header control toggling `size` ↔ `full`; controllable via
 *   `expanded` / `defaultExpanded` / `onExpandedChange`, named by `expandLabel` /
 *   `collapseLabel`.
 * - The panel is a flex column: header and footer are pinned, the BODY scrolls. A
 *   long table keeps its sticky header and its action row.
 * - `full` (or expanded) is the only preset that gives the panel a RESOLVED height —
 *   which is what `VirtualAssetGrid`, `Hub`, `Swimlane` and `Timeline` need, since
 *   they measure their container to lay out.
 *
 * ### Accessibility
 * - `role="dialog"` + `aria-modal="true"`; on open focus moves inside and Tab is
 *   trapped; on close focus returns to the element that opened it; background
 *   scroll is locked while open.
 * - The expand control is a real `<button>` inside the focus trap whose accessible
 *   NAME swaps (Expand ↔ Collapse), so its state is never ambiguous — no
 *   `aria-pressed` double-encoding.
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
      <DialogDemo triggerLabel="Extra large" size="xl" />
      <DialogDemo triggerLabel="Full" size="full" />
    </div>
  ),
};

/**
 * Job: Afford Action — the case `lg` could not hold: a dense table inspected without
 * leaving the page. The header and the action row stay pinned while the rows scroll,
 * and the ⤢ control expands the panel to `full` — the only preset that hands a
 * measuring child a resolved height. Note nothing animates on expand: a width/height
 * transition would fire a ResizeObserver storm in exactly these children.
 */
export const Expandable: Story = {
  render: function ExpandableDemo() {
    const [open, setOpen] = useState(false);
    const rows = Array.from({ length: 40 }, (_, i) => ({
      id: `RUN-${1040 - i}`,
      status: (['Passed', 'Failed', 'Queued'] as const)[i % 3],
      dur: `${((i % 7) + 1) * 12}s`,
      owner: ['agent-01', 'nicholas', 'ci-bot'][i % 3],
    }));
    return (
      <>
        <Button onPress={() => setOpen(true)}>Inspect runs</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Recent runs"
          description="The body scrolls; the title and the actions below do not."
          size="xl"
          expandable
          footer={
            <>
              <Button variant="ghost" tone="neutral" onPress={() => setOpen(false)}>
                Close
              </Button>
              <Button onPress={() => setOpen(false)}>Export</Button>
            </>
          }
        >
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>Run</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Duration</Table.HeaderCell>
                <Table.HeaderCell>Owner</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {rows.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>{r.id}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      tone={
                        r.status === 'Passed'
                          ? 'success'
                          : r.status === 'Failed'
                            ? 'danger'
                            : 'neutral'
                      }
                    >
                      {r.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{r.dur}</Table.Cell>
                  <Table.Cell>{r.owner}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Dialog>
      </>
    );
  },
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
