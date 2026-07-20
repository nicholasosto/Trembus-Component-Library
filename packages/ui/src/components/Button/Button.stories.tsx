import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './Button';

/**
 * The primary action control — a real `<button>` composed on the `Pressable`
 * affordance FSM, with intent tones and a loading state. Lead job is **afford
 * action**: a visible, clickable, keyboard-operable affordance.
 *
 * ### When to use it
 * - Any standard action: submit, save, confirm, open, run.
 * - One accent-toned primary per view reads best; keep the rest neutral/outlined.
 * - Not for a single-glyph action — that's `IconButton`; not for custom affordances
 *   (tiles, rows, chips) — compose `Pressable` directly.
 *
 * ### Data & key props
 * - `onPress` — the activation callback (click, Enter, Space).
 * - `variant` (`solid` | `outline` | `ghost`, default `solid`) · `tone` (default
 *   `accent`) · `size` (`sm` | `md` | `lg`, default `md`) · `fullWidth`.
 * - `loading` (default `false`) — shows an inline spinner, sets `aria-busy`, and
 *   disables the underlying button while the label stays visible.
 * - `startSlot` / `endSlot` — leading/trailing glyphs beside the label.
 * - `asChild` — lend Button's style + behavior to your own single element (e.g. a
 *   router link); slots and spinner are skipped in this mode.
 *
 * ### Accessibility
 * - A real `<button type="button">` by default — never a div; Enter/Space activate
 *   natively and `disabled`/`loading` set the native `disabled` attribute.
 * - The Pressable FSM emits `data-state` (hover/pressed/focus/disabled) and
 *   guarantees the library focus ring; `loading` announces via `aria-busy`.
 * - The spinner is `aria-hidden` — state is carried by `aria-busy`, not the glyph.
 *
 * ### Theming & setup
 * - Tones resolve through `var(--tcl-accent)` / `var(--tcl-status-*)`; works in
 *   light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Button', onPress: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['solid', 'outline', 'ghost'] },
    tone: {
      control: 'select',
      options: ['accent', 'success', 'info', 'warning', 'danger', 'neutral'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a visible, clickable affordance (a real <button>). */
export const Default: Story = {};

/** Job: Afford Action — the three affordance weights (solid / outline / ghost) side by side. */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <Button {...args} variant="solid">
        Solid
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
    </div>
  ),
};

/** Job: Reveal State — the intent tones of the color-coded ontology on one control. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {(['accent', 'success', 'info', 'warning', 'danger', 'neutral'] as const).map((t) => (
        <Button key={t} {...args} tone={t}>
          {t}
        </Button>
      ))}
    </div>
  ),
};

/** Job: Reveal State — idle / disabled / loading are each perceivable. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args}>Idle</Button>
      <Button {...args} disabled>
        Disabled
      </Button>
      <Button {...args} loading>
        Loading
      </Button>
    </div>
  ),
};

/** Job: Acknowledge Input — activates on click + keyboard. */
export const Interaction: Story = {
  args: { children: 'Activate' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: 'Activate' });
    await userEvent.click(btn);
    await expect(args.onPress).toHaveBeenCalled();
  },
};
