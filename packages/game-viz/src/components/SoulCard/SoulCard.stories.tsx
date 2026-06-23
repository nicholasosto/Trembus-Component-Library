import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { SoulCard } from './SoulCard';
import type { SoulCardContract } from './SoulCard';

const mara: SoulCardContract = {
  view: 'soul-card',
  index: 'SOUL · IV',
  state: 'UNBOUND',
  stateTone: 'danger',
  name: 'Mara of the Salt',
  epithet: 'Saltwitch, Thirteenth of her Line',
  tone: 'danger',
  stats: [
    { label: 'House', value: 'Coven of the Cold Coast' },
    { label: 'Bound Epoch', value: 'I · Age of Tides' },
    { label: 'Integrity', value: 'VOLATILE' },
    { label: 'Weapon', value: 'Ninety-nine tongues' },
  ],
  description:
    'A witch made from drowned sailors. Every sound she makes is in a different voice. She is searching for the one voice that was hers, and she will unmake the world to find it, and no she will not apologize.',
  quote: '“All of my mouths are borrowed. None of them lie.”',
  back: {
    heading: 'The Drowning',
    body: 'Drowned off the Cold Coast in the Age of Tides; the sea kept her voice and returned ninety-nine others. She has been listening for it ever since.',
    items: [
      { label: 'Rite', value: 'The Hundredth Voice' },
      { label: 'Ward', value: 'Salt across the threshold' },
      { label: 'Bane', value: 'Her name, spoken true' },
    ],
    quote: '“Tell me which voice was mine and I will give you the other ninety-eight.”',
  },
};

const knight: SoulCardContract = {
  index: 'SOUL · I',
  state: 'CONTAINED',
  stateTone: 'success',
  name: 'The Kept Knight',
  epithet: 'Subject 001, Order of the Rusted Cross',
  tone: 'accent',
  stats: [
    { label: 'House', value: 'Order of the Rusted Cross' },
    { label: 'Bound Epoch', value: 'IX · Age of Iron' },
    { label: 'Integrity', value: '34.7%' },
    { label: 'Weapon', value: 'A single nail' },
  ],
  description:
    'Forged in the drowned cathedral of Vaskerholm. Every soul is a nail; every knight, a reliquary. He does not remember dying. He remembers the hammer.',
  quote: '“I was made to hold. So I hold.”',
  back: {
    heading: 'The Forging',
    body: 'Hammered from a drowned cathedral bell. Each strike bound another soul to the steel; he holds them so they cannot scream.',
    items: [
      { label: 'Rite', value: 'The Last Nail' },
      { label: 'Ward', value: 'A name no one remembers' },
    ],
    quote: '“I was made to hold. So I hold.”',
  },
};

// no `back` → a static dossier (the original behavior, no flip control)
const minimal: SoulCardContract = {
  index: 'SOUL · ??',
  state: 'UNKNOWN',
  stateTone: 'neutral',
  name: 'Unmarked Soul',
  stats: [{ label: 'Integrity', value: 'No reading' }],
};

const meta = {
  title: 'Game/SoulCard',
  component: SoulCard,
  parameters: { layout: 'padded' },
  args: { data: mara },
} satisfies Meta<typeof SoulCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — the full Mara of the Salt dossier (with a reverse to flip to). */
export const Default: Story = {};

/** Job: Afford Action — flippable cards (with the flip control) beside a static one (no `back`). */
export const States: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gap: '1.5rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        alignItems: 'start',
      }}
    >
      <SoulCard data={mara} />
      <SoulCard data={knight} />
      <SoulCard data={minimal} />
    </div>
  ),
};

/** Job: Acknowledge Input — clicking the flip control turns the card to its reverse. */
export const Interaction: Story = {
  args: { data: mara },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const flip = canvas.getByRole('button', { name: /Show the reverse of Mara/ });
    await expect(flip).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(flip);
    await expect(flip).toHaveAttribute('aria-pressed', 'true');
    // the reverse content is now revealed
    await expect(canvas.getByRole('heading', { name: 'The Drowning' })).toBeInTheDocument();
    await expect(canvas.getByText(/the other ninety-eight/)).toBeInTheDocument();
    // and the control now offers to flip back
    await expect(
      canvas.getByRole('button', { name: /Show the front of Mara/ }),
    ).toBeInTheDocument();
  },
};
