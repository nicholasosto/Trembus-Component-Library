import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Pressable } from './Pressable';

const demoStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: 5,
  border: '1px solid var(--tcl-border-strong)',
  background: 'var(--tcl-surface-raised)',
  color: 'var(--tcl-text)',
};

/**
 * The AFFORDANCE primitive — it owns the interaction state machine (hover · active ·
 * disabled · loading) and publishes it as `data-state` attributes for CSS, while
 * keeping the DOM a REAL `<button>` — or lending the behavior to your own element via
 * `asChild`. `Button`, `IconButton`, and every pressy surface in the library stand on it.
 *
 * ### When to use it
 * - Building a custom pressable surface: a tile, a chip, a card that acts.
 * - Not for standard actions — use `Button` / `IconButton`, already composed on it.
 *
 * ### Data & key props
 * - `onPress` — the single activation callback (pointer and keyboard alike).
 * - `disabled` / `loading` — both enter the state machine; a native `<button>` gets
 *   the real `disabled` attribute (it supersedes `aria-disabled`).
 * - `asChild` — merge the behavior into your child element (a router link, an `<a>`)
 *   via Slot instead of rendering a `<button>`.
 * - Polymorphic `as` — with a dev-mode warning when the tag risks an invisible or
 *   unreachable affordance (stick to `button` / `a`).
 *
 * ### Accessibility
 * - A real `<button type="button">` by default — native focus, Enter/Space, and
 *   disabled semantics; `asChild` preserves YOUR element's semantics.
 *
 * ### Theming & setup
 * - Style states via the published `data-state` attributes — no JS required.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full
 *   tokens foundation).
 */
const meta = {
  title: 'Primitives/Pressable',
  component: Pressable,
  args: { onPress: fn() },
} satisfies Meta<typeof Pressable>;

export default meta;
type Story = StoryObj<typeof Pressable>;

/** Renders a real <button> and owns the Affordance state machine (data-state). */
export const Default: Story = {
  render: (args) => (
    <Pressable {...args} style={demoStyle}>
      Press me
    </Pressable>
  ),
};

/** `asChild` lends the affordance behavior to your own element (here, a link). */
export const AsChildLink: Story = {
  render: (args) => (
    <Pressable {...args} asChild>
      <a href="#example" style={{ ...demoStyle, textDecoration: 'none' }}>
        I am a link with button behavior
      </a>
    </Pressable>
  ),
};
