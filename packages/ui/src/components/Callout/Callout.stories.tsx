import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Callout } from './Callout';

/**
 * A block-level, tone-tinted banner — left accent rail + tone icon + title +
 * body — for contextual page/section notices. Lead job is **reveal state**: it
 * pairs the color-coded ontology (like `Badge`) with a padded surface (like
 * `Card`), and gains a close button when `onDismiss` is set.
 *
 * ### When to use it
 * - Page- or section-level notices that should persist until read or dismissed:
 *   degraded data sources, rollout notes, action-needed warnings.
 * - Not for transient confirmations — that's Toast (`useToast`); not for an inline
 *   status chip — that's `Badge`; not for blocking decisions — that's `Dialog`.
 *
 * ### Data & key props
 * - `children` — the body; it can carry inline `<code>` and links.
 * - `tone` (default `info`) — `info | success | warning | danger | neutral | accent`.
 * - `title` — bold lead line above the body.
 * - `icon` — leading glyph; defaults to a per-tone icon, pass `null` to hide.
 * - `onDismiss` — setting it renders the close button; `dismissLabel` (default
 *   `"Dismiss"`) names it.
 *
 * ### Accessibility
 * - A static banner — no live region; content is read in place. If the message
 *   arrives dynamically, announce it separately.
 * - The tone icon is `aria-hidden`; the meaning lives in the title/body words,
 *   never in color alone.
 * - The dismiss control is a real `<button>` named by `dismissLabel`, with a
 *   `:focus-visible` ring; its ✕ glyph is `aria-hidden`.
 *
 * ### Theming & setup
 * - Tint, rail, and icon color resolve through `var(--tcl-status-*)` /
 *   `var(--tcl-accent)`; works in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
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
