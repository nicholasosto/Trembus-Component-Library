// The Soul Steel GAME DESIGN DOCUMENT as a Brief contract — the document spine
// of the Examples/Game Design Document page. Exercises every section kind:
// prose · rules · boundaries · decisions · reference · phases · checklist ·
// artifacts · commands.
import type { BriefContract } from '@trembus/ui';

/** Reference matter starts collapsed; the narrative sections stay open. */
export const COLLAPSED_SECTIONS = ['systems', 'artifacts', 'commands'];

export const GDD: BriefContract = {
  view: 'brief',
  kind: 'spec',
  id: 'gdd.soul-steel',
  title: 'Soul Steel — Game Design Document',
  summary:
    'The interactive rite of the Vaskerholm liturgy: an action-liturgy in which every soul is a nail, every knight is a reliquary, and death is a crafting material.',
  meta: [
    { label: 'Version', value: 'REV III · Ashen Draft' },
    { label: 'Status', value: 'In revision' },
    { label: 'Lead', value: 'N. Osto' },
    { label: 'Target', value: 'PC · Console' },
    { label: 'Rating', value: 'M · provisional', tone: '#b4242c' },
  ],
  sections: [
    {
      id: 'concept',
      heading: 'High concept',
      kind: 'prose',
      body:
        'You are a Reliquary Knight: a suit of consecrated steel that holds a dead soul, sent down into the drowned cathedral of Vaskerholm to re-nail what has come loose. Souls are ammunition, currency, and confession — every one you bind makes you stronger and the cathedral angrier.\n\n' +
        'The cathedral floods one bell further with each chapter. The player does not outrun the water; they learn to work in it. Horror comes from reverence — the game never asks you to desecrate, only to finish the rite.',
    },
    {
      id: 'pillars',
      heading: 'Design pillars',
      kind: 'rules',
      items: [
        {
          text: 'Every death is material.',
          desc: 'defeat feeds the forge — a lost fight still yields souls, so failure teaches instead of taxing',
        },
        {
          text: 'The liturgy is the tutorial.',
          desc: 'mechanics are taught as rites in fiction; no toast popups, no yellow paint',
        },
        {
          text: 'Steel remembers.',
          desc: 'permanent consequence lives on the armor — visible dents, bound-soul voices, corroded sigils',
        },
        {
          text: 'Horror through reverence, never gore-first.',
          desc: 'dread is built from ritual, scale, and sound; the camera never lingers on viscera',
        },
      ],
    },
    {
      id: 'nongoals',
      heading: 'Non-goals',
      kind: 'boundaries',
      items: [
        {
          text: 'No open world.',
          desc: 'Vaskerholm is a megastructure, not a map — density over acreage',
        },
        {
          text: 'No multiplayer at launch.',
          severity: 'warn',
          desc: 'the containment fantasy is single-voice; co-op waits for a post-launch rite',
        },
        {
          text: 'No procedural souls.',
          severity: 'danger',
          desc: 'every soul is authored — the Codex is canon, and generation would dilute it',
        },
      ],
    },
    {
      id: 'rulings',
      heading: 'Codex rulings',
      kind: 'decisions',
      items: [
        {
          text: 'Camera',
          choice: 'Locked third-person; no FOV slider in the slice',
          status: 'ratified',
        },
        {
          text: 'Combat verb set',
          choice: 'Three rites — Strike, Bind, Recant',
          status: 'ratified',
        },
        {
          text: 'Death economy',
          choice: 'Souls persist, steel corrodes',
          status: 'contested',
        },
      ],
    },
    {
      id: 'systems',
      heading: 'Core systems',
      kind: 'reference',
      items: [
        {
          text: 'Soulforging',
          desc: 'bind → temper → set; the crafting loop that turns the fallen into gear',
          ref: 'docs/systems/soulforging.md',
        },
        {
          text: 'Litany combat',
          desc: 'the Strike/Bind/Recant triangle and the Litany of Iron discipline tree (appendix)',
          ref: 'docs/systems/litany.md',
        },
        {
          text: 'Containment integrity',
          desc: 'the health analogue — a reliquary does not die, it breaches',
          ref: 'docs/systems/reliquary.md',
        },
      ],
    },
    {
      id: 'phases',
      heading: 'Rite of production',
      kind: 'phases',
      items: [
        { text: 'Forge Lit — first playable rite', status: 'done' },
        { text: 'Vertical Slice — Chapter I end-to-end', status: 'active' },
        { text: 'Alpha — all systems cold', status: 'pending' },
        { text: 'Gold — the last nail', status: 'pending' },
      ],
    },
    {
      id: 'slice',
      heading: 'Vertical slice scope',
      kind: 'checklist',
      items: [
        {
          text: 'Chapter I playable end-to-end',
          severity: 'info',
          status: 'in forge',
          desc: 'Invocation through the first bell-flood',
        },
        {
          text: 'Kept Knight class complete',
          severity: 'info',
          status: 'in forge',
        },
        {
          text: 'Mara boss encounter',
          severity: 'warn',
          desc: 'the 99-voice audio pipeline is unproven at scale',
        },
        {
          text: 'Save/load of the soul inventory',
          severity: 'danger',
          desc: 'corruption rate in the nightly sims is still above threshold',
        },
      ],
    },
    {
      id: 'artifacts',
      heading: 'Deliverables',
      kind: 'artifacts',
      items: [
        {
          text: 'Kept Knight hero model',
          desc: 'rigged, with corrosion morphs',
          ref: 'assets/models/KeptKnight.glb',
        },
        {
          text: 'Mara choir stems',
          desc: 'ninety-nine voice layers, one per borrowed mouth',
          ref: 'assets/audio/mara_choir_stems/',
        },
        {
          text: 'Drowned nave art brief',
          desc: 'the flooded triforium key art (appendix plate)',
          ref: 'docs/art/vaskerholm_nave.md',
        },
      ],
    },
    {
      id: 'commands',
      heading: 'Build & rites',
      kind: 'commands',
      items: [
        { text: 'pnpm dev', desc: 'run the sanctum build with hot reload' },
        { text: 'pnpm forge:assets', desc: 'bake soul manifests and reliquary LODs' },
        { text: 'pnpm rite:test', desc: 'the full gate — combat sims plus containment fuzzing' },
      ],
    },
  ],
};
