import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { IconButton } from './IconButton';

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/**
 * A compact, square affordance for a single icon — one glyph, one action. It
 * composes `Button`, so it inherits every tone, variant, and the loading state;
 * what it adds is the square geometry and a **required `aria-label`** (an icon
 * has no text to name it). Lead job: **afford action**.
 *
 * ### When to use it
 * - Dense chrome where the glyph is unambiguous: close, add, settings, overflow.
 *   Pair with `Tooltip` when the meaning needs reinforcing.
 * - Not when a text label fits — use `Button`; several icon commands under one
 *   Tab stop belong in a `Toolbar` (whose `Toolbar.Button` can also trigger a `Menu`).
 *
 * ### Data & key props
 * - `aria-label` — required; it is the control's entire accessible name
 *   (dev builds warn when it's missing).
 * - `children` — the single glyph node (e.g. `<Glyph name="close" />` or an inline SVG).
 * - Inherited from `Button`: `variant` (default `ghost` here), `size`
 *   (`sm | md | lg`, default `md`), `tone`, `disabled`, `loading`, `onPress`.
 * - `startSlot` / `endSlot` / `fullWidth` are deliberately omitted — one glyph only.
 *
 * ### Accessibility
 * - Renders a real `<button>` through Button's Pressable spine: Enter/Space
 *   activate, the interaction FSM emits `data-state`, and a focus ring is guaranteed.
 * - `loading` sets `aria-busy` (and disables activation); pass decorative glyphs
 *   with `aria-hidden` so the `aria-label` stays the whole name.
 *
 * ### Theming & setup
 * - Tones ride `--tcl-accent` / `--tcl-status-*`; correct in light · dark ·
 *   reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  args: { 'aria-label': 'Add item', children: <PlusIcon />, onPress: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'outline', 'ghost'] },
    tone: {
      control: 'select',
      options: ['accent', 'success', 'info', 'warning', 'danger', 'neutral'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a square, named affordance for one icon. */
export const Default: Story = {};

/** The three inherited looks side by side — solid / outline / ghost. */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <IconButton {...args} variant="solid" />
      <IconButton {...args} variant="outline" />
      <IconButton {...args} variant="ghost" />
    </div>
  ),
};

/** Job: Reveal State — idle / disabled / loading. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <IconButton {...args} />
      <IconButton {...args} disabled />
      <IconButton {...args} loading />
    </div>
  ),
};

/** Job: Acknowledge Input — activates on click + keyboard. */
export const Interaction: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Add item' }));
    await expect(args.onPress).toHaveBeenCalled();
  },
};
