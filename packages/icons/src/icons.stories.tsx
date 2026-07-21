import type { ReactElement, ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  GLYPHS,
  Glyph,
  OUTPUT_CATEGORY_GLYPH,
  OUTPUT_KIND_GLYPH,
  PROVENANCE_GLYPH,
  fileToGlyph,
} from './index';

// A gallery of the shared glyph set. Not a library component — just a visual index
// of every registered glyph. The token CSS vars resolve from Storybook's globally
// loaded tokens stylesheet (the icons package itself ships no CSS / token dep).
function Gallery() {
  const names = Object.keys(GLYPHS);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))',
        gap: 12,
        fontFamily: 'var(--tcl-font-sans)',
        color: 'var(--tcl-text)',
      }}
    >
      {names.map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: '14px 8px',
            border: '0.5px solid var(--tcl-border)',
            borderRadius: 'var(--tcl-radius-md)',
            background: 'var(--tcl-surface-raised)',
          }}
        >
          <span style={{ fontSize: 26, lineHeight: 1, color: 'var(--tcl-text)' }}>
            <Glyph name={name} />
          </span>
          <code style={{ fontSize: 11, color: 'var(--tcl-text-dim)' }}>{name}</code>
        </div>
      ))}
    </div>
  );
}

/**
 * The shared Trembus glyph set — hand-authored 24×24 stroke marks for node kinds, file
 * types, workflow outputs, and UI affordances, rendered inline as `1em` SVGs.
 *
 * ### When to use it
 *
 * - Marking **what a thing is** at a glance: file trees, command centers, lane headers,
 *   node cards. The workflow-output vocabulary covers what human+AI workflow steps emit —
 *   tools, application files, media, configuration, and context (engrams, skills, agents).
 * - Not for illustration or brand artwork — glyphs are functional marks that ride beside a
 *   text label, sized by the surrounding `font-size`.
 *
 * ### Data & key props
 *
 * - `<Glyph name>` renders by registry name; unknown names safely render nothing.
 * - Individual `*Icon` components (e.g. `BrainIcon`) tree-shake to just what you import.
 * - Kind maps pair domain vocabulary with glyph names: `SYSTEM_KIND_GLYPH` (C4 nodes),
 *   `OUTPUT_CATEGORY_GLYPH` + `OUTPUT_KIND_GLYPH` (workflow outputs), `PROVENANCE_GLYPH`
 *   (human / ai / conjoined).
 * - Filename inference: `fileToGlyph(name)` checks well-known basenames (SKILL.md, .env…)
 *   before `extToGlyph(name)`.
 *
 * ### Accessibility
 *
 * - Every glyph is `aria-hidden` decorative — the adjacent text label carries the meaning.
 *   Never ship a glyph (or a provenance badge) as the only signal.
 *
 * ### Theming & setup
 *
 * - Monochrome glyphs paint `currentColor`, so the surrounding text color (a `var(--tcl-*)`
 *   token) tints them; brand marks (TS, JS, …) carry their own color. The package ships no
 *   CSS and no token dependency.
 */
const meta = {
  title: 'Foundations/Icons',
  component: Gallery,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every registered glyph — monochrome marks inherit `currentColor`; brand marks carry their own color. */
export const Default: Story = {};

// ── the workflow-output icon language ─────────────────────────────────────────
// Presentation-only grouping of the flat OUTPUT_KIND_GLYPH map into the five
// command-center categories. The maps stay flat; this story is the spec sheet.

const CATEGORY_SPEC: { key: string; label: string; blurb: string; kinds: string[] }[] = [
  {
    key: 'tools',
    label: 'Code — Tools',
    blurb: 'Self-contained runnables: on-demand tools, scripts, scheduled jobs.',
    kinds: ['tool', 'script', 'job'],
  },
  {
    key: 'application',
    label: 'Application files',
    blurb: 'Package modules, libraries, controllers, packaged utilities, game code.',
    kinds: ['module', 'library', 'controller', 'utility', 'game'],
  },
  {
    key: 'media',
    label: 'Media',
    blurb: 'Audio, visual, motion, and 3D artifacts.',
    kinds: ['audio', 'image', 'video', 'model'],
  },
  {
    key: 'configuration',
    label: 'Configuration',
    blurb: 'Settings, structured data (JSON/YAML/TOML), secrets.',
    kinds: ['config', 'data', 'secret'],
  },
  {
    key: 'context',
    label: 'Context',
    blurb: 'The AI-native bucket: engrams, memories, skills, agent charters, prompts.',
    kinds: ['engram', 'memory', 'skill', 'doc', 'agent', 'prompt', 'message'],
  },
];

function Tile({ glyph, label, hint }: { glyph: ReactNode; label: string; hint?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '12px 8px',
        border: '0.5px solid var(--tcl-border)',
        borderRadius: 'var(--tcl-radius-md)',
        background: 'var(--tcl-surface-raised)',
        minWidth: 96,
      }}
    >
      <span style={{ fontSize: 26, lineHeight: 1, color: 'var(--tcl-text)' }}>{glyph}</span>
      <span style={{ fontSize: 12 }}>{label}</span>
      {hint ? <code style={{ fontSize: 10, color: 'var(--tcl-text-dim)' }}>{hint}</code> : null}
    </div>
  );
}

