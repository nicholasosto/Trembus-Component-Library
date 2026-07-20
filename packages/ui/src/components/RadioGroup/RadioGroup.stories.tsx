import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { RadioGroup } from './RadioGroup';

/**
 * A one-of-N choice group (`role="radiogroup"`) built on native radio inputs — the
 * options share a `name`, so Arrow-key movement and selection come from the
 * browser, not a re-implementation. Compound: `RadioGroup` + `RadioGroup.Item`.
 * Lead job: acknowledge input.
 *
 * ### When to use it
 * - Choosing exactly one of a few (~2–5) short, always-visible options.
 * - Not for many or long options — use `Select` (native dropdown).
 * - Not for an independent on/off — use `Switch` (applies now) or `Checkbox`
 *   (part of a form).
 *
 * ### Data & key props
 * - Root: `value`/`defaultValue`/`onValueChange` (controlled or uncontrolled) ·
 *   `name` (shared native radio name; auto-generated when omitted) · `label` ·
 *   `description` · `error`.
 * - `RadioGroup.Item`: `value` (required) · `label` · `description` · `disabled`.
 *
 * ### Accessibility
 * - The group is `role="radiogroup"` labelled via `aria-labelledby`; `description`
 *   and `error` join `aria-describedby`, and `error` announces via `role="alert"`.
 * - Items are real `<input type="radio">`s (visually hidden behind a styled dot):
 *   click or Arrow keys select and move focus natively; the label is part of the
 *   click target.
 * - The focus ring renders on the dot via `:focus-visible`; a per-item
 *   `description` is wired to its input with `aria-describedby`.
 *
 * ### Theming & setup
 * - The selected dot fills with `var(--tcl-accent)`; disabled items dim. Works in
 *   light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a labeled set of choices. */
export const Default: Story = {
  render: () => (
    <RadioGroup name="plan-default" defaultValue="free" label="Plan">
      <RadioGroup.Item value="free" label="Free" description="For personal projects." />
      <RadioGroup.Item value="pro" label="Pro" description="For growing teams." />
      <RadioGroup.Item value="team" label="Team" description="For organizations." />
    </RadioGroup>
  ),
};

/** Job: Reveal State — selected, plus a disabled option and a group error. */
export const States: Story = {
  render: () => (
    <RadioGroup
      name="plan-states"
      defaultValue="pro"
      label="Plan"
      error="Upgrade required for this feature."
    >
      <RadioGroup.Item value="free" label="Free" />
      <RadioGroup.Item value="pro" label="Pro" />
      <RadioGroup.Item value="team" label="Team" disabled />
    </RadioGroup>
  ),
};

/** Job: Acknowledge Input — selecting changes the active option. */
export const Interaction: Story = {
  render: () => (
    <RadioGroup name="plan-interaction" defaultValue="free" label="Plan">
      <RadioGroup.Item value="free" label="Free" />
      <RadioGroup.Item value="pro" label="Pro" />
    </RadioGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('radio', { name: 'Free' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'Pro' }));
    await expect(canvas.getByRole('radio', { name: 'Pro' })).toBeChecked();
  },
};
