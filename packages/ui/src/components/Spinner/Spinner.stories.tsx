import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';

/**
 * A `role="status"` busy ring for short, indeterminate waits. The spinning arc is
 * decorative; a visually hidden label carries the announcement. Lead job: reveal
 * state — presentational, it affords nothing itself (pair it with the disabled/
 * loading control it describes, e.g. Button `loading`).
 *
 * ### When to use it
 * - A brief wait of unknown length: a submitting button, a refreshing panel.
 * - Not when the coming layout is known — use `Skeleton`.
 * - Not when progress is measurable — use `Progress`.
 *
 * ### Data & key props
 * - `size` — `sm | md | lg | xl` (default `md`).
 * - `tone` — `current` (default; inherits the surrounding text color) · `accent` ·
 *   the status tones.
 * - `label` — the screen-reader text (default `"Loading"`).
 *
 * ### Accessibility
 * - The root is `role="status"`, so the label is announced politely; the ring
 *   itself is `aria-hidden`.
 * - Not focusable; the spin collapses to a static ring under
 *   `prefers-reduced-motion` (library-wide guard in `styles/a11y.css`).
 *
 * ### Theming & setup
 * - `tone="current"` rides `currentColor`, so it matches surrounding Button/Text
 *   color automatically; explicit tones map to `var(--tcl-accent)` /
 *   `var(--tcl-status-*)`. Works in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
    tone: {
      control: 'select',
      options: ['current', 'accent', 'neutral', 'success', 'info', 'warning', 'danger'],
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — a busy indicator. */
export const Default: Story = { args: { tone: 'accent' } };

/** Job: Afford Action — the size scale. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center', color: 'var(--tcl-accent)' }}>
      {(['sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <Spinner key={s} size={s} />
      ))}
    </div>
  ),
};

/** Job: Acknowledge Input — tones (the color-coded ontology). */
export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      {(['accent', 'success', 'info', 'warning', 'danger'] as const).map((t) => (
        <Spinner key={t} tone={t} />
      ))}
    </div>
  ),
};
