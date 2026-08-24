import type { FolderNode } from '@trembus/ui';

/** The Badge tones this demo uses (a subset of the library's tone ontology). */
type Tone = 'warning' | 'info' | 'success' | 'neutral';

/** The _inbox room, as a @trembus/ui FolderTree forest. Glyphs infer from filename. */
export const ROOM: FolderNode[] = [
  {
    id: 'inbox',
    label: '_inbox/',
    kind: 'folder',
    children: [
      {
        id: 'misc',
        label: 'misc/',
        kind: 'folder',
        children: [
          { id: 'hero', label: 'hero_shot.png' },
          { id: 'banner', label: 'banner_v2.png' },
          { id: 'roster', label: 'roster.csv' },
        ],
      },
      {
        id: 'downloads',
        label: 'downloads/',
        kind: 'folder',
        children: [
          { id: 'sword', label: 'sword_icon.png' },
          { id: 'stats', label: 'stats_export.xlsx' },
          { id: 'effigy', label: 'Effigy_blood.rbxm' },
        ],
      },
      {
        id: 'notes',
        label: 'notes/',
        kind: 'folder',
        children: [
          { id: 'idea', label: 'idea.md' },
          { id: 'claude', label: 'CLAUDE.md' },
        ],
      },
      { id: 'stray', label: 'stray_photo.PNG' },
      { id: 'config', label: 'config.yaml' },
    ],
  },
];

export type FileStatus = 'misplaced' | 'nolaw' | 'inplace';

export interface FileVerdict {
  status: FileStatus;
  note: string;
}

/** What the Maid found for each file id (content-verdicts, keyed by FolderNode id). */
export const VERDICTS: Record<string, FileVerdict> = {
  hero: { status: 'misplaced', note: 'wrong door — belongs in image/promo/' },
  banner: { status: 'misplaced', note: 'wrong door — belongs in image/promo/' },
  roster: { status: 'nolaw', note: 'shape tabular/roster — no law governs it yet' },
  sword: { status: 'misplaced', note: 'wrong door — belongs in image/icon/' },
  stats: { status: 'nolaw', note: 'shape tabular/export — no law governs it yet' },
  effigy: { status: 'misplaced', note: 'belongs in 3d/blood/' },
  idea: { status: 'inplace', note: 'already lawful' },
  claude: { status: 'inplace', note: 'already lawful' },
  stray: { status: 'misplaced', note: 'wrong door — belongs in image/' },
  config: { status: 'misplaced', note: 'belongs in _tools/' },
};

export const STATUS_LABEL: Record<FileStatus, string> = {
  misplaced: 'Misplaced',
  nolaw: 'No law yet',
  inplace: 'In place',
};

export const STATUS_TONE: Record<FileStatus, Tone> = {
  misplaced: 'warning',
  nolaw: 'info',
  inplace: 'success',
};

/** The six Deep Clean steps (the process the mockup and the Stepper both show). */
export interface CleanStep {
  label: string;
  running: string;
  done: string;
}

export const STEPS: CleanStep[] = [
  { label: 'Reviewing files by type category', running: 'reading file types…', done: '24 files typed' },
  {
    label: 'Identifying & moving exact duplicates',
    running: 'hashing contents…',
    done: '3 duplicates found',
  },
  { label: 'Reviewing contents', running: 'reading each file…', done: '24 files read' },
  {
    label: 'Contextually organizing',
    running: 'grouping by inferred purpose…',
    done: 'grouped into 4 homes',
  },
  {
    label: 'Identifying redundant information within files',
    running: 'scanning for redundancy…',
    done: 'checked',
  },
  { label: 'Drafting final reorg plan', running: 'drafting the plan…', done: 'plan ready' },
];

/** The Law Library rows (Laws route). */
export interface LawRow {
  id: string;
  name: string;
  match: string;
  door: string;
  governs: number;
  fresh?: boolean;
}

export const LAWS: LawRow[] = [
  { id: 'roster', name: 'Roster tables', match: '.csv · tabular/roster', door: 'data/rosters/', governs: 1, fresh: true },
  { id: 'image', name: 'Image door', match: '.png .jpg .webp · image', door: 'image/', governs: 48 },
  { id: 'model', name: '3D model door', match: '.rbxm .fbx · model', door: '3d/', governs: 22 },
  { id: 'tools', name: 'Tool config', match: '.yaml .ini .toml · config', door: '_tools/', governs: 9 },
  { id: 'audio', name: 'Audio door', match: '.wav .mp3 .ogg · audio', door: 'audio/', governs: 31 },
  { id: 'video', name: 'Video door', match: '.mp4 .mov · video', door: 'video/', governs: 12 },
  { id: 'docs', name: 'Document door', match: '.md .txt .pdf · doc', door: '_catalog/', governs: 41 },
];
