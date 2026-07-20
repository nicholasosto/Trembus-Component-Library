import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';

// A tiny inline image so stories don't depend on the network.
const IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="%232EC4B6"/><circle cx="48" cy="38" r="18" fill="white"/><rect x="20" y="62" width="56" height="30" rx="15" fill="white"/></svg>',
  );

/**
 * An identity mark with a graceful three-step fallback: image → initials (derived
 * from `name`) → a generic person glyph. Lead job is **reveal state** — it shows
 * who or what something belongs to; it is presentational and owns no interaction.
 *
 * ### When to use it
 * - Identity next to authored content: comment threads, assignee cells, member
 *   lists, account menus.
 * - Not an action in itself — wrap it in a link or button when clicking it should
 *   navigate (the wrapper owns focus and the name).
 * - Not for arbitrary imagery or thumbnails — it is an identity mark, sized on a
 *   fixed scale.
 *
 * ### Data & key props
 * - `name` — drives the initials fallback (first letters of up to two words) and
 *   doubles as the accessible name.
 * - `src` — image URL; a failed load flips to initials automatically.
 * - `alt` — explicit accessible name, wins over `name`.
 * - `size` (`xs`–`xl`, default `md`) · `shape` (`circle` | `square`, default `circle`).
 * - `tone` (default `neutral`) — tints the initials fallback only.
 *
 * ### Accessibility
 * - Renders a labelled `role="img"` named by `alt ?? name`; with neither, it marks
 *   itself `aria-hidden` (decorative) rather than exposing an empty name.
 * - The inner `<img>` carries an empty `alt` — the name lives once, on the root.
 * - Initials and the fallback glyph are `aria-hidden`; identity is announced in
 *   words, never by color alone.
 *
 * ### Theming & setup
 * - `tone` maps to the status tokens; works in light · dark · reliquary via
 *   `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  args: { name: 'Ada Lovelace' },
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'inline-radio', options: ['circle', 'square'] },
    tone: {
      control: 'select',
      options: ['neutral', 'success', 'info', 'warning', 'danger'],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — presentational identity (wrap in a link if actionable). */
export const Default: Story = {};

/** Job: Reveal State — image / initials / fallback glyph, with tones. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Avatar src={IMG} alt="Grace Hopper" />
      <Avatar name="Ada Lovelace" tone="info" />
      <Avatar name="Katherine Johnson" tone="success" />
      <Avatar alt="Unknown member" />
    </div>
  ),
};

/** Job: Acknowledge Input — graceful image fallback; size scale. */
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <Avatar key={s} size={s} name="Ada Lovelace" tone="info" />
      ))}
    </div>
  ),
};
