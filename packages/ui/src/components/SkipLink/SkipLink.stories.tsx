import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { SkipLink } from './SkipLink';

/**
 * The bypass-blocks affordance (WCAG 2.4.1): a real `<a>` that stays visually
 * hidden until focused, then reveals at the top-left so a keyboard or
 * screen-reader user can jump straight past the chrome to the main landmark. Part
 * of the routing-agnostic navigation set (NavBar · Breadcrumb · SkipLink). Lead
 * job: afford action.
 *
 * ### When to use it
 * - Any page with a nav bar before the content — render it first in the DOM so it
 *   is the first Tab stop. Cheap, always worth it.
 * - Not a nav menu (`NavBar`) or a location trail (`Breadcrumb`) — it is a single
 *   escape hatch.
 *
 * ### Data & key props
 * - `href` — the in-page target (default `#main`); give that landmark the matching
 *   id (and `tabIndex={-1}`) so focus lands.
 * - `children` — the link text (default `"Skip to main content"`).
 * - All other anchor props pass through.
 *
 * ### Accessibility
 * - A real link: focusing reveals it (the reveal rides `:focus`, so it appears for
 *   any focus) with the library focus ring; activating it moves focus to the target.
 * - The hidden baseline and the `:focus` reveal live in the SAME `@layer`, so the
 *   reveal never depends on cross-layer CSS ordering (Storybook/bundler injection
 *   order can't break it).
 *
 * ### Theming & setup
 * - Revealed chrome uses `--tcl-surface-raised` / `--tcl-text` / `--tcl-border`;
 *   works in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/SkipLink',
  component: SkipLink,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a real bypass link to the main landmark. Press Tab to reveal it. */
export const Default: Story = {
  args: { href: '#sb-main' },
  render: (args) => (
    <div style={{ padding: 16 }}>
      <SkipLink {...args} />
      <p>
        Press <kbd>Tab</kbd> — the skip link appears at the top-left.
      </p>
      <nav aria-label="Primary" style={{ display: 'flex', gap: 8 }}>
        <a href="#a">One</a>
        <a href="#b">Two</a>
      </nav>
      <main id="sb-main" tabIndex={-1} style={{ marginTop: 16 }}>
        Main content — activating the skip link moves focus here.
      </main>
    </div>
  ),
};

/** Job: Reveal State — hidden until focused, then revealed top-left (focused on load). */
export const States: Story = {
  args: { href: '#sb-main-2' },
  render: (args) => (
    <div style={{ padding: 16 }}>
      <SkipLink {...args} />
      <main id="sb-main-2" tabIndex={-1}>
        The link is focused on load to show its revealed appearance.
      </main>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getByRole('link', { name: 'Skip to main content' }).focus();
  },
};

/** Job: Acknowledge Input — Tab focuses and reveals it; the focus ring confirms. */
export const Interaction: Story = {
  args: { href: '#sb-main-3' },
  render: (args) => (
    <div style={{ padding: 16 }}>
      <SkipLink {...args} />
      <main id="sb-main-3" tabIndex={-1}>
        Target landmark.
      </main>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Skip to main content' })).toHaveFocus();
  },
};
