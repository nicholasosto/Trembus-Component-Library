import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Chronicle } from './Chronicle';
import type { ChronicleContract } from './Chronicle';

// The same authored shape as the ui Timeline — here worn as a liturgical chronicle.
const ironAge: ChronicleContract = {
  view: 'timeline',
  code: 'III',
  brand: 'The Reliquary',
  title: 'Chronicle of the Iron Age',
  caption: 'Click an event to inspect it; step the ages with the arrows.',
  meta: '1,204 years · 7 epochs',
  categories: [
    { key: 'war', label: 'Wars', tone: 'danger' },
    { key: 'rite', label: 'Rites', tone: 'info' },
    { key: 'fall', label: 'Falls', tone: 'neutral' },
    { key: 'pact', label: 'Pacts', tone: 'success' },
  ],
  events: [
    {
      id: 'drown',
      at: -4,
      dateLabel: '-IV A.V.',
      sub: 'Epoch · Tides',
      label: 'The Sea Takes Vaskerholm',
      category: 'fall',
      detail:
        'The cathedral city drowns in a single tide. Nine thousand souls refuse to go with it.',
      note: 'The drowning is the founding wound — every later rite reaches back to it.',
    },
    {
      id: 'pact',
      at: 0,
      dateLabel: '0 A.V.',
      sub: 'Epoch · Tides',
      label: 'The First Pact',
      category: 'pact',
      detail:
        'The Order is founded on the drowned altar. The first knight agrees to the first nail.',
      note: 'Anno Vinculum — "the year of the binding." The calendar starts here.',
    },
    {
      id: 'rite',
      at: 12,
      dateLabel: 'XII A.V.',
      sub: 'Epoch · Tides',
      label: 'The Silent Rite',
      category: 'rite',
      detail:
        'Eight hundred souls bound in a single night. No one remembers who conducted the rite.',
    },
    {
      id: 'war',
      at: 211,
      dateLabel: 'CCXI A.V.',
      sub: 'Epoch · Silence',
      label: 'War of Cold Coasts',
      category: 'war',
      detail:
        'The Coven of the Cold Coast breaks the pact. Salt meets steel for three generations.',
      note: 'The longest war of the age — and the one that made Mara of the Salt.',
    },
    {
      id: 'gate',
      at: 471,
      dateLabel: 'CDLXXI A.V.',
      sub: 'Epoch · Silence',
      label: 'The Ninth Gate Built',
      category: 'rite',
      detail: 'Warden Solveig takes her post. She does not leave it.',
    },
    {
      id: 'forge',
      at: 800,
      dateLabel: 'DCCC A.V.',
      sub: 'Epoch · Ash',
      label: 'The Forge Rekindled',
      category: 'war',
      detail: 'The Kept Knight is struck from a drowned cathedral bell. The first reliquary walks.',
    },
    {
      id: 'broken',
      at: 1200,
      dateLabel: 'MCC A.V.',
      sub: 'Epoch · Ash',
      label: 'All Rites Broken',
      category: 'fall',
      detail: 'The forge consumes its maker. The age ends as it began — under water, under salt.',
      note: 'The chronicle stops here. No one survived to write the next entry.',
    },
  ],
};

/**
 * The liturgical-gothic skin over the ui `Timeline` — same contract
 * (`ChronicleContract` IS `TimelineContract`), same keyboard and selection spine,
 * passed straight through. The skin adds the reliquary-dark plate, a display-serif
 * title plate, an optional archive tab, and re-tints the whole timeline accent
 * (scrubber · selection ring · numerals · inspector rail) through the
 * `--tcl-timeline-accent` hook — defaulting to the order's blood-red `danger`.
 *
 * ### When to use it
 * - A dated-event chronicle on a lore or game page that speaks this idiom.
 * - Anywhere else: use ui `Timeline` directly. Pick the base component first, swap to
 *   the skin if the idiom fits — the skin adds no behavior of its own.
 *
 * ### Data & key props
 * - `data: ChronicleContract` — authored exactly like a Timeline: `events` with stable
 *   `id`s, optional `categories` legend, `code` / `brand` / `title` / `caption` masthead.
 * - `selectedId` / `defaultSelectedId` / `onSelect` — the selection trio, forwarded.
 * - `tone` — the accent re-tint, default `danger` · `archive` — the top tab label.
 *
 * ### Accessibility
 * - Identical to `Timeline`: every event is a real focusable button (named
 *   "date: label — category"), prev/next steppers walk the axis, and selection is
 *   announced in the `aria-live` inspector.
 * - The plate chrome is `aria-hidden` decoration.
 *
 * ### Theming & setup
 * - Display serif is Cinzel when you load it (`@fontsource/cinzel`), else serif; most at
 *   home in `data-theme="reliquary"`, correct in light and dark.
 * - game-viz builds on ui + viz: import all three stylesheets —
 *   `@trembus/ui/styles.css`, `@trembus/viz/styles.css`, `@trembus/game-viz/styles.css`.
 */
const meta = {
  title: 'Game/Chronicle',
  component: Chronicle,
  args: { data: ironAge, archive: 'The Reliquary Archive' },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1100 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Chronicle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — the full chronicle in its blood-red reliquary frame. */
export const Default: Story = {};

/** Job: Afford Action — the same chronicle re-tinted (a different age, a different accent). */
export const States: Story = {
  args: {
    tone: 'accent',
    defaultSelectedId: 'war',
    archive: 'The Gilded Annals',
    data: { ...ironAge, code: 'IX', title: 'Chronicle of the Gilded Age' },
  },
};

/** Job: Acknowledge Input — selecting an event rings it and reveals its detail; the arrows step the ages. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const pact = canvas.getByRole('button', { name: '0 A.V.: The First Pact — Pacts' });
    await expect(pact).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(pact);
    await expect(pact).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/the year of the binding/)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Next event' }));
    await expect(
      canvas.getByRole('button', { name: 'XII A.V.: The Silent Rite — Rites' }),
    ).toHaveAttribute('aria-pressed', 'true');
  },
};
