/**
 * Default name→name maps that pair a domain concept with a glyph. They hold only
 * strings (no component references), so importing a map pulls no glyph code.
 */

/** Default C4 / SystemMap node-kind → glyph-name map (override per node with `icon`). */
export const SYSTEM_KIND_GLYPH: Record<string, string> = {
  system: 'server',
  container: 'box',
  component: 'component',
  actor: 'user',
  datastore: 'database',
  external: 'cloud',
  service: 'layers',
  gateway: 'globe',
  function: 'cpu',
  cache: 'zap',
  storage: 'harddrive',
  queue: 'queue',
  security: 'shield',
};

/**
 * The five command-center output categories → a representative glyph. A human+AI
 * workflow step emits files or messages; these are the top-level buckets they sort
 * into (category chips, filter bars, legend headers).
 */
export const OUTPUT_CATEGORY_GLYPH: Record<string, string> = {
  tools: 'wrench',
  application: 'box',
  media: 'image',
  configuration: 'sliders',
  context: 'brain',
};

/**
 * Workflow-output kind → glyph — the granular vocabulary under
 * `OUTPUT_CATEGORY_GLYPH`. Kinds describe what an emitted artifact IS (a scheduled
 * job, a game module, an engram…); pair the base glyph with a `PROVENANCE_GLYPH`
 * mark to say who produced it.
 */
export const OUTPUT_KIND_GLYPH: Record<string, string> = {
  // code — tools (self-contained runnables)
  tool: 'wrench',
  script: 'terminal',
  job: 'clock',
  // application files
  module: 'box',
  library: 'layers',
  controller: 'gear',
  utility: 'component',
  game: 'gamepad',
  // media
  audio: 'waveform',
  image: 'image',
  video: 'video',
  model: 'model-3d',
  // configuration
  config: 'sliders',
  data: 'json',
  secret: 'key',
  // context (the AI-native bucket)
  engram: 'brain',
  memory: 'brain',
  skill: 'book',
  doc: 'markdown',
  agent: 'robot',
  prompt: 'message',
  message: 'message',
};

/**
 * Who produced an output — a human, an AI, or the two conjoined (the overlapping
 * `venn` mark). Render it as a small badge beside the kind glyph, always paired
 * with a text label (the mark alone is decorative).
 */
export const PROVENANCE_GLYPH: Record<string, string> = {
  human: 'user',
  ai: 'robot',
  conjoined: 'venn',
};

/** file extension → glyph name; everything unmapped falls back to the generic file. */
export const EXT_GLYPH: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'react',
  json: 'json',
  md: 'markdown',
  mdx: 'markdown',
  css: 'css',
  scss: 'css',
  sass: 'css',
  less: 'css',
  html: 'html',
  htm: 'html',
  // structured data / config
  yml: 'json',
  yaml: 'json',
  toml: 'json',
  ini: 'sliders',
  cfg: 'sliders',
  conf: 'sliders',
  pem: 'key',
  // shell / runnable scripts
  sh: 'terminal',
  bash: 'terminal',
  zsh: 'terminal',
  ps1: 'terminal',
  bat: 'terminal',
  cmd: 'terminal',
  // media — visual
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  avif: 'image',
  svg: 'image',
  ico: 'image',
  bmp: 'image',
  // media — audio
  mp3: 'waveform',
  wav: 'waveform',
  ogg: 'waveform',
  m4a: 'waveform',
  flac: 'waveform',
  aac: 'waveform',
  // media — video
  mp4: 'video',
  mov: 'video',
  webm: 'video',
  mkv: 'video',
  avi: 'video',
  // media — 3D models
  glb: 'model-3d',
  gltf: 'model-3d',
  fbx: 'model-3d',
  obj: 'model-3d',
  stl: 'model-3d',
  blend: 'model-3d',
  usdz: 'model-3d',
  rbxm: 'model-3d',
  rbxmx: 'model-3d',
};

/** Infer a file-type glyph from a filename's extension (e.g. "Button.tsx" → "typescript"). */
export function extToGlyph(label: string): string {
  const dot = label.lastIndexOf('.');
  if (dot <= 0 || dot === label.length - 1) return 'file';
  return EXT_GLYPH[label.slice(dot + 1).toLowerCase()] ?? 'file';
}

/**
 * Case-insensitive well-known basenames whose ROLE beats their extension — the
 * files an AI+human command center should recognize on sight (a skill is a book,
 * an agent charter is a robot, an env file is a key…).
 */
export const WELL_KNOWN_FILE_GLYPH: Record<string, string> = {
  'skill.md': 'book',
  'readme.md': 'book',
  'claude.md': 'robot',
  'agents.md': 'robot',
  'memory.md': 'brain',
  'package.json': 'box',
  dockerfile: 'box',
  makefile: 'terminal',
  '.env': 'key',
};

/**
 * Infer a glyph from a full filename: well-known basenames first (`SKILL.md` →
 * book, `.env.local` → key), then the extension via `extToGlyph`. Prefer this over
 * bare `extToGlyph` in file trees.
 */
export function fileToGlyph(label: string): string {
  const base = label.toLowerCase();
  // Own-property check — names arrive from consumer data, junk must not resolve
  // up the prototype chain.
  if (Object.hasOwn(WELL_KNOWN_FILE_GLYPH, base)) return WELL_KNOWN_FILE_GLYPH[base];
  if (base.startsWith('.env.')) return 'key';
  return extToGlyph(label);
}
