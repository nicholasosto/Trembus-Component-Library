import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './Breadcrumb';

/**
 * The location trail: an ordered list of ancestor links ending in the current
 * page. Lead job is **reveal state** — where you are in the hierarchy — while
 * each ancestor crumb is a real link that affords navigating up a level.
 *
 * ### When to use it
 * - Any page more than one level deep in a hierarchy (docs, file paths, settings).
 * - Not for primary site navigation — that's `NavBar`; Breadcrumb answers "where
 *   am I", not "where can I go".
 *
 * ### Data & key props
 * - `items: BreadcrumbItemData[]` — declarative `{ label, href?, current? }` trail;
 *   with no explicit `current`, the last item is inferred as the current page.
 * - Or compose `Breadcrumb.Item` children: `href` renders a link, `current` renders
 *   the inert current crumb, `asChild` lends the crumb class to YOUR router link.
 * - With `asChild`, `aria-current` is only asserted when `current` is explicit —
 *   omit it and the wrapped router link keeps its own `aria-current`.
 * - `separator` (default `›`) — decorative glyph between crumbs.
 *
 * ### Accessibility
 * - Renders a `<nav>` landmark (`aria-label` default "Breadcrumb") around an
 *   `<ol>`, one `<li>` per crumb.
 * - The current crumb is an inert `<span aria-current="page">` — never a link, so
 *   it cannot be mis-activated; ancestor links carry the library focus ring.
 * - Separators are `aria-hidden` decoration.
 *
 * ### Theming & setup
 * - Text-token styling only (`--tcl-text*`); works in light · dark · reliquary via
 *   `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const trail = [
  { label: 'Home', href: '/' },
  { label: 'Components', href: '/components' },
  { label: 'Breadcrumb' },
];

/** Job: Afford Action — ancestor crumbs are real links; the last is the current page. */
export const Default: Story = {
  args: { items: trail },
};

/** Job: Reveal State — our-set current (top) vs a wrapped router link that sets
 *  its own aria-current (bottom). Both render identically. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Breadcrumb items={trail} />
      <Breadcrumb aria-label="Router breadcrumb">
        <Breadcrumb.Item asChild>
          <a href="/">Home</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item asChild>
          <a href="/components">Components</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item asChild>
          <a href="/components/breadcrumb" aria-current="page">
            Breadcrumb
          </a>
        </Breadcrumb.Item>
      </Breadcrumb>
    </div>
  ),
};

/** Job: Acknowledge Input — Tab through the ancestor links; the current crumb is inert. */
export const Interaction: Story = {
  render: () => (
    <Breadcrumb>
      <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="/components">Components</Breadcrumb.Item>
      <Breadcrumb.Item current>Breadcrumb</Breadcrumb.Item>
    </Breadcrumb>
  ),
};
