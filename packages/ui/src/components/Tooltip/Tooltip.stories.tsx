import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, within } from 'storybook/test';
import { Button } from '../Button/Button';
import { Tooltip } from './Tooltip';

/**
 * Supplemental text attached to one interactive trigger — shown on hover or focus,
 * bound via `aria-describedby`, portaled above everything else. Lead job:
 * **acknowledge input** — pause on or focus a control and it answers with context.
 *
 * ### When to use it
 * - Clarifying a control whose label is terse: icon buttons, abbreviations.
 * - Not for essential text (put that in the UI), not for event confirmations
 *   ("Saved!" — use `ToastProvider`), and never on a non-focusable trigger —
 *   keyboard users would never see it.
 *
 * ### Data & key props
 * - `content` — the supplemental text.
 * - `children` — exactly ONE interactive element; the handlers and
 *   `aria-describedby` merge onto YOUR element (Slot pattern, no wrapper node).
 * - `openDelay` — hover delay in ms (default `400`); keyboard focus shows it
 *   immediately.
 * - `side` — `top` (default) | `bottom`.
 *
 * ### Accessibility
 * - The bubble is `role="tooltip"`, linked to the trigger with `aria-describedby`
 *   while open; the tooltip itself is non-interactive (`pointer-events: none`).
 * - Opens on pointer-enter (after the delay) and instantly on focus; Escape, blur,
 *   and pointer-leave dismiss it; it repositions on scroll and resize.
 *
 * ### Theming & setup
 * - Inverse surface (`--tcl-text` background, `--tcl-bg` text) on the
 *   `--tcl-z-tooltip` layer; works in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  // Stories provide their own trigger; this satisfies the required `children`.
  args: { content: 'Saves without leaving the page', children: <button>trigger</button> },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — supplemental text on hover/focus. */
export const Default: Story = {
  render: (args) => (
    <div style={{ padding: 48 }}>
      <Tooltip {...args}>
        <Button variant="outline" tone="neutral">
          Hover or focus me
        </Button>
      </Tooltip>
    </div>
  ),
};

/** Job: Afford Action — wraps an existing trigger; placed above or below. */
export const Sides: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, padding: 64 }}>
      <Tooltip content="Above the trigger" side="top">
        <Button variant="outline" tone="neutral">
          Top
        </Button>
      </Tooltip>
      <Tooltip content="Below the trigger" side="bottom">
        <Button variant="outline" tone="neutral">
          Bottom
        </Button>
      </Tooltip>
    </div>
  ),
};

/** Job: Acknowledge Input — opens on focus, closes on Escape. */
export const Interaction: Story = {
  render: (args) => (
    <div style={{ padding: 48 }}>
      <Tooltip {...args} openDelay={0}>
        <Button variant="outline" tone="neutral">
          Help
        </Button>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('button', { name: 'Help' }).focus();
    await expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  },
};
