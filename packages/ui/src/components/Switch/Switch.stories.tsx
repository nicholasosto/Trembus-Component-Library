import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Switch } from './Switch';

/**
 * An immediate on/off toggle — a native checkbox exposed as `role="switch"` whose
 * state applies the moment it flips, no submit step. Lead job: **acknowledge input**
 * — the thumb slides and the track fills the instant you act.
 *
 * ### When to use it
 * - Settings that take effect now: notifications, Wi-Fi, feature flags, theme.
 * - Not for a value collected and submitted later with a form — use `Checkbox`.
 *
 * ### Data & key props
 * - `label` — the visible name; the whole label is the click target.
 * - `description` — helper text wired to the input via `aria-describedby`.
 * - Everything else is the native input surface: `checked` / `defaultChecked` /
 *   `onChange`, `disabled`, `name`, …
 *
 * ### Accessibility
 * - A real `<input type="checkbox" role="switch">` — assistive tech reads on/off from
 *   the checked state; the track and thumb are decorative (`aria-hidden`).
 * - Space toggles; keyboard focus draws a `:focus-visible` ring on the track.
 *
 * ### Theming & setup
 * - The on-state track fills with `--tcl-accent`; works in light · dark · reliquary
 *   via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: { label: 'Enable notifications' },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a labeled toggle. */
export const Default: Story = {};

/** Job: Reveal State — off / on / disabled. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Switch label="Off" />
      <Switch label="On" defaultChecked />
      <Switch label="With description" description="Get notified about activity." />
      <Switch label="Disabled" disabled />
    </div>
  ),
};

/** Job: Acknowledge Input — toggles on interaction. */
export const Interaction: Story = {
  args: { label: 'Wi-Fi' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sw = canvas.getByRole('switch', { name: 'Wi-Fi' });
    await expect(sw).not.toBeChecked();
    await userEvent.click(sw);
    await expect(sw).toBeChecked();
  },
};