/** A kind glyph wearing a small provenance / run-mode badge at its corner. */
function Badged({ base, badge }: { base: string; badge: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <Glyph name={base} />
      <span
        style={{
          position: 'absolute',
          right: '-0.28em',
          bottom: '-0.22em',
          fontSize: '0.55em',
          display: 'inline-flex',
          padding: '0.08em',
          borderRadius: '50%',
          background: 'var(--tcl-surface-raised)',
          color: 'var(--tcl-accent)',
        }}
      >
        <Glyph name={badge} />
      </span>
    </span>
  );
}

function SectionHeading({ glyph, children }: { glyph: string; children: ReactNode }) {
  return (
    <h3
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '0 0 2px',
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, color: 'var(--tcl-accent)' }}>
        <Glyph name={glyph} />
      </span>
      {children}
    </h3>
  );
}

const SAMPLE_FILES = [
  'SKILL.md',
  'CLAUDE.md',
  'MEMORY.md',
  '.env.local',
  'package.json',
  'deploy.sh',
  'config.yaml',
  'Effigy.rbxm',
  'theme.wav',
  'promo.mp4',
];

function OutputLanguageBoard(): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        fontFamily: 'var(--tcl-font-sans)',
        color: 'var(--tcl-text)',
        maxWidth: 860,
      }}
    >
      {CATEGORY_SPEC.map((cat) => (
        <section key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SectionHeading glyph={OUTPUT_CATEGORY_GLYPH[cat.key]}>{cat.label}</SectionHeading>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--tcl-text-dim)' }}>{cat.blurb}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {cat.kinds.map((kind) => (
              <Tile
                key={kind}
                glyph={<Glyph name={OUTPUT_KIND_GLYPH[kind]} />}
                label={kind}
                hint={OUTPUT_KIND_GLYPH[kind]}
              />
            ))}
          </div>
        </section>
      ))}

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionHeading glyph="venn">Provenance marks — who produced it</SectionHeading>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--tcl-text-dim)' }}>
          Pair a small mark with any kind glyph: human, AI, or the two conjoined. Always keep a text
          label alongside — the marks are decorative.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {Object.entries(PROVENANCE_GLYPH).map(([who, name]) => (
            <Tile key={who} glyph={<Glyph name={name} />} label={who} hint={name} />
          ))}
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionHeading glyph="sparkle">Composition — kind × provenance × run-mode</SectionHeading>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--tcl-text-dim)' }}>
          The grammar composes instead of minting one icon per combination: base glyph says what it
          is, the corner badge says who made it (or how it runs).
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Tile glyph={<Badged base="terminal" badge="clock" />} label="scheduled script" />
          <Tile glyph={<Badged base="waveform" badge="robot" />} label="AI-produced audio" />
          <Tile glyph={<Badged base="book" badge="user" />} label="human-written skill" />
          <Tile glyph={<Badged base="box" badge="venn" />} label="conjoined module" />
          <Tile glyph={<Badged base="model-3d" badge="sparkle" />} label="generated 3D asset" />
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionHeading glyph="folder-open">
          Well-known files — <code>fileToGlyph</code>
        </SectionHeading>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--tcl-text-dim)' }}>
          Role beats extension: the filenames an AI+human command center should recognize on sight,
          then the extension map as fallback.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {SAMPLE_FILES.map((file) => (
            <Tile key={file} glyph={<Glyph name={fileToGlyph(file)} />} label={file} />
          ))}
        </div>
      </section>
    </div>
  );
}

/** Job: reveal-state — the five output categories, their kind glyphs, provenance marks, and the badge-composition grammar on one spec sheet. */
export const OutputLanguage: Story = {
  render: () => <OutputLanguageBoard />,
};
