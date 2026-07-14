import type { ComponentType, ReactElement } from 'react';
import type { GlyphProps } from './icons/Svg';
import {
  DatabaseIcon,
  UserIcon,
  CloudIcon,
  BoxIcon,
  ComponentIcon,
  ServerIcon,
  GlobeIcon,
  ShieldIcon,
  ZapIcon,
  CpuIcon,
  HardDriveIcon,
  LayersIcon,
  NetworkIcon,
  QueueIcon,
  WrenchIcon,
  SparkleIcon,
  RobotIcon,
  FolderIcon,
  FolderOpenIcon,
  FileIcon,
  JsonIcon,
  MarkdownIcon,
  TerminalIcon,
  ImageIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CloseIcon,
  CheckIcon,
  SearchIcon,
  ExternalLinkIcon,
  InfoIcon,
  WarningIcon,
} from './icons/monochrome';
import { TypeScriptIcon, JavaScriptIcon, ReactIcon, CssIcon, HtmlIcon } from './icons/brand';

/**
 * Every glyph keyed by its stable string name — the render-by-name path for
 * consumers whose glyph name is dynamic (a file extension, a node kind). Importing
 * `GLYPHS`/`Glyph` pulls the whole set; importing individual `*Icon` components
 * tree-shakes to just those (the package is `sideEffects: false`).
 */
export const GLYPHS: Record<string, ComponentType<GlyphProps>> = {
  // node / architecture kinds
  database: DatabaseIcon,
  user: UserIcon,
  cloud: CloudIcon,
  box: BoxIcon,
  component: ComponentIcon,
  server: ServerIcon,
  globe: GlobeIcon,
  shield: ShieldIcon,
  zap: ZapIcon,
  cpu: CpuIcon,
  harddrive: HardDriveIcon,
  layers: LayersIcon,
  network: NetworkIcon,
  queue: QueueIcon,
  // actor / process kinds
  wrench: WrenchIcon,
  sparkle: SparkleIcon,
  robot: RobotIcon,
  // file types
  folder: FolderIcon,
  'folder-open': FolderOpenIcon,
  file: FileIcon,
  json: JsonIcon,
  markdown: MarkdownIcon,
  terminal: TerminalIcon,
  image: ImageIcon,
  typescript: TypeScriptIcon,
  javascript: JavaScriptIcon,
  react: ReactIcon,
  css: CssIcon,
  html: HtmlIcon,
  // UI affordances
  'chevron-right': ChevronRightIcon,
  'chevron-down': ChevronDownIcon,
  close: CloseIcon,
  check: CheckIcon,
  search: SearchIcon,
  'external-link': ExternalLinkIcon,
  info: InfoIcon,
  warning: WarningIcon,
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
  // Own-property check: a bare index would resolve prototype-chain names
  // ('constructor', 'toString', …) to functions and crash the render — glyph
  // names arrive from consumer JSON, so junk must degrade to nothing.
  const C = Object.hasOwn(GLYPHS, name) ? GLYPHS[name] : undefined;
  return C ? <C className={className} /> : null;
}
