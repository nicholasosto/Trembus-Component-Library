// Mock data for the Examples/Package Dossier story — a small roblox-ts monorepo
// (roblox-packages-mono) with a real dependency chain: logger ← audio ← pets.
// NOT a library component; typed inline. The `PackageDossier` shape is the
// authoring contract; `toBrief.ts` adapts the API fields into a Brief document.

export type PkgStatus = 'stable' | 'beta' | 'planned';
export type Stability = 'stable' | 'beta' | 'new' | 'deprecated';
export type ConsumerKind = 'package' | 'game';

/** One exported symbol — a type, interface, or function. */
export interface ApiMember {
  name: string;
  /** One-line purpose. */
  gloss: string;
  /** Signature / definition / member list — rendered as a mono chip. */
  signature?: string;
  stability?: Stability;
}

export interface Convention {
  text: string;
  desc?: string;
  severity?: 'info' | 'warn' | 'danger';
}

export interface PeerDep {
  name: string;
  range: string;
  required?: boolean;
}

export interface Consumer {
  name: string;
  kind: ConsumerKind;
}

export interface SetupStep {
  command: string;
  note?: string;
}

export interface PackageDossier {
  id: string;
  /** Scoped package name, e.g. "@trembus/logger". */
  name: string;
  /** In-repo directory, e.g. "packages/logger". */
  path: string;
  monorepo: string;
  version: string;
  status: PkgStatus;
  /** "Foundation" | "Feature" | … — the architectural layer. */
  tier: string;
  built: boolean;
  /** Human absolute date, e.g. "Jul 15, 2026". */
  updated: string;
  /** Relative label, e.g. "4 days ago". */
  updatedRel: string;
  summary: string;
  /** In-repo packages this one depends on (bare names). */
  internalDeps: string[];
  peerDeps: PeerDep[];
  consumers: Consumer[];
  setup: SetupStep[];
  types: ApiMember[];
  interfaces: ApiMember[];
  functions: ApiMember[];
  conventions: Convention[];
}

/** Count of exported symbols — the "Public API" headline stat. */
export function apiSize(pkg: PackageDossier): number {
  return pkg.types.length + pkg.interfaces.length + pkg.functions.length;
}

const logger: PackageDossier = {
  id: 'logger',
  name: '@trembus/logger',
  path: 'packages/logger',
  monorepo: 'roblox-packages-mono',
  version: '0.1.0',
  status: 'stable',
  tier: 'Foundation',
  built: true,
  updated: 'Jul 15, 2026',
  updatedRel: '4 days ago',
  summary: 'Structured, tag-based logging for roblox-ts games.',
  internalDeps: [],
  peerDeps: [{ name: '@rbxts/services', range: '^1.5.0', required: true }],
  consumers: [
    { name: 'audio', kind: 'package' },
    { name: 'pets-and-mounts', kind: 'package' },
    { name: 'roblox-testing-environment', kind: 'game' },
    { name: 'soul-steel-official', kind: 'game' },
  ],
  setup: [
    { command: 'pnpm add @trembus/logger', note: 'Foundation package — the only peer is @rbxts/services.' },
    { command: 'import { createLogger } from "@trembus/logger"', note: 'Tree-shakeable named exports.' },
    { command: 'const log = createLogger({ tag: "combat" })', note: 'One logger per system; child() for sub-tags.' },
  ],
  types: [
    {
      name: 'LogLevel',
      gloss: 'Severity ladder, ordered low to high.',
      signature: '"trace" | "debug" | "info" | "warn" | "error" | "fatal"',
      stability: 'stable',
    },
    {
      name: 'LogTag',
      gloss: 'A dotted namespace that scopes every entry.',
      signature: 'string & { readonly __tag: unique symbol }',
      stability: 'stable',
    },
    {
      name: 'LogSink',
      gloss: 'A destination that receives finished entries.',
      signature: '(entry: LogEntry) => void',
      stability: 'stable',
    },
  ],
  interfaces: [
    {
      name: 'Logger',
      gloss: 'The handle you log through.',
      signature: 'info · warn · error · debug · child(tag) · withFields(fields)',
      stability: 'stable',
    },
    {
      name: 'LoggerConfig',
      gloss: 'Options passed to createLogger.',
      signature: 'minLevel? · sinks? · tag? · redact?',
      stability: 'stable',
    },
    {
      name: 'LogEntry',
      gloss: 'One structured record before it reaches a sink.',
      signature: 'level · tag · message · timestamp · fields?',
      stability: 'stable',
    },
  ],
  functions: [
    {
      name: 'createLogger',
      gloss: 'Create a root logger for a system.',
      signature: '(config?: LoggerConfig) => Logger',
      stability: 'stable',
    },
    {
      name: 'setDefaultSink',
      gloss: 'Install the sink every logger falls back to.',
      signature: '(sink: LogSink) => void',
      stability: 'stable',
    },
    {
      name: 'parseTag',
      gloss: 'Validate and brand a raw tag string.',
      signature: '(raw: string) => LogTag',
      stability: 'new',
    },
  ],
  conventions: [
    { text: 'Tags are dotted namespaces — combat.hit, not CombatHit.', severity: 'info' },
    {
      text: 'createLogger allocates.',
      desc: 'make one per system and child() from it, do not create per call-site',
      severity: 'warn',
    },
    {
      text: 'Never log secrets.',
      desc: 'list keys in redact to strip them from fields before they hit a sink',
      severity: 'danger',
    },
  ],
};

