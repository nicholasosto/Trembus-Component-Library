import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Select } from './Select';

const Options = () => (
  <>
    <option value="us">United States</option>
    <option value="ca">Canada</option>
    <option value="mx">Mexico</option>
  </>
);

/**
 * A native `<select>` dressed in the shared field shell — label, description, and
 * error wired to ARIA for you (the same shell as Input/Textarea). Being native, it
 * is reliable on mobile and needs zero positioning code. Lead job: acknowledge
 * input.
 *
 * ### When to use it
 * - Picking one option from a medium-to-long list inside a form.
 * - Not for rich option content, search, or command lists — compose `Menu`.
 * - Not for ~2–5 short, always-visible options — use `RadioGroup`.
 *
 * ### Data & key props
 * - `children` — your `<option>` / `<optgroup>` elements (required).
 * - `label` · `description` · `error` — the shared field wiring; `placeholder`
 *   renders a disabled first option when no value is set.
 * - `size` (`sm|md|lg`, default `md`); all native select props (`value`,
 *   `defaultValue`, `onChange`, `disabled`, `required`, …) pass through.
 *
 * ### Accessibility
 * - `label` is a real `<label htmlFor>`; `description`/`error` join
 *   `aria-describedby`, and `error` also sets `aria-invalid` and announces via
 *   `role="alert"`.
 * - Keyboard and screen-reader behavior is the browser's own select — nothing is
 *   re-implemented; the chevron is decorative (`aria-hidden`).
 * - Focus shows as a `:focus-within` ring on the field (accent border +
 *   `--tcl-focus-ring` shadow).
 *
 * ### Theming & setup
 * - Field chrome uses the border/accent tokens; the invalid state borders with
 *   `--tcl-status-danger`. Works in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Select',
  component: Select,
  // Stories render their own Select; this satisfies the required `children` prop.
  args: { children: <Options /> },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a labeled native select. */
export const Default: Story = {
  render: () => (
    <Select label="Country" placeholder="Choose a country…">
      <Options />
    </Select>
  ),
};

/** Job: Reveal State — selected / disabled / invalid. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, maxWidth: 320 }}>
      <Select label="Selected" defaultValue="ca">
        <Options />
      </Select>
      <Select label="Disabled" placeholder="Choose…" disabled>
        <Options />
      </Select>
      <Select label="Invalid" placeholder="Choose…" error="Please pick a country.">
        <Options />
      </Select>
    </div>
  ),
};

/** Job: Acknowledge Input — choosing an option updates the value. */
export const Interaction: Story = {
  render: () => (
    <Select label="Country" placeholder="Choose…">
      <Options />
    </Select>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByLabelText('Country');
    await userEvent.selectOptions(select, 'ca');
    await expect(select).toHaveValue('ca');
  },
};
