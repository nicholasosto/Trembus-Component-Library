import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Timeline } from './Timeline';
import type { TimelineContract } from './Timeline';

// A real timeline contract — a chronicle of dated events across epochs, each
// tone-coded by category. One authored shape; ordinal or proportional layout.
const ironAge: TimelineContract = {
  view: 'timeline',
  code: 'III',
  brand: 'The Reliquary',
  title: 'Chronicle of the Iron Age',
  caption: 'Click an event to inspect it; step the ages with the arrows.',
  meta: '1,204 years · 7 epochs',
  scale: 'ordinal',
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

const meta = {
  title: 'Visualizations/Timeline',
  component: Timeline,
  args: { data: ironAge },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1100 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — the full chronicle; events alternate above/below the axis, tone-coded by category. */
export const Default: Story = {};

/**
 * Job: Afford Action — the same chronicle in a proportional `time` scale (events sit at
 * their true date and de-overlap so the early cluster stays readable), with one selected.
 */
export const States: Story = {
  args: {
    defaultSelectedId: 'war',
    data: { ...ironAge, title: 'Chronicle of the Iron Age — proportional', scale: 'time' },
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
    // the live inspector reveals the selected event's note
    await expect(canvas.getByText(/the year of the binding/)).toBeInTheDocument();
    // the Next arrow steps the selection to the following age
    await userEvent.click(canvas.getByRole('button', { name: 'Next event' }));
    await expect(
      canvas.getByRole('button', { name: 'XII A.V.: The Silent Rite — Rites' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(pact).toHaveAttribute('aria-pressed', 'false');
  },
};
