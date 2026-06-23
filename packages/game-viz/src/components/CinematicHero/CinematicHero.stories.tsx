import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CinematicHero } from './CinematicHero';
import type { CinematicHeroContract } from './CinematicHero';

const soulSteel: CinematicHeroContract = {
  view: 'cinematic-hero',
  tone: 'danger',
  kicker: 'An Animated Liturgy · VI Episodes · Autumn MMXXVI',
  title: [{ text: 'Soul' }, { text: 'Steel', outline: true }],
  tagline:
    'In the drowned cathedral of Vaskerholm, the dead do not rest — they are FORGED. Every soul is a nail. Every knight, a reliquary.',
  highlight: 'FORGED',
  actions: [
    {
      label: 'Watch the Invocation',
      meta: '2:14 · trailer',
      icon: '▶',
      variant: 'primary',
      href: '#',
    },
    { label: 'Enter the Codex', icon: '◉', variant: 'secondary', href: '#' },
  ],
  accolades: [
    { value: 'IX · X', source: 'The Reliquary' },
    { value: '★★★★★', source: 'Ash & Iron' },
    { value: '“Unholy”', source: 'Nocturne Quarterly' },
  ],
};

const meta = {
  title: 'Game/CinematicHero',
  component: CinematicHero,
  parameters: { layout: 'fullscreen' },
  args: { data: soulSteel },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'var(--tcl-space-6)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CinematicHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — the full Soul Steel title plate (fill + outline display title). */
export const Default: Story = {};

/** Job: Afford Action — title/tone variants + the CTA row (primary button + secondary link). */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      <CinematicHero data={soulSteel} />
      <CinematicHero
        data={{
          tone: 'accent',
          kicker: 'A Trembus Original · Single Title',
          title: 'The Last Nail',
          tagline: 'No outline, no accolades — the same component, a quieter cut.',
          actions: [{ label: 'Watch now', icon: '▶', variant: 'primary', href: '#' }],
        }}
      />
    </div>
  ),
};

/** Job: Acknowledge Input — pressing the primary CTA fires its handler and shows the focus ring. */
export const Interaction: Story = {
  args: {
    data: {
      ...soulSteel,
      actions: [
        {
          label: 'Watch the Invocation',
          meta: '2:14 · trailer',
          icon: '▶',
          variant: 'primary',
          onPress: fn(),
        },
        { label: 'Enter the Codex', icon: '◉', variant: 'secondary', href: '#' },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const watch = canvas.getByRole('button', { name: /Watch the Invocation/ });
    await userEvent.click(watch);
    // the secondary action is a real link with an href
    const codex = canvas.getByRole('link', { name: /Enter the Codex/ });
    await expect(codex).toHaveAttribute('href', '#');
  },
};
