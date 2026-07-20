import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavBar } from './NavBar';

/**
 * A labelled `<nav>` bar of primary site links — the "where can I go" strip of the
 * routing-agnostic navigation set (with `Breadcrumb` and `SkipLink`). Lead job:
 * afford action — every entry is a real `<a>`, or your router's link via `asChild`.
 *
 * ### When to use it
 * - Top-level navigation between routed destinations (URLs change).
 * - Not for switching in-page panels — use `Tabs`.
 * - Not for command lists or overflow actions — use `Menu` / `Toolbar`.
 *
 * ### Data & key props
 * - Compound: `NavBar.Link` children; the root wraps each child in a semantic
 *   `<ul>`/`<li>` list.
 * - Root `aria-label` names the landmark (default `"Primary"`).
 * - `NavBar.Link` — `href` + `active` (renders `aria-current="page"`).
 * - `NavBar.Link asChild` lends the link class to YOUR router link (e.g. a
 *   react-router `<NavLink>`); omit `active` there and the wrapped link keeps its
 *   own `aria-current`.
 *
 * ### Accessibility
 * - A `role="navigation"` landmark named by `aria-label`.
 * - `aria-current="page"` is emitted only when `active` is explicit, so a
 *   router-owned `aria-current` is never clobbered in `asChild` mode.
 * - Links are real anchors: Tab moves through them in DOM order with the library
 *   focus ring; active styling keys off `[aria-current="page"]`, not a class.
 *
 * ### Theming & setup
 * - Active tint is a `color-mix` of `var(--tcl-accent)`; hover uses
 *   `--tcl-surface-sunken`. Works in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/NavBar',
  component: NavBar,
  args: { 'aria-label': 'Primary' },
} satisfies Meta<typeof NavBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — a bar of real navigation links; the current one is active. */
export const Default: Story = {
  render: (args) => (
    <NavBar {...args}>
      <NavBar.Link href="/" active>
        Home
      </NavBar.Link>
      <NavBar.Link href="/roster">Roster</NavBar.Link>
      <NavBar.Link href="/episodes">Episodes</NavBar.Link>
      <NavBar.Link href="/chronicle">Chronicle</NavBar.Link>
    </NavBar>
  ),
};

/** Job: Reveal State — our-set active (top) vs a wrapped router link that sets its
 *  own aria-current (bottom). Both tint identically. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <NavBar aria-label="Our-set active">
        <NavBar.Link href="/" active>
          Home
        </NavBar.Link>
        <NavBar.Link href="/two">Two</NavBar.Link>
      </NavBar>
      <NavBar aria-label="Router-set active (asChild)">
        <NavBar.Link asChild>
          <a href="/" aria-current="page">
            Home
          </a>
        </NavBar.Link>
        <NavBar.Link asChild>
          <a href="/two">Two</a>
        </NavBar.Link>
      </NavBar>
    </div>
  ),
};

/** Job: Acknowledge Input — Tab moves between links in DOM order with the focus ring. */
export const Interaction: Story = {
  render: (args) => (
    <NavBar {...args}>
      <NavBar.Link href="/">Home</NavBar.Link>
      <NavBar.Link href="/two">Two</NavBar.Link>
      <NavBar.Link href="/three">Three</NavBar.Link>
    </NavBar>
  ),
};
