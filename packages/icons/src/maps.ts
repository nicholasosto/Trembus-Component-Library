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
};

/** Infer a file-type glyph from a filename's extension (e.g. "Button.tsx" → "typescript"). */
export function extToGlyph(label: string): string {
  const dot = label.lastIndexOf('.');
  if (dot <= 0 || dot === label.length - 1) return 'file';
  return EXT_GLYPH[label.slice(dot + 1).toLowerCase()] ?? 'file';
}
