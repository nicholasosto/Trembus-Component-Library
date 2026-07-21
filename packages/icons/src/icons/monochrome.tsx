import type { ReactElement } from 'react';
import { Svg } from './Svg';
import type { GlyphProps } from './Svg';

/**
 * Monochrome glyphs — they paint `currentColor`, so the consumer tints them with
 * the surrounding text color (a `var(--tcl-*)` token in this design system). Each
 * is a tree-shakeable named export.
 */

// ── node / architecture kinds ──
export const DatabaseIcon = (p: GlyphProps): ReactElement => (
  <Svg name="database" {...p}>
    <path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3Z" />
    <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
    <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
  </Svg>
);
export const UserIcon = (p: GlyphProps): ReactElement => (
  <Svg name="user" {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
  </Svg>
);
export const CloudIcon = (p: GlyphProps): ReactElement => (
  <Svg name="cloud" {...p}>
    <path d="M7 18a4 4 0 0 1-.5-7.97A5.5 5.5 0 0 1 17 9.5a3.5 3.5 0 0 1 .5 8.5Z" />
  </Svg>
);
export const BoxIcon = (p: GlyphProps): ReactElement => (
  <Svg name="box" {...p}>
    <path d="M12 3 20 7.5v9L12 21 4 16.5v-9Z" />
    <path d="M4 7.5 12 12l8-4.5" />
    <path d="M12 12v9" />
  </Svg>
);
export const ComponentIcon = (p: GlyphProps): ReactElement => (
  <Svg name="component" {...p}>
    <rect x="8" y="5" width="11" height="14" rx="1" />
    <path d="M8 9.5H5M8 14.5H5" />
  </Svg>
);
export const ServerIcon = (p: GlyphProps): ReactElement => (
  <Svg name="server" {...p}>
    <rect x="4" y="5" width="16" height="6" rx="1.5" />
    <rect x="4" y="13" width="16" height="6" rx="1.5" />
    <path d="M7.5 8h.01M7.5 16h.01" />
  </Svg>
);
export const GlobeIcon = (p: GlyphProps): ReactElement => (
  <Svg name="globe" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
  </Svg>
);
export const ShieldIcon = (p: GlyphProps): ReactElement => (
  <Svg name="shield" {...p}>
    <path d="M12 3 5 6v5c0 4.2 2.8 7.6 7 9 4.2-1.4 7-4.8 7-9V6Z" />
  </Svg>
);
export const ZapIcon = (p: GlyphProps): ReactElement => (
  <Svg name="zap" {...p}>
    <path d="M13 3 5 13h6l-2 8 8-10h-6Z" />
  </Svg>
);
export const CpuIcon = (p: GlyphProps): ReactElement => (
  <Svg name="cpu" {...p}>
    <rect x="7" y="7" width="10" height="10" rx="1" />
    <rect x="10" y="10" width="4" height="4" />
    <path d="M10 3v2M14 3v2M10 19v2M14 19v2M3 10h2M3 14h2M19 10h2M19 14h2" />
  </Svg>
);
export const HardDriveIcon = (p: GlyphProps): ReactElement => (
  <Svg name="harddrive" {...p}>
    <rect x="3" y="12" width="18" height="8" rx="2" />
    <path d="M5.5 12 8 5h8l2.5 7" />
    <path d="M7 16h.01M11 16h.01" />
  </Svg>
);
export const LayersIcon = (p: GlyphProps): ReactElement => (
  <Svg name="layers" {...p}>
    <path d="M12 3 3 8l9 5 9-5Z" />
    <path d="M3 12l9 5 9-5" />
    <path d="M3 16l9 5 9-5" />
  </Svg>
);
export const NetworkIcon = (p: GlyphProps): ReactElement => (
  <Svg name="network" {...p}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="18" cy="6" r="2.5" />
    <circle cx="12" cy="18" r="2.5" />
    <path d="M7.6 7.6 10.8 15.8M16.4 7.6 13.2 15.8M8.5 6h7" />
  </Svg>
);
export const QueueIcon = (p: GlyphProps): ReactElement => (
  <Svg name="queue" {...p}>
    <rect x="3" y="5" width="18" height="4" rx="1" />
    <rect x="3" y="11" width="18" height="4" rx="1" />
    <rect x="3" y="17" width="18" height="2.5" rx="1" />
  </Svg>
);

// ── actor / process kinds ──
export const WrenchIcon = (p: GlyphProps): ReactElement => (
  <Svg name="wrench" {...p}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
  </Svg>
);
export const SparkleIcon = (p: GlyphProps): ReactElement => (
  <Svg name="sparkle" {...p}>
    <path d="M12 4.8c.8 4 3.2 6.4 7.2 7.2-4 .8-6.4 3.2-7.2 7.2-.8-4-3.2-6.4-7.2-7.2 4-.8 6.4-3.2 7.2-7.2Z" />
    <path d="M19 5h.01" />
  </Svg>
);
export const RobotIcon = (p: GlyphProps): ReactElement => (
  <Svg name="robot" {...p}>
    <rect x="5" y="9" width="14" height="10" rx="2" />
    <path d="M12 9V5M12 4h.01" />
    <path d="M9.5 13.5h.01M14.5 13.5h.01" />
    <path d="M9.5 16.5h5" />
  </Svg>
);

// ── file types (monochrome) ──
export const FolderIcon = (p: GlyphProps): ReactElement => (
  <Svg name="folder" {...p}>
    <path d="M4 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
  </Svg>
);
export const FolderOpenIcon = (p: GlyphProps): ReactElement => (
  <Svg name="folder-open" {...p}>
    <path d="M4 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v2H4Z" />
    <path d="M4 10h16l-2 7a1 1 0 0 1-1 .9H5a1 1 0 0 1-1-1Z" />
  </Svg>
);
export const FileIcon = (p: GlyphProps): ReactElement => (
  <Svg name="file" {...p}>
    <path d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v5h5" />
  </Svg>
);
export const JsonIcon = (p: GlyphProps): ReactElement => (
  <Svg name="json" {...p}>
    <path d="M9 4a3 3 0 0 0-3 3v2a2 2 0 0 1-2 2 2 2 0 0 1 2 2v2a3 3 0 0 0 3 3" />
    <path d="M15 4a3 3 0 0 1 3 3v2a2 2 0 0 0 2 2 2 2 0 0 0-2 2v2a3 3 0 0 1-3 3" />
  </Svg>
);
export const MarkdownIcon = (p: GlyphProps): ReactElement => (
  <Svg name="markdown" {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M6 15V9l3 3 3-3v6" />
    <path d="M17 9v4.5M17 13.5l-2-2M17 13.5l2-2" />
  </Svg>
);
export const TerminalIcon = (p: GlyphProps): ReactElement => (
  <Svg name="terminal" {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 9.5 10 12.5 7 15.5M12.5 15.5H16" />
  </Svg>
);
export const ImageIcon = (p: GlyphProps): ReactElement => (
  <Svg name="image" {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M21 16.5 15.5 11 5 20.5" />
  </Svg>
);

// ── workflow-output kinds (what a human+AI workflow step emits) ──
export const ClockIcon = (p: GlyphProps): ReactElement => (
  <Svg name="clock" {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);
export const GearIcon = (p: GlyphProps): ReactElement => (
  <Svg name="gear" {...p}>
    <path d="M10.31 5.21 10.71 2.79 13.29 2.79 13.69 5.21 15.61 6 17.6 4.57 19.43 6.4 18 8.39 18.79 10.31 21.21 10.71 21.21 13.29 18.79 13.69 18 15.61 19.43 17.6 17.6 19.43 15.61 18 13.69 18.79 13.29 21.21 10.71 21.21 10.31 18.79 8.39 18 6.4 19.43 4.57 17.6 6 15.61 5.21 13.69 2.79 13.29 2.79 10.71 5.21 10.31 6 8.39 4.57 6.4 6.4 4.57 8.39 6Z" />
    <circle cx="12" cy="12" r="3.2" />
  </Svg>
);
export const GamepadIcon = (p: GlyphProps): ReactElement => (
  <Svg name="gamepad" {...p}>
    <rect x="3.5" y="8" width="17" height="9" rx="4.5" />
    <path d="M7.5 10.5v4M5.5 12.5h4" />
    <path d="M15.5 11h.01M18 13.5h.01" />
  </Svg>
);
export const WaveformIcon = (p: GlyphProps): ReactElement => (
  <Svg name="waveform" {...p}>
    <path d="M4 9.5v5M8 6.5v11M12 4v16M16 6.5v11M20 9.5v5" />
  </Svg>
);
export const VideoIcon = (p: GlyphProps): ReactElement => (
  <Svg name="video" {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M10 9l5.5 3-5.5 3Z" />
  </Svg>
);
export const Model3dIcon = (p: GlyphProps): ReactElement => (
  <Svg name="model-3d" {...p}>
    <path d="M12 3.5 19.5 15.5 12 19.5 4.5 15.5Z" />
    <path d="M12 3.5V19.5" />
  </Svg>
);
export const SlidersIcon = (p: GlyphProps): ReactElement => (
  <Svg name="sliders" {...p}>
    <path d="M3.5 6.5h9.3M17.2 6.5h3.3" />
    <circle cx="15" cy="6.5" r="2.2" />
    <path d="M3.5 12h2.8M10.7 12h9.8" />
    <circle cx="8.5" cy="12" r="2.2" />
    <path d="M3.5 17.5h7.3M15.2 17.5h5.3" />
    <circle cx="13" cy="17.5" r="2.2" />
  </Svg>
);
export const KeyIcon = (p: GlyphProps): ReactElement => (
  <Svg name="key" {...p}>
    <circle cx="7" cy="16.5" r="3.2" />
    <path d="M9.3 14.2 19.5 4" />
    <path d="M16.3 7.2l2.4 2.4" />
  </Svg>
);
export const BrainIcon = (p: GlyphProps): ReactElement => (
  <Svg name="brain" {...p}>
    <path d="M12 4.7A1.87 1.87 0 0 0 8.83 6.09A2.24 2.24 0 0 0 6.86 9.74A2.44 2.44 0 0 0 6.86 14.26A2.24 2.24 0 0 0 8.83 17.91A1.87 1.87 0 0 0 12 19.3" />
    <path d="M12 4.7A1.87 1.87 0 0 1 15.17 6.09A2.24 2.24 0 0 1 17.14 9.74A2.44 2.44 0 0 1 17.14 14.26A2.24 2.24 0 0 1 15.17 17.91A1.87 1.87 0 0 1 12 19.3" />
    <path d="M12 4.7v14.6" />
  </Svg>
);
export const BookIcon = (p: GlyphProps): ReactElement => (
  <Svg name="book" {...p}>
    <path d="M12 6.8C10.2 5.1 7.7 4.5 4.5 4.5v13c3.2 0 5.7.6 7.5 2.3 1.8-1.7 4.3-2.3 7.5-2.3v-13c-3.2 0-5.7.6-7.5 2.3Z" />
    <path d="M12 6.8v13" />
  </Svg>
);
export const MessageIcon = (p: GlyphProps): ReactElement => (
  <Svg name="message" {...p}>
    <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4.5 4v-4H6a2 2 0 0 1-2-2Z" />
  </Svg>
);

// ── provenance marks (who produced an output) ──
export const VennIcon = (p: GlyphProps): ReactElement => (
  <Svg name="venn" {...p}>
    <circle cx="8.8" cy="12" r="5.2" />
    <circle cx="15.2" cy="12" r="5.2" />
  </Svg>
);

// ── core UI affordances ──
export const PlayIcon = (p: GlyphProps): ReactElement => (
  <Svg name="play" {...p}>
    <path d="M8.5 5.5 18.5 12 8.5 18.5Z" />
  </Svg>
);
export const ChevronRightIcon = (p: GlyphProps): ReactElement => (
  <Svg name="chevron-right" {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
export const ChevronDownIcon = (p: GlyphProps): ReactElement => (
  <Svg name="chevron-down" {...p}>
    <path d="M6 9l6 6 6-6" />
  </Svg>
);
export const CloseIcon = (p: GlyphProps): ReactElement => (
  <Svg name="close" {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);
export const CheckIcon = (p: GlyphProps): ReactElement => (
  <Svg name="check" {...p}>
    <path d="M5 12.5 9.5 17 19 6.5" />
  </Svg>
);
export const SearchIcon = (p: GlyphProps): ReactElement => (
  <Svg name="search" {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
);
export const ExternalLinkIcon = (p: GlyphProps): ReactElement => (
  <Svg name="external-link" {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M19 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);
export const InfoIcon = (p: GlyphProps): ReactElement => (
  <Svg name="info" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 7.5h.01" />
  </Svg>
);
export const WarningIcon = (p: GlyphProps): ReactElement => (
  <Svg name="warning" {...p}>
    <path d="M12 4 2.5 20h19Z" />
    <path d="M12 10v4" />
    <path d="M12 17.5h.01" />
  </Svg>
);
