import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { EpisodeDeck } from './EpisodeDeck';
import type { EpisodeDeckContract } from './EpisodeDeck';

const season: EpisodeDeckContract = {
  view: 'episode-deck',
  title: 'Episode deck',
  caption: 'Season One · select a chapter to inspect it.',
  episodes: [
    {
      id: 'ep01',
      title: 'The Invocation',
      code: 'S01 · EP 01',
      state: 'available',
      synopsis: "A blacksmith's daughter drives the last nail into the last knight.",
    },
    { id: 'ep02', title: 'The Ninth Gate', code: 'S01 · EP 02', state: 'available' },
    { id: 'ep03', title: 'Mara Under the Salt', code: 'S01 · EP 03', state: 'available' },
    {
      id: 'ep04',
      title: 'The Kept Knight Speaks',
      code: 'S01 · EP 04',
      state: 'locked',
      releaseAt: 'APR 26',
    },
    {
      id: 'ep05',
      title: 'All Rites Broken',
      code: 'S01 · EP 05',
      state: 'locked',
      releaseAt: 'MAY 03',
    },
    {
      id: 'ep06',
      title: 'Ferrum · Anima · Ignis',
      code: 'S01 · EP 06',
      state: 'locked',
      releaseAt: 'MAY 10',
    },
  ],
};

/**
 * A season's episode rail — the chaptered-content selector of the game-viz idiom. Each
 * episode is a real focusable button row (Roman numeral or authored glyph, title, code)
 * carrying its release state (available · streaming · locked with a release date), and
 * the selected row's synopsis surfaces in a live inspector. Lead job: **afford action**
 * — this is a selector, not a listing.
 *
 * ### When to use it
 * - Choosing among chaptered content: episodes, missions, acts, quest chains.
 * - Not for site navigation (ui `NavBar` / `Menu`) or hierarchies (ui `FolderTree`).
 *
 * ### Data & key props
 * - `data.episodes` — `{ id?, numeral?, title, code?, state?, releaseAt?, synopsis? }[]`;
 *   give stable `id`s (selection falls back to a synthetic index id, never the title).
 * - `numeral` auto-derives as a Roman numeral from position when omitted.
 * - `selectedId` / `defaultSelectedId` / `onSelect` — the standard selection trio.
 * - `tone` — selection accent + the "now streaming" pulse, default `accent`.
 *
 * ### Accessibility
 * - Rows are `<button>`s with `aria-pressed`, grouped under a `role="group"` named by
 *   the deck title.
 * - State lives in the accessible name in words ("locked — releases APR 26"), never in
 *   color or glyphs alone; locked rows stay focusable and selectable (you can inspect
 *   what you cannot yet watch).
 * - Selection is announced through the `aria-live` inspector; the streaming pulse stops
 *   under `prefers-reduced-motion`.
 *
 * ### Theming & setup
 * - Display serif is Cinzel when you load it (`@fontsource/cinzel`), else serif; most at
 *   home in `data-theme="reliquary"`, correct in light and dark.
 * - game-viz builds on ui + viz: import all three stylesheets —
 *   `@trembus/ui/styles.css`, `@trembus/viz/styles.css`, `@trembus/game-viz/styles.css`.
 */
const meta = {
  title: 'Game/EpisodeDeck',
  component: EpisodeDeck,
  parameters: { layout: 'padded' },
  args: { data: season, defaultSelectedId: 'ep01' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EpisodeDeck>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Afford Action — each episode is a focusable, selectable button row. */
export const Default: Story = {};

/** Job: Reveal State — available / now-streaming / locked release states, tone-coded by word. */
export const States: Story = {
  args: {
    defaultSelectedId: 'ep01',
    data: {
      ...season,
      caption: 'A mid-flight season: one streaming, some watchable, the rest locked.',
      episodes: [
        { ...season.episodes[0], state: 'streaming' },
        season.episodes[1],
        season.episodes[2],
        season.episodes[3],
        season.episodes[4],
        season.episodes[5],
      ],
    },
  },
};

/** Job: Acknowledge Input — selecting a row flips aria-pressed and announces it in the live inspector. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // ep01 starts selected (defaultSelectedId).
    const ep01 = canvas.getByRole('button', { name: /^I\. The Invocation/ });
    await expect(ep01).toHaveAttribute('aria-pressed', 'true');

    // Selecting ep02 moves the selection and updates the live inspector.
    const ep02 = canvas.getByRole('button', { name: /^II\. The Ninth Gate/ });
    await expect(ep02).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(ep02);
    await expect(ep02).toHaveAttribute('aria-pressed', 'true');
    await expect(ep01).toHaveAttribute('aria-pressed', 'false');

    // A locked episode is still reachable + selectable; its date is in the name.
    const ep04 = canvas.getByRole('button', { name: /^IV\..*releases APR 26/ });
    await userEvent.click(ep04);
    await expect(ep04).toHaveAttribute('aria-pressed', 'true');
  },
};
