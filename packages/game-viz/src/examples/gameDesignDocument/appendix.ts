// Companion contracts for the Examples/Game Design Document page — the
// "appendix" panels that surround the Brief document spine. Types come from the
// game-viz barrel (which re-exports the ui Timeline shape as ChronicleContract
// and the viz TalentTree shape as ConstellationContract) plus @trembus/ui.
import type { StatProps } from '@trembus/ui';
import type {
  ChronicleContract,
  CinematicHeroContract,
  ConstellationContract,
  EpisodeDeckContract,
  MediaFrameData,
  SoulCardContract,
} from '../../index';

/** Title plate — the document's cover, stamped like an archive folio. */
export const HERO: CinematicHeroContract = {
  view: 'cinematic-hero',
  tone: 'danger',
  kicker: 'GAME DESIGN DOCUMENT · REV III · VASKERHOLM',
  title: [{ text: 'Soul' }, { text: 'Steel', outline: true }],
  tagline:
    'The interactive rite of Vaskerholm: every soul is a nail, every knight a reliquary — and death is not an ending, it is MATERIAL.',
  highlight: 'MATERIAL',
  actions: [
    { label: 'Read the Codex', icon: '◉', variant: 'primary', href: '#' },
    { label: 'Rite of Production', meta: 'roadmap', icon: '▶', variant: 'secondary', href: '#' },
  ],
  accolades: [
    { value: 'REV III', source: 'Ashen Draft' },
    { value: 'M', source: 'Provisional rating' },
    { value: 'MMXXVII', source: 'Target launch' },
  ],
};

/** Playable disciplines — class sheets, not lore cards (cf. Examples/SoulSteel). */
export const SOULS: SoulCardContract[] = [
  {
    index: 'CLASS · I',
    state: 'PLAYABLE',
    stateTone: 'success',
    name: 'The Kept Knight',
    epithet: 'Baseline discipline — Order of the Rusted Cross',
    tone: 'accent',
    stats: [
      { label: 'Role', value: 'Vanguard reliquary' },
      { label: 'Resource', value: 'Containment integrity' },
      { label: 'Weapon', value: 'A single nail' },
      { label: 'Difficulty', value: '★★' },
    ],
    description:
      'The teaching class. Slow, certain, nearly unbreachable — the knight the liturgy assumes when it explains itself.',
    quote: '“I was made to hold. So I hold.”',
  },
  {
    index: 'CLASS · IV',
    state: 'IN FORGE',
    stateTone: 'danger',
    name: 'Mara of the Salt',
    epithet: 'Advanced discipline — Coven of the Cold Coast',
    tone: 'danger',
    stats: [
      { label: 'Role', value: 'Chorus controller' },
      { label: 'Resource', value: 'Borrowed voices' },
      { label: 'Weapon', value: 'Ninety-nine tongues' },
      { label: 'Difficulty', value: '★★★★' },
    ],
    description:
      'The mastery class. Every ability speaks in a different stolen voice; her whole kit is the audio pipeline the slice must prove.',
    quote: '“All of my mouths are borrowed. None of them lie.”',
  },
];

/** Campaign structure — chapter availability tracks the milestone gates. */
export const CHAPTERS: EpisodeDeckContract = {
  view: 'episode-deck',
  title: 'Campaign chapters',
  caption: 'Chapter availability tracks the milestone gates.',
  episodes: [
    {
      id: 'ch01',
      title: 'The Invocation',
      code: 'CH · 01',
      state: 'available',
      synopsis: "A blacksmith's daughter drives the last nail into the last knight.",
    },
    {
      id: 'ch02',
      title: 'The Ninth Gate',
      code: 'CH · 02',
      state: 'available',
      synopsis: 'The gate answers in a voice it should not have.',
    },
    {
      id: 'ch03',
      title: 'Mara Under the Salt',
      code: 'CH · 03',
      state: 'locked',
      releaseAt: 'ALPHA',
    },
    {
      id: 'ch04',
      title: 'All Rites Broken',
      code: 'CH · 04',
      state: 'locked',
      releaseAt: 'BETA',
    },
    {
      id: 'ch05',
      title: 'Ferrum · Anima · Ignis',
      code: 'CH · 05',
      state: 'locked',
      releaseAt: 'GOLD',
    },
  ],
};

