import type { ComponentType, ReactElement, SVGProps } from 'react';

/**
 * A focused subset of the viz glyph set, mirrored here because `@trembus/ui`
 * cannot depend on `@trembus/viz` (they are siblings, both on `@trembus/tokens`).
 * Source of truth — for now — is `packages/viz/src/internal/glyphs.tsx`; when the
 * planned standalone `@trembus/icons` package ships, both packages migrate to it
 * and this file (and viz's) collapse into per-icon modules.
 *
 * Two vocabularies, two color rules (same as viz):
 *  - MONOCHROME glyphs paint `currentColor` (the consumer tints them via a token);
 *    fully theme-able.
 *  - TYPE / BRAND marks (TS, JS, React, CSS, HTML) carry their own brand color —
 *    they're only recognizable that way. A deliberate, narrow exception to
 *    "tokens only": the marks are decorative (`aria-hidden`), so the adjacent text
 *    label still does the accessible work.
 */

type GlyphProps = SVGProps<SVGSVGElement>;

function Svg({ name, children, ...rest }: GlyphProps & { name: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-glyph={name}
      {...rest}
    >
      {children}
    </svg>
  );
}

// ── monochrome (currentColor) ──
const Folder = (p: GlyphProps): ReactElement => (
  <Svg name="folder" {...p}>
    <path d="M4 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
  </Svg>
);
const FolderOpen = (p: GlyphProps): ReactElement => (
  <Svg name="folder-open" {...p}>
    <path d="M4 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v2H4Z" />
    <path d="M4 10h16l-2 7a1 1 0 0 1-1 .9H5a1 1 0 0 1-1-1Z" />
  </Svg>
);
const File = (p: GlyphProps): ReactElement => (
  <Svg name="file" {...p}>
    <path d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
  </Svg>
);
const Json = (p: GlyphProps): ReactElement => (
  <Svg name="json" {...p}>
    <path d="M9 4a3 3 0 0 0-3 3v2a2 2 0 0 1-2 2 2 2 0 0 1 2 2v2a3 3 0 0 0 3 3" />
    <path d="M15 4a3 3 0 0 1 3 3v2a2 2 0 0 0 2 2 2 2 0 0 0-2 2v2a3 3 0 0 1-3 3" />
  </Svg>
);
const Markdown = (p: GlyphProps): ReactElement => (
  <Svg name="markdown" {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M6 15V9l3 3 3-3v6" />
    <path d="M17 9v4.5M17 13.5l-2-2M17 13.5l2-2" />
  </Svg>
);
const Search = (p: GlyphProps): ReactElement => (
  <Svg name="search" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
);
const ChevronRight = (p: GlyphProps): ReactElement => (
  <Svg name="chevron-right" {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

// ── type / brand marks (own brand color — recognizable only this way) ──
const TypeScript = (p: GlyphProps): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
    data-glyph="typescript"
    {...p}
  >
    <rect width="24" height="24" rx="3" fill="#3178c6" />
    <text
      x="12.5"
      y="16.5"
      textAnchor="middle"
      fontFamily="ui-monospace, monospace"
      fontSize="9"
      fontWeight="700"
      fill="#ffffff"
    >
      TS
    </text>
  </svg>
);
const JavaScript = (p: GlyphProps): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
    data-glyph="javascript"
    {...p}
  >
    <rect width="24" height="24" rx="3" fill="#f7df1e" />
    <text
      x="12.5"
      y="16.5"
      textAnchor="middle"
      fontFamily="ui-monospace, monospace"
      fontSize="9"
      fontWeight="700"
      fill="#11110a"
    >
      JS
    </text>
  </svg>
);
const ReactMark = (p: GlyphProps): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
    data-glyph="react"
    {...p}
  >
    <circle cx="12" cy="12" r="1.8" fill="#61dafb" />
    <g fill="none" stroke="#61dafb" strokeWidth="1.1">
      <ellipse cx="12" cy="12" rx="9.5" ry="3.7" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(120 12 12)" />
    </g>
  </svg>
);
const Css = (p: GlyphProps): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
    data-glyph="css"
    {...p}
  >
    <rect width="24" height="24" rx="3" fill="#2965f1" />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontFamily="ui-monospace, monospace"
      fontSize="8"
      fontWeight="700"
      fill="#ffffff"
    >
      CSS
    </text>
  </svg>
);
const Html = (p: GlyphProps): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
    data-glyph="html"
    {...p}
  >
    <rect width="24" height="24" rx="3" fill="#e34f26" />
    <text
      x="12"
      y="16.5"
      textAnchor="middle"
      fontFamily="ui-monospace, monospace"
      fontSize="9"
      fontWeight="700"
      fill="#ffffff"
    >
      {'</>'}
    </text>
  </svg>
);

export const GLYPHS: Record<string, ComponentType<GlyphProps>> = {
  folder: Folder,
  'folder-open': FolderOpen,
  file: File,
  json: Json,
  markdown: Markdown,
  search: Search,
  'chevron-right': ChevronRight,
  typescript: TypeScript,
  javascript: JavaScript,
  react: ReactMark,
  css: Css,
  html: Html,
};

/** All glyph names that resolve here (useful for validation / story controls). */
export type GlyphName = keyof typeof GLYPHS;

/** Render a glyph by name; unknown names render nothing (safe to call eagerly). */
export function Glyph({
  name,
  className,
}: {
  name: string;
  className?: string;
}): ReactElement | null {
  const C = GLYPHS[name];
  return C ? <C className={className} /> : null;
}

/** file extension → glyph name; everything unmapped falls back to the generic file. */
const EXT_GLYPH: Record<string, string> = {
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
