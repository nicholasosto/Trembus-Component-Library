import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import type { BadgeTone } from './Badge';

const TONES: BadgeTone[] = ['accent', 'success', 'info', 'warning', 'danger', 'neutral'];

/**
 * A small non-interactive chip that maps a status word onto the color-coded tone
 * ontology (success · info · warning · danger · neutral · accent). Lead job is
 * **reveal state**: the word IS the meaning, the tone reinforces it — Badge never
 * carries meaning in color alone.
 *
 * ### When to use it
 * - Inline status on rows, cards, and headings: "Shipped", "Draft", "Deprecated".
 * - Not interactive — for a clickable/togglable chip use `Button` or `Pressable`;
 *   Badge renders a plain `<span>` with no focus or press affordance.
 * - Not for block-level messages with a body — that's `Callout`; not for transient
 *   confirmations — that's Toast (`useToast`).
 *
 * ### Data & key props
 * - `children` — the status label text (required in practice; it is the meaning).
 * - `tone` (default `neutral`) — status/intent from the ontology.
 * - `variant` (`soft` | `solid` | `outline`, default `soft`) — tint strength.
 * - `size` (`sm` | `md`, default `md`) · `dot` (default `false`) — leading status dot.
 *
 * ### Accessibility
 * - A plain `<span>`: the label is ordinary text for assistive tech; no role, no
 *   tab stop, no focus ring (presentational by design).
 * - The optional dot glyph is `aria-hidden` — decoration, never the message.
 *
 * ### Theming & setup
 * - Tones and variants resolve entirely through `var(--tcl-status-*)` /
 *   `var(--tcl-accent)` tokens; works in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Badge' },
  argTypes: {
    tone: { control: 'select', options: TONES },
    variant: { control: 'inline-radio', options: ['soft', 'solid', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — none; a status output with an optional dot glyph. */
export const Default: Story = { args: { tone: 'success', children: 'Shipped', dot: true } };

/** Job: Acknowledge Input — none; the label is plain text for assistive tech. */
export const Tones: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {TONES.map((t) => (
        <Badge key={t} {...args} tone={t} dot>
          {t}
        </Badge>
      ))}
    </div>
  ),
};

/** Job: Reveal State — every tone × variant of the color-coded ontology. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['soft', 'solid', 'outline'] as const).map((v) => (
        <div key={v} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {TONES.map((t) => (
            <Badge key={t} tone={t} variant={v}>
              {t}
            </Badge>
          ))}
        </div>
      ))}
    </div>
  ),
};