const audio: PackageDossier = {
  id: 'audio',
  name: '@trembus/audio',
  path: 'packages/audio',
  monorepo: 'roblox-packages-mono',
  version: '0.3.1',
  status: 'stable',
  tier: 'Feature',
  built: true,
  updated: 'Jul 10, 2026',
  updatedRel: '9 days ago',
  summary: 'Pooled SoundService playback with ducking and 3D emitters.',
  internalDeps: ['logger'],
  peerDeps: [{ name: '@rbxts/services', range: '^1.5.0', required: true }],
  consumers: [
    { name: 'pets-and-mounts', kind: 'package' },
    { name: 'soul-steel-official', kind: 'game' },
  ],
  setup: [
    { command: 'pnpm add @trembus/audio', note: 'Pulls @trembus/logger transitively.' },
    { command: 'import { createBus } from "@trembus/audio"' },
    { command: 'const sfx = createBus({ duck: "sfx" })', note: 'One bus per category, not one per sound.' },
  ],
  types: [
    {
      name: 'SoundId',
      gloss: 'An asset id or alias registered with the bus.',
      signature: 'string & { readonly __sound: unique symbol }',
      stability: 'stable',
    },
    {
      name: 'DuckProfile',
      gloss: 'How other buses attenuate while this one plays.',
      signature: '"none" | "sfx" | "music" | "all"',
      stability: 'stable',
    },
  ],
  interfaces: [
    {
      name: 'AudioBus',
      gloss: 'A named channel you play through.',
      signature: 'play(id) · stop(handle) · duck(profile) · setVolume(v)',
      stability: 'stable',
    },
    {
      name: 'EmitterConfig',
      gloss: '3D emitter placement and rolloff.',
      signature: 'part · rolloff? · maxDistance? · loop?',
      stability: 'stable',
    },
    {
      name: 'PlayHandle',
      gloss: 'A live sound you can stop or fade.',
      signature: 'stop() · fade(to, secs) · id',
      stability: 'stable',
    },
  ],
  functions: [
    {
      name: 'createBus',
      gloss: 'Make a mixer channel with a volume and duck profile.',
      signature: '(config?: BusConfig) => AudioBus',
      stability: 'stable',
    },
    {
      name: 'preload',
      gloss: 'Warm the sound pool before a scene.',
      signature: '(ids: SoundId[]) => Promise<void>',
      stability: 'stable',
    },
  ],
  conventions: [
    { text: 'Reuse one bus per category (sfx / music / ui), not one per sound.', severity: 'info' },
    {
      text: 'preload() before a cutscene.',
      desc: 'the first play() of a cold asset otherwise stalls a frame',
      severity: 'warn',
    },
  ],
};

const pets: PackageDossier = {
  id: 'pets-and-mounts',
  name: '@trembus/pets-and-mounts',
  path: 'packages/pets-and-mounts',
  monorepo: 'roblox-packages-mono',
  version: '0.2.0',
  status: 'beta',
  tier: 'Feature',
  built: true,
  updated: 'Jul 18, 2026',
  updatedRel: '1 day ago',
  summary: 'Companion and mount entities with follow AI and equip slots.',
  internalDeps: ['logger', 'audio'],
  peerDeps: [
    { name: '@rbxts/services', range: '^1.5.0', required: true },
    { name: '@flamework/components', range: '^1.0.0', required: true },
  ],
  consumers: [{ name: 'soul-steel-official', kind: 'game' }],
  setup: [
    { command: 'pnpm add @trembus/pets-and-mounts', note: 'Depends on logger + audio.' },
    { command: 'import { spawnCompanion } from "@trembus/pets-and-mounts"' },
  ],
  types: [
    {
      name: 'PetId',
      gloss: 'A stable id for a companion definition.',
      signature: 'string & { readonly __pet: unique symbol }',
      stability: 'stable',
    },
    {
      name: 'Gait',
      gloss: 'How a mount moves the player.',
      signature: '"walk" | "run" | "fly" | "swim"',
      stability: 'beta',
    },
  ],
  interfaces: [
    {
      name: 'Companion',
      gloss: 'A spawned follower bound to a player.',
      signature: 'follow(target) · despawn() · setMood(m)',
      stability: 'beta',
    },
    {
      name: 'MountController',
      gloss: "Drives a mounted player's movement.",
      signature: 'mount(player) · dismount() · setGait(g)',
      stability: 'beta',
    },
    {
      name: 'EquipSlot',
      gloss: 'A cosmetic attachment point on a pet.',
      signature: 'name · attachment · occupiedBy?',
      stability: 'stable',
    },
  ],
  functions: [
    {
      name: 'spawnCompanion',
      gloss: 'Spawn a companion for a player.',
      signature: '(player: Player, pet: PetId) => Companion',
      stability: 'beta',
    },
    {
      name: 'mount',
      gloss: 'Put a player on a mount entity.',
      signature: '(player: Player, mount: PetId) => MountController',
      stability: 'beta',
    },
    { name: 'dismount', gloss: 'Return a player to foot.', signature: '(player: Player) => void', stability: 'stable' },
  ],
  conventions: [
    {
      text: 'Beta — signatures may change before 1.0.',
      desc: 'pin an exact version in consuming games',
      severity: 'warn',
    },
    { text: 'Despawn companions when a player leaves to avoid orphaned parts.', severity: 'info' },
    {
      text: 'Never mount during a seat weld.',
      desc: 'dismount first or the character rig breaks',
      severity: 'danger',
    },
  ],
};

export const PACKAGES: PackageDossier[] = [logger, audio, pets];
