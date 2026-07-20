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

/**
 * The title plate — a cinematic identity hero: kicker eyebrow, a display title with the
 * fill + outline treatment, an italic tagline with an accented highlight word, a
 * call-to-action row, and an accolade strip. Reveal-state chrome around real
 * link/button actions; there is no selection model. This is the package's most
 * reusable piece outside games — it works as a landing or launch hero anywhere the
 * idiom fits.
 *
 * ### When to use it
 * - Title screens, season/launch landings, marketing heroes.
 * - Not for everyday app page headers — compose ui `Stack`/`Text`/`Button`; reach for
 *   the hero when the moment is cinematic.
 *
 * ### Data & key props
 * - One `data: CinematicHeroContract`; `title` is required — a plain string, or
 *   `{ text, outline? }[]` lines for the fill + outline display treatment.
 * - `actions` — `href` renders a real `<a>`, `onPress` a `<button>`; `variant` picks
 *   primary/secondary weight; `meta` is the trailing note ("2:14 · trailer").
 * - `tagline` + `highlight` — the highlight substring renders in the accent tone.
 * - `accolades` — `{ value, source? }[]`, the press-quote strip.
 * - `data.tone` — outline stroke, highlight, primary CTA, kicker dot; default `accent`.
 *
 * ### Accessibility
 * - The title renders as an `<h1>` — one hero per page, at the top of the heading
 *   outline.
 * - Actions are real controls (link vs button decided by the data); their `icon` is
 *   `aria-hidden` decoration.
 * - The tagline highlight is emphasis on top of readable text — meaning never rides
 *   color alone. Motion honors `prefers-reduced-motion`.
 *
 * ### Theming & setup
 * - The display title wants Cinzel (`@fontsource/cinzel`), else serif; most at home in
 *   `data-theme="reliquary"`, correct in light and dark.
 * - game-viz builds on ui + viz: import all three stylesheets —
 *   `@trembus/ui/styles.css`, `@trembus/viz/styles.css`, `@trembus/game-viz/styles.css`.
 */
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
