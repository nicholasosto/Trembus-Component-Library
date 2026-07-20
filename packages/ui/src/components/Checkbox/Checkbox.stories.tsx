import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Checkbox } from './Checkbox';

/**
 * A labeled binary (or tri-state) checkbox: a real native `<input type="checkbox">`
 * behind a token-styled box, with the whole label as the click target. Lead job is
 * **acknowledge input** — toggle, see the box change.
 *
 * ### When to use it
 * - A yes/no choice that is part of a form submitted later ("Accept terms",
 *   "Email me updates"), or one row of a multi-select list.
 * - Not for a setting that applies immediately — that's `Switch` (`role=switch`).
 * - Not for one-of-N — that's `RadioGroup`.
 *
 * ### Data & key props
 * - `label` — rendered beside the box and part of the click target.
 * - `description` — helper text below, wired to the input via `aria-describedby`.
 * - `indeterminate` (default `false`) — the tri-state dash; sets the DOM
 *   `indeterminate` property (it is display state, not a value — `checked` still
 *   drives the submitted value).
 * - All native input props pass through: `checked` / `defaultChecked` / `onChange`
 *   / `name` / `disabled` — controlled or uncontrolled, your call.
 *
 * ### Accessibility
 * - The native input keeps `role="checkbox"` semantics; it is visually hidden and
 *   the custom box is `aria-hidden` — assistive tech sees only the real control.
 * - The `<label>` wraps input + text, so clicking the words toggles it.
 * - Space toggles; keyboard focus draws the ring on the custom box via
 *   `:focus-visible`.
 *
 * ### Theming & setup
 * - Checked fill uses `var(--tcl-accent)`; box border `var(--tcl-border-strong)`.
 *   Works in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: { label: 'Email me product updates' },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a labeled checkbox. */
export const Default: Story = {};

/** Job: Reveal State — unchecked / checked / indeterminate / disabled. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Indeterminate" indeterminate />
      <Checkbox label="With description" description="We send at most one email per week." />
      <Checkbox label="Disabled" disabled />
    </div>
  ),
};

/** Job: Acknowledge Input — toggles on interaction. */
export const Interaction: Story = {
  args: { label: 'Accept terms' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole('checkbox', { name: 'Accept terms' });
    await expect(box).not.toBeChecked();
    await userEvent.click(box);
    await expect(box).toBeChecked();
  },
};