/** Production milestones — the Chronicle band (time scale, fractional years). */
export const PRODUCTION: ChronicleContract = {
  view: 'timeline',
  brand: 'SOUL STEEL · PRODUCTION',
  code: 'III',
  title: 'Rite of Production',
  caption: 'Milestones of the forge — from first fire to the open gates.',
  meta: '6 RITES · 18 MONTHS',
  scale: 'time',
  categories: [
    { key: 'build', label: 'Build', tone: 'info' },
    { key: 'content', label: 'Content', tone: 'warning' },
    { key: 'release', label: 'Release', tone: 'danger' },
  ],
  events: [
    {
      id: 'forge-lit',
      at: 2025.75,
      dateLabel: 'Q4 MMXXV',
      label: 'Forge Lit',
      category: 'build',
      sub: 'PROTOTYPE',
      detail: 'First playable rite: one knight, one nail, one corridor.',
    },
    {
      id: 'slice',
      at: 2026.25,
      dateLabel: 'Q2 MMXXVI',
      label: 'Vertical Slice',
      category: 'content',
      sub: 'CHAPTER I',
      detail: 'Chapter I end-to-end at shippable fidelity.',
      note: 'The gate for external showings — nothing leaves the forge before this.',
    },
    {
      id: 'alpha',
      at: 2026.6,
      dateLabel: 'Q3 MMXXVI',
      label: 'Alpha — All Systems Cold',
      category: 'build',
      detail: 'Every system in place; no placeholder rites remaining.',
    },
    {
      id: 'beta',
      at: 2026.95,
      dateLabel: 'Q4 MMXXVI',
      label: 'Beta — Content Sealed',
      category: 'content',
      detail: 'All five chapters locked; only polish passes remain.',
    },
    {
      id: 'gold',
      at: 2027.2,
      dateLabel: 'Q1 MMXXVII',
      label: 'Gold — The Last Nail',
      category: 'release',
      detail: 'Certification build hammered and blessed.',
    },
    {
      id: 'launch',
      at: 2027.4,
      dateLabel: 'Q2 MMXXVII',
      label: 'The Gates Open',
      category: 'release',
      sub: 'LAUNCH',
      detail: 'Vaskerholm admits the congregation.',
    },
  ],
};

/** The player discipline tree — rendered by Constellation (the gothic TalentTree skin). */
export const LITANY: ConstellationContract = {
  brand: 'SOUL STEEL',
  code: 'VIII',
  title: 'Litany of Iron',
  caption: 'The player discipline — eight points of devotion across three orders.',
  points: 8,
  tiers: [{ label: 'Novice' }, { label: 'Adept', gate: 3 }, { label: 'Ordained', gate: 6 }],
  nodes: [
    {
      id: 'nail',
      label: 'Nail of Intent',
      sub: 'Opening rite',
      tier: 0,
      note: 'Strike gains a guaranteed stagger on the first hit of every rite.',
    },
    {
      id: 'hymn',
      label: 'Hymn of Rust',
      sub: 'Sustain',
      tier: 0,
      maxRank: 3,
      note: 'Each rank deepens the corrosion dealt by Bind.',
    },
    {
      id: 'vigil',
      label: 'Cold Vigil',
      sub: 'Defense',
      tier: 1,
      note: 'Holding still recharges containment integrity.',
    },
    {
      id: 'weight',
      label: 'Bearing the Weight',
      sub: 'Momentum',
      tier: 1,
      requires: ['nail'],
      note: 'Carrying a bound soul no longer slows the knight.',
    },
    {
      id: 'voices',
      label: 'Borrowed Voices',
      sub: 'Choir',
      tier: 1,
      requires: [{ id: 'hymn', rank: 2 }],
      note: 'Recant echoes in every voice the soul has ever held.',
    },
    {
      id: 'lastnail',
      label: 'The Last Nail',
      sub: 'Capstone',
      tier: 2,
      cost: 2,
      requires: ['weight', 'voices'],
      note: 'One strike. One soul. One ending.',
    },
  ],
};

/** Enemy roster rows for the census table (threat tone pairs with the word). */
export interface RosterRow {
  foe: string;
  order: string;
  threat: { label: string; tone: 'success' | 'warning' | 'danger' };
  souls: string;
}

export const ROSTER: RosterRow[] = [
  {
    foe: 'Rust Whelp',
    order: 'Broken Congregation',
    threat: { label: 'Low', tone: 'success' },
    souls: 'I–III',
  },
  {
    foe: 'Salt Chorister',
    order: 'Coven of the Cold Coast',
    threat: { label: 'Choir', tone: 'warning' },
    souls: 'IX',
  },
  {
    foe: 'Drowned Vicar',
    order: 'The Sunken Clergy',
    threat: { label: 'Choir', tone: 'warning' },
    souls: 'XII',
  },
  {
    foe: 'The Bellwarden',
    order: 'Gate-class · unique',
    threat: { label: 'Gate-class', tone: 'danger' },
    souls: 'XCIX',
  },
];

/** Headline production stats for the 2×2 glance row. */
export const STATS: StatProps[] = [
  { label: 'Bound souls', value: 214, target: 'Codex target · 300' },
  { label: 'Chapters playable', value: 2, unit: '/ 5' },
  { label: 'Median session', value: 42, unit: 'min' },
  { label: 'Slice budget spent', value: 61, unit: '%', tone: 'warning' },
];

/** Key-art placeholder — the doc plate keeps the repo free of binary assets. */
export const ART: MediaFrameData = {
  medium: 'doc',
  ext: 'md',
  glyph: 'image',
  alt: 'Concept brief — the drowned nave of Vaskerholm, flooded to the triforium',
  tone: 'danger',
};
