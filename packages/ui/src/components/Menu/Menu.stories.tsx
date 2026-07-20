import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Dialog } from '../Dialog/Dialog';
import { Menu } from './Menu';

/**
 * A portal dropdown command menu (the ARIA menu-button pattern) with nested
 * submenus — the accessible replacement for hover-only quick actions. Lead job:
 * **afford action** — one trigger opens a named set of commands.
 *
 * ### When to use it
 * - Overflow / command sets behind one trigger; alternates behind a
 *   `Menu.Sub`. A `Toolbar.Button` can be the trigger for a command bar.
 * - Not for site navigation — use `NavBar` (real links); not for a one-of-N form
 *   value — use `Select` / `RadioGroup`.
 *
 * ### Data & key props
 * - Compound parts: `Menu.Trigger` (wraps ONE interactive child) · `Menu.Content`
 *   (`align` start|end, `side` bottom|top — `top` suits a bottom-docked bar) ·
 *   `Menu.Item` (`onSelect`, `disabled`) · `Menu.Label` · `Menu.Separator` ·
 *   `Menu.Sub` / `Menu.SubTrigger` / `Menu.SubContent`.
 * - Root `open` / `defaultOpen` / `onOpenChange` (uncontrolled by default, closed).
 * - Content portals to `<body>`, positions off the trigger rect, and tracks
 *   scroll/resize; a submenu opens to the right and flips left when it would
 *   overflow the viewport.
 *
 * ### Accessibility
 * - The trigger gets `aria-haspopup="menu"` / `aria-expanded` / `aria-controls`;
 *   ArrowDown also opens. Content is `role="menu"`, named by a `Menu.Label` when
 *   present (else the trigger); items are `role="menuitem"`.
 * - Arrow/Home/End rove focus; Enter/Space selects and collapses the whole tree;
 *   → opens a submenu, ←/Escape backs out one level; Tab or an outside press
 *   dismisses; closing returns focus to the trigger.
 * - Safe inside a modal `Dialog`: content stacks on the popover layer
 *   (`--tcl-z-popover`, above the modal overlay), the Dialog ignores presses
 *   inside `[role="menu"]`, and the menu's Escape stops propagating so layers
 *   peel one per press — `InsideDialog` is the regression story.
 *
 * ### Theming & setup
 * - Raised-surface + elevation tokens; the popover z-token needs
 *   `@trembus/tokens` ≥ 0.2.0 (the CSS carries a fallback above the modal layer).
 *   Correct in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Menu',
  component: Menu,
} satisfies Meta<typeof Menu>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Job: Afford Action — a titled command set. The "Send to Roblox" row opens a
 * submenu of alternates (→ or click), the accessible replacement for hover-only
 * quick actions.
 */
export const Default: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger>
        <Button variant="outline" tone="neutral">
          DCC Bridge
        </Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Label>DCC Bridge</Menu.Label>
        <Menu.Item onSelect={() => {}}>Send to ZBrush</Menu.Item>
        <Menu.Sub>
          <Menu.SubTrigger>Send to Roblox</Menu.SubTrigger>
          <Menu.SubContent>
            <Menu.Item onSelect={() => {}}>Send</Menu.Item>
            <Menu.Item onSelect={() => {}}>Send + download</Menu.Item>
            <Menu.Item onSelect={() => {}}>Send with log</Menu.Item>
          </Menu.SubContent>
        </Menu.Sub>
        <Menu.Item onSelect={() => {}}>Send to Blender</Menu.Item>
        <Menu.Separator />
        <Menu.Item onSelect={() => {}} disabled>
          Send to OV/Isaac
        </Menu.Item>
      </Menu.Content>
    </Menu>
  ),
};

