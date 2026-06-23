// Example PAGE — the "Soul Steel" microsite, a composition of all four game-viz
// components, NOT a library component (no single 3-jobs contract). Lives in
// src/examples/ so `check:contracts` ignores it; composes from the public barrel
// ('../index') so it exercises the real consumer API.
//
// The "magic": the EpisodeDeck (right) drives the Reliquary feature frame (left) —
// selecting an episode re-labels the NOW SHOWING frame, echoing the deck↔player
// relationship of the inspiration. Everything is tone="danger" to match the
// liturgical-red Soul Steel brand (the components default to the Trembus gold).
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CinematicHero, EpisodeDeck, Reliquary, SoulCard } from '../index';
import type { CinematicHeroContract, EpisodeDeckContract, SoulCardContract } from '../index';

const hero: CinematicHeroContract = {
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

const season: EpisodeDeckContract = {
  view: 'episode-deck',
  title: 'Episode deck',
  caption: 'Season One · select a chapter to feature it.',
  episodes: [
    {
      id: 'ep01',
      title: 'The Invocation',
      code: 'S01 · EP 01',
      state: 'available',
      synopsis: "A blacksmith's daughter drives the last nail into the last knight.",
    },
    {
      id: 'ep02',
      title: 'The Ninth Gate',
      code: 'S01 · EP 02',
      state: 'available',
      synopsis: 'The gate answers in a voice it should not have.',
    },
    {
      id: 'ep03',
      title: 'Mara Under the Salt',
      code: 'S01 · EP 03',
      state: 'available',
      synopsis: 'The saltwitch counts her borrowed mouths.',
    },
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

const souls: SoulCardContract[] = [
  {
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
      'A witch made from drowned sailors. Every sound she makes is in a different voice. She is searching for the one voice that was hers.',
    quote: '“All of my mouths are borrowed. None of them lie.”',
  },
  {
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
      'Forged in the drowned cathedral of Vaskerholm. He does not remember dying — he remembers the hammer.',
    quote: '“I was made to hold. So I hold.”',
  },
];

function FeaturePlate({ title, code }: { title: string; code: string }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        minHeight: 320,
        background:
          'radial-gradient(120% 110% at 50% 30%, color-mix(in oklab, var(--tcl-status-danger) 24%, var(--tcl-bg)) 0%, var(--tcl-bg) 70%)',
      }}
    >
      <button
        type="button"
        aria-label={`Play ${title}`}
        style={{
          appearance: 'none',
          cursor: 'pointer',
          width: 64,
          height: 64,
          borderRadius: 'var(--tcl-radius-full)',
          border: '1px solid var(--tcl-status-danger)',
          background: 'color-mix(in oklab, var(--tcl-status-danger) 18%, transparent)',
          color: 'var(--tcl-status-danger)',
          fontSize: 'var(--tcl-text-lg)',
        }}
      >
        ▶
      </button>
      <span
        style={{
          position: 'absolute',
          bottom: 'var(--tcl-space-4)',
          left: 'var(--tcl-space-4)',
          fontFamily: 'var(--tcl-font-mono)',
          fontSize: 'var(--tcl-text-xs)',
          letterSpacing: 'var(--tcl-tracking-wide)',
          textTransform: 'uppercase',
          color: 'var(--tcl-text-faint)',
        }}
      >
        {code}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        margin: '0 0 var(--tcl-space-4)',
        fontFamily: 'var(--tcl-font-mono)',
        fontSize: 'var(--tcl-text-xs)',
        letterSpacing: 'var(--tcl-tracking-caps)',
        textTransform: 'uppercase',
        color: 'var(--tcl-text-dim)',
      }}
    >
      {children}
    </p>
  );
}

function SoulSteelSite() {
  const [epId, setEpId] = useState('ep01');
  const ep = season.episodes.find((e) => e.id === epId) ?? season.episodes[0];

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 'var(--tcl-space-7) var(--tcl-space-6)',
        display: 'grid',
        gap: 'var(--tcl-space-8)',
      }}
    >
      <CinematicHero data={hero} />

      <section>
        <SectionLabel>The Signal</SectionLabel>
        <div
          style={{
            display: 'grid',
            gap: 'var(--tcl-space-6)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'start',
          }}
        >
          <Reliquary
            tone="danger"
            label={`NOW SHOWING · ${ep.code}`}
            tag={ep.title.toUpperCase()}
            aria-label={`Now showing: ${ep.title}`}
            status={[
              { label: 'SOUL INTEGRITY — 34.7%', tone: 'danger' },
              { label: 'CONTAINMENT STABLE', tone: 'success' },
            ]}
          >
            <FeaturePlate title={ep.title} code={ep.code ?? ''} />
          </Reliquary>
          <EpisodeDeck data={season} tone="danger" selectedId={epId} onSelect={setEpId} />
        </div>
      </section>

      <section>
        <SectionLabel>The Codex · Bound Souls</SectionLabel>
        <div
          style={{
            display: 'grid',
            gap: 'var(--tcl-space-6)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            alignItems: 'start',
          }}
        >
          {souls.map((s) => (
            <SoulCard key={s.name} data={s} />
          ))}
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: 'Examples/SoulSteel',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The full Soul Steel microsite: hero + a deck-driven feature frame + the soul codex. */
export const Default: Story = {
  render: () => <SoulSteelSite />,
};
