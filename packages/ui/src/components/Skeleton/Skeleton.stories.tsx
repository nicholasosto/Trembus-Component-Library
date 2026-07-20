import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

/**
 * A shimmering placeholder that holds the shape of content still loading — text
 * lines, a rectangle, or a circle. Purely decorative (`aria-hidden`): it reveals
 * "something is coming" visually while the container owns the real loading
 * announcement (the Badge/Skeleton "presentational" precedent).
 *
 * ### When to use it
 * - The coming layout is known — mirror it so the swap doesn't jump.
 * - Not for short indeterminate waits with no known layout — use `Spinner`.
 * - Not for measurable completion — use `Progress`.
 *
 * ### Data & key props
 * - `variant` — `rect` (default) · `text` (thin 0.8em line) · `circle`.
 * - `width` / `height` — a number (px) or any CSS length.
 * - `lines` — for `variant="text"`: stacks that many lines, the last shortened to
 *   60% (default `1`).
 *
 * ### Accessibility
 * - Always `aria-hidden` — invisible to assistive tech by design. Set `aria-busy`
 *   on the container that swaps it for real content, or pair the region with a
 *   real announcement (e.g. `DataStatusBar` loading).
 * - The shimmer collapses to a static block under `prefers-reduced-motion`
 *   (library-wide guard in `styles/a11y.css`).
 *
 * ### Theming & setup
 * - Fills with `var(--tcl-surface-sunken)`; the shimmer is a `color-mix` sheen of
 *   `--tcl-text`, so it reads in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — placeholders for loading content. */
export const Default: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 12, width: 280 }}>
      <Skeleton variant="text" lines={3} />
    </div>
  ),
};

/** Job: Afford Action — the shape variants. */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Skeleton variant="circle" width={48} height={48} />
      <Skeleton variant="rect" width={120} height={48} />
      <Skeleton variant="text" width={160} />
    </div>
  ),
};

/** Job: Acknowledge Input — composed into a card placeholder. */
export const Composed: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', width: 280 }}>
      <Skeleton variant="circle" width={40} height={40} />
      <div style={{ flex: 1, display: 'grid', gap: 8 }}>
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  ),
};
