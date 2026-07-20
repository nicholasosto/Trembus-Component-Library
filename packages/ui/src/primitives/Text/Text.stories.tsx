import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from './Text';

/**
 * The MARK primitive — typography on the token scale: `size` (`xs`–`xl`), `weight`,
 * `tone` (default · dim · faint · accent + the status tones), `mono`, `truncate`,
 * `align`. Polymorphic `as` supplies the real semantics (`h1`, `p`, `label`, …);
 * Text itself renders a `<span>` by default.
 *
 * ### When to use it
 * - All running text in composed chrome — headings, captions, values, micro-labels.
 * - Not a prose engine: it styles ONE mark; long-form content brings its own markup.
 *
 * ### Data & key props
 * - `size` / `weight` — type-scale and weight tokens.
 * - `tone` — ink from the text-tone vocabulary; status tones color-code WITH the
 *   words carrying the meaning, never instead of them.
 * - `mono` — the mono stack · `truncate` — single line + ellipsis · `align`.
 * - Polymorphic `as` — pick real elements for headings and labels.
 *
 * ### Accessibility
 * - The tone inks are AA-managed per theme by the tokens (the `faint` / `dim` tiers
 *   were contrast-lifted across light · dark · reliquary).
 * - Semantics come from `as` — a `size="xl"` span is not a heading until you say
 *   `as="h1"`.
 *
 * ### Theming & setup
 * - Tones resolve per theme automatically; no hexes, ever.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full
 *   tokens foundation).
 */
const meta = {
  title: 'Primitives/Text',
  component: Text,
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof Text>;

/** The type scale — with real heading semantics supplied via `as`. */
export const Scale: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Text as="h1" size="xl" weight="bold">
        Display / xl
      </Text>
      <Text as="h2" size="lg" weight="semibold">
        Heading / lg
      </Text>
      <Text size="base">Body / base</Text>
      <Text size="sm" tone="dim">
        Caption / sm dim
      </Text>
      <Text size="xs" mono tone="faint">
        MONO / xs faint
      </Text>
    </div>
  ),
};

/** Every text tone — the words carry the meaning, the tone reinforces it. */
export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(['default', 'dim', 'faint', 'accent', 'success', 'info', 'warning', 'danger'] as const).map(
        (t) => (
          <Text key={t} tone={t}>
            tone: {t}
          </Text>
        ),
      )}
    </div>
  ),
};
