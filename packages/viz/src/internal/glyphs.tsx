import type { ComponentType, ReactElement, SVGProps } from 'react';

/**
 * The seed of a future `@trembus/icons` package. Hand-authored, normalized 24×24
 * glyphs used to visually distinguish node kinds / file types in the viz layer.
 *
 * Two vocabularies, two color rules:
 *  - MONOCHROME glyphs paint `currentColor` (the consumer tints them via a token);
 *    they are fully theme-able.
 *  - TYPE / BRAND marks (TS, JS) carry their own brand color, because they're only
 *    recognizable that way. This is a deliberate, narrow exception to "tokens only"
 *    — the marks are decorative (`aria-hidden`), so the text label still does the
 *    accessible work. (Same spirit as a per-node `color` override.)
 *
 * When this graduates to `@trembus/icons`, each becomes a tree-shakeable per-icon
 * module; for now they ride inside the viz bundle (a small fixed set).
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
const Database = (p: GlyphProps): ReactElement => (
  <Svg name="database" {...p}>
    <path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3Z" />
    <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
    <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
  </Svg>
);
const User = (p: GlyphProps): ReactElement => (
  <Svg name="user" {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
  </Svg>
);
const Cloud = (p: GlyphProps): ReactElement => (
  <Svg name="cloud" {...p}>
    <path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9.5a3.5 3.5 0 0 1 .5 8.5Z" />
  </Svg>
);
const Box = (p: GlyphProps): ReactElement => (
  <Svg name="box" {...p}>
    <path d="M12 3 20 7.5v9L12 21 4 16.5v-9Z" />
    <path d="M4 7.5 12 12l8-4.5" />
    <path d="M12 12v9" />
  </Svg>
);
const Component = (p: GlyphProps): ReactElement => (
  <Svg name="component" {...p}>
    <rect x="8" y="5" width="11" height="14" rx="1" />
    <path d="M8 9.5H5M8 14.5H5" />
  </Svg>
);
const Server = (p: GlyphProps): ReactElement => (
  <Svg name="server" {...p}>
    <rect x="4" y="5" width="16" height="6" rx="1.5" />
    <rect x="4" y="13" width="16" height="6" rx="1.5" />
    <path d="M7.5 8h.01M7.5 16h.01" />
  </Svg>
);
const Folder = (p: GlyphProps): ReactElement => (
  <Svg name="folder" {...p}>
    <path d="M4 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
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

// ── more architecture / system kinds (monochrome) ──
const Globe = (p: GlyphProps): ReactElement => (
  <Svg name="globe" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
  </Svg>
);
const Shield = (p: GlyphProps): ReactElement => (
  <Svg name="shield" {...p}>
    <path d="M12 3 5 6v5c0 4.2 2.8 7.6 7 9 4.2-1.4 7-4.8 7-9V6Z" />
  </Svg>
);
const Zap = (p: GlyphProps): ReactElement => (
  <Svg name="zap" {...p}>
    <path d="M13 3 5 13h6l-2 8 8-10h-6Z" />
  </Svg>
);
const Cpu = (p: GlyphProps): ReactElement => (
  <Svg name="cpu" {...p}>
    <rect x="7" y="7" width="10" height="10" rx="1" />
    <rect x="10" y="10" width="4" height="4" />
    <path d="M10 3v2M14 3v2M10 19v2M14 19v2M3 10h2M3 14h2M19 10h2M19 14h2" />
  </Svg>
);
const HardDrive = (p: GlyphProps): ReactElement => (
  <Svg name="harddrive" {...p}>
    <rect x="3" y="12" width="18" height="8" rx="2" />
    <path d="M5.5 12 8 5h8l2.5 7" />
    <path d="M7 16h.01M11 16h.01" />
  </Svg>
);
const Layers = (p: GlyphProps): ReactElement => (
  <Svg name="layers" {...p}>
    <path d="M12 3 3 8l9 5 9-5Z" />
    <path d="M3 12l9 5 9-5" />
    <path d="M3 16l9 5 9-5" />
  </Svg>
);
const Network = (p: GlyphProps): ReactElement => (
  <Svg name="network" {...p}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="12" cy="18" r="2.5" />
    <path d="M7.6 7.6 10.8 15.8M16.4 7.6 13.2 15.8M8.5 6h7" />
  </Svg>
);
const Queue = (p: GlyphProps): ReactElement => (
  <Svg name="queue" {...p}>
    <rect x="3" y="5" width="18" height="4" rx="1" />
    <rect x="3" y="11" width="18" height="4" rx="1" />
    <rect x="3" y="17" width="18" height="2.5" rx="1" />
  </Svg>
);

// ── more file types ──
const Markdown = (p: GlyphProps): ReactElement => (
  <Svg name="markdown" {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M6 15V9l3 3 3-3v6" />
    <path d="M17 9v4.5M17 13.5l-2-2M17 13.5l2-2" />
  </Svg>
);
const Terminal = (p: GlyphProps): ReactElement => (
  <Svg name="terminal" {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 9.5 10 12.5 7 15.5M12.5 15.5H16" />
  </Svg>
);
const Image = (p: GlyphProps): ReactElement => (
  <Svg name="image" {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M21 16.5 15.5 11 5 20.5" />
  </Svg>
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

// ── core UI affordances (monochrome) ──
const ChevronRight = (p: GlyphProps): ReactElement => (
  <Svg name="chevron-right" {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
const ChevronDown = (p: GlyphProps): ReactElement => (
  <Svg name="chevron-down" {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);
const Close = (p: GlyphProps): ReactElement => (
  <Svg name="close" {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
const Check = (p: GlyphProps): ReactElement => (
  <Svg name="check" {...p}>
    <path d="M5 12.5 9.5 17 19 6.5" />
  </Svg>
);
const Search = (p: GlyphProps): ReactElement => (
  <Svg name="search" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
);
const ExternalLink = (p: GlyphProps): ReactElement => (
  <Svg name="external-link" {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M19 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);
const Info = (p: GlyphProps): ReactElement => (
  <Svg name="info" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 7.5h.01" />
  </Svg>
);
const Warning = (p: GlyphProps): ReactElement => (
  <Svg name="warning" {...p}>
    <path d="M12 4 2.5 20h19Z" />
    <path d="M12 10v4" />
    <path d="M12 17.5h.01" />
  </Svg>
);

export const GLYPHS: Record<string, ComponentType<GlyphProps>> = {
  // node kinds
  database: Database,
  user: User,
  cloud: Cloud,
  box: Box,
  component: Component,
  server: Server,
  globe: Globe,
  shield: Shield,
  zap: Zap,
  cpu: Cpu,
  harddrive: HardDrive,
  layers: Layers,
  network: Network,
  queue: Queue,
  // file types
  folder: Folder,
  file: File,
  json: Json,
  markdown: Markdown,
  terminal: Terminal,
  image: Image,
  typescript: TypeScript,
  javascript: JavaScript,
  react: ReactMark,
  css: Css,
  html: Html,
  // UI affordances
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  close: Close,
  check: Check,
  search: Search,
  'external-link': ExternalLink,
  info: Info,
  warning: Warning,
};

/** All glyph names that resolve (useful for validation / story controls). */
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

/** Default kind → glyph map for SystemMap node kinds (override per-node with `icon`). */
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
