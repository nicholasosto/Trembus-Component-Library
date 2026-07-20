import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Input } from './Input';

/**
 * The single-line text field, built on the shared field shell (`FieldShell` +
 * `useFieldIds`) so label, description, and error are wired to ARIA one way,
 * everywhere. Lead job: **acknowledge input** — every keystroke echoes, focus is
 * ringed, and validation is announced, not just painted.
 *
 * ### When to use it
 * - Any single-line value: names, emails, search, numbers.
 * - Multi-line text — use `Textarea` (same shell); one-of-N choice — use `Select`.
 *
 * ### Data & key props
 * - `label` — the accessible name; clicking it focuses the control.
 * - `description` — helper text, joined into `aria-describedby`.
 * - `error` — pass the **message string**, not a boolean: it renders, sets
 *   `aria-invalid`, and is announced via `role="alert"`.
 * - `size` — `sm | md | lg` (default `md`); `startSlot` / `endSlot` — leading /
 *   trailing adornments (icons, units).
 * - All native `<input>` props pass through (`type`, `value`/`onChange`,
 *   `placeholder`, `required`, `disabled`, `ref`…); `containerClassName` styles the shell.
 *
 * ### Accessibility
 * - The label is a real `<label htmlFor>`; description and error ids are joined
 *   into the input's `aria-describedby`.
 * - `error` sets `aria-invalid` on the input and renders the message with
 *   `role="alert"` so screen readers hear it when it appears; the required marker
 *   is `aria-hidden` while `required` itself is set on the input.
 *
 * ### Theming & setup
 * - Focus/invalid states ride `--tcl-accent` / `--tcl-status-danger` and the
 *   border tokens; correct in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Input',
  component: Input,
  args: { label: 'Email', placeholder: 'you@example.com' },
  argTypes: { size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] } },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a labeled, focusable, editable field. */
export const Default: Story = {};

/** Job: Reveal State — default / described / disabled / invalid. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
      <Input label="Default" placeholder="Type here" />
      <Input
        label="With description"
        description="We never share it."
        placeholder="you@example.com"
      />
      <Input label="Disabled" placeholder="Can't edit" disabled />
      <Input label="Invalid" defaultValue="not-an-email" error="Enter a valid email address." />
    </div>
  ),
};

/** Job: Acknowledge Input — typing is echoed; focus shows a ring. */
export const Interaction: Story = {
  args: { label: 'Name', placeholder: 'Ada Lovelace' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Name');
    await userEvent.type(input, 'Ada Lovelace');
    await expect(input).toHaveValue('Ada Lovelace');
  },
};