/**
 * Job: Reveal State — a disabled item, end-alignment, and (right) a menu that
 * opens upward (`side="top"`) for a bottom-docked bar.
 */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start', paddingTop: 160 }}>
      <Menu>
        <Menu.Trigger>
          <Button variant="outline" tone="neutral">
            End-aligned
          </Button>
        </Menu.Trigger>
        <Menu.Content align="end">
          <Menu.Item onSelect={() => {}}>Rename</Menu.Item>
          <Menu.Item onSelect={() => {}}>Share</Menu.Item>
          <Menu.Item onSelect={() => {}} disabled>
            Archive (disabled)
          </Menu.Item>
        </Menu.Content>
      </Menu>
      <Menu>
        <Menu.Trigger>
          <Button variant="outline" tone="neutral">
            Opens upward
          </Button>
        </Menu.Trigger>
        <Menu.Content side="top">
          <Menu.Label>Bottom-bar menu</Menu.Label>
          <Menu.Item onSelect={() => {}}>Cut</Menu.Item>
          <Menu.Item onSelect={() => {}}>Copy</Menu.Item>
          <Menu.Item onSelect={() => {}}>Paste</Menu.Item>
        </Menu.Content>
      </Menu>
    </div>
  ),
};

function MenuInDialogDemo() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  return (
    <>
      <Button onPress={() => setOpen(true)}>Manage asset</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Asset actions"
        description="The overflow menu portals to <body> — it must stack above this overlay."
        footer={
          <Button variant="ghost" tone="neutral" onPress={() => setOpen(false)}>
            Close
          </Button>
        }
      >
        <Menu>
          <Menu.Trigger>
            <Button variant="outline" tone="neutral">
              More actions
            </Button>
          </Menu.Trigger>
          <Menu.Content>
            <Menu.Item onSelect={() => setLast('Rename')}>Rename</Menu.Item>
            <Menu.Item onSelect={() => setLast('Duplicate')}>Duplicate</Menu.Item>
            <Menu.Item onSelect={() => setLast('Archive')}>Archive</Menu.Item>
          </Menu.Content>
        </Menu>
        <p role="status" style={{ minHeight: '1.25rem', color: 'var(--tcl-text-dim)' }}>
          {last ? `Last action: ${last}` : ''}
        </p>
      </Dialog>
    </>
  );
}

/**
 * Job: Afford Action — a menu opened from a trigger INSIDE a modal `Dialog`.
 * The portaled content stacks on the popover layer (above the modal overlay),
 * selecting an item runs the action without dismissing the dialog, and Escape
 * peels one layer at a time (menu first, dialog on the second press).
 */
export const InsideDialog: Story = {
  render: () => <MenuInDialogDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Manage asset' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'More actions' }));
    const menu = await screen.findByRole('menu');

    // The stacking regression this story guards: the menu must clear the overlay.
    const overlay = document.querySelector('.tcl-dialog__overlay');
    const z = (el: Element): number => Number.parseInt(getComputedStyle(el).zIndex, 10);
    await expect(overlay).not.toBeNull();
    await expect(z(menu)).toBeGreaterThan(z(overlay as Element));

    // Selecting an item fires it and closes the menu — the dialog survives the press.
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Duplicate' }));
    await expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await expect(screen.getByRole('dialog')).toBeInTheDocument();
    await expect(within(dialog).getByRole('status')).toHaveTextContent('Last action: Duplicate');

    // Escape peels one layer at a time.
    await userEvent.click(within(dialog).getByRole('button', { name: 'More actions' }));
    await screen.findByRole('menu');
    await userEvent.keyboard('{Escape}');
    await expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await expect(screen.getByRole('dialog')).toBeInTheDocument();
  },
};

/** Job: Acknowledge Input — open, arrow to an item, select; the menu closes. */
export const Interaction: Story = {
  render: () => (
    <Menu>
      <Menu.Trigger>
        <Button variant="outline" tone="neutral">
          Options
        </Button>
      </Menu.Trigger>
      <Menu.Content>
        <Menu.Item onSelect={() => {}}>Edit</Menu.Item>
        <Menu.Item onSelect={() => {}}>Duplicate</Menu.Item>
      </Menu.Content>
    </Menu>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Options' }));
    await expect(await screen.findByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    await expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  },
};
