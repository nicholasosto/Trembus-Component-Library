import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Textarea } from './Textarea';

/**
 * The multi-line sibling of `Input` — a native `<textarea>` in the shared field shell
 * (label · description · error), vertically resizable. Lead job: **acknowledge
 * input** — typing echoes and validation answers immediately.
 *
 * ### When to use it
 * - Free-form prose: messages, bios, notes, descriptions.
 * - Not for single-line values (use `Input`) or constrained choices (`Select`).
 *
 * ### Data & key props
 * - `label` / `description` / `error` — the field shell; `error` paints the invalid
 *   state and replaces the description in the `aria-describedby` chain.
 * - `rows` — initial height (default `4`); users can drag-resize vertically.
 * - Everything else is the native textarea surface: `value` / `defaultValue` /
 *   `onChange`, `placeholder`, `disabled`, `required`, …
 *
 * ### Accessibility
 * - A real `<textarea>` tied to its `<label>` — clicking the label focuses it.
 * - `error` sets `aria-invalid` and renders a `role="alert"` message, so the failure
 *   is announced when it appears; `description` wires via `aria-describedby`.
 * - The `required` asterisk is decorative (`aria-hidden`); the requirement rides the
 *   native `required` attribute.
 *
 * ### Theming & setup
 * - Border, focus accent, and the danger error tone come from tokens; works in
 *   light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  args: { label: 'Message', placeholder: 'Write something…' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a labeled, resizable multiline field. */
export const Default: Story = {};

/** Job: Reveal State — default / described / disabled / invalid. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
      <Textarea label="Default" placeholder="Type here" />
      <Textarea label="With description" description="Markdown is supported." />
      <Textarea label="Disabled" placeholder="Can't edit" disabled />
      <Textarea
        label="Invalid"
        defaultValue="Too short"
        error="Please write at least 20 characters."
      />
    </div>
  ),
};

/** Job: Acknowledge Input — typing is echoed. */
export const Interaction: Story = {
  args: { label: 'Bio' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText('Bio');
    await userEvent.type(field, 'Hello there');
    await expect(field).toHaveValue('Hello there');
  },
};
