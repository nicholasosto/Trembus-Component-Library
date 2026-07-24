// Example — the SESSION work-log template for Brief, exercised on REAL records
// from the three project spaces (fixtures captured 2026-07-24). Not a library
// component: the template is `sessionToBrief.ts` (a pure adapter) + these stories;
// it lives in src/examples/, outside the contract gate, and composes from the
// public barrel so it exercises the same API a consumer would.
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Brief } from '../../index';
import type { BriefContract } from '../../index';
import { sessionToBrief } from './sessionToBrief';
import {
  asCompletedSession,
  psCompletedSession,
  psShelvedSession,
  rdsActiveSession,
  syntheticBlockedSession,
} from './sessions.fixture';
import type { SessionRecord } from './sessions.fixture';

// ── page chrome ────────────────────────────────────────────────────────────
const page: CSSProperties = { padding: 24 };
const row: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 24,
  alignItems: 'flex-start',
};

/** One record → one Brief, with the column width set via the skin hook. */
function SessionDoc({
  record,
  width,
  collapse,
}: {
  record: SessionRecord;
  width?: number;
  collapse?: 'auto' | 'none';
}) {
  const { data, defaultCollapsed } = sessionToBrief(record.markdown, {
    id: record.id,
    space: record.space,
    collapse,
  });
  const style = width
    ? ({ '--tcl-brief-max-width': `${width}px`, minWidth: 0 } as CSSProperties)
    : { minWidth: 0 };
  return (
    <div style={style}>
      <Brief data={data} defaultCollapsed={defaultCollapsed} />
    </div>
  );
}

// ── a synthetic freshly-scaffolded record (`planned` never occurs in the wild —
//    a session flips to `active` the moment work starts) ─────────────────────
const plannedScaffold: SessionRecord = {
  id: '2026-07-24-adopt-the-session-brief-template',
  space: 'Project-System',
  markdown: `---
title: "Adopt the session Brief template"
status: planned
updated: 2026-07-24
---

# Adopt the session Brief template

> **Status:** planned (2026-07-24)

## Goal

Render \`_project/sessions/\` records through the session Brief template on the previews
site. (Synthetic sample — a freshly scaffolded session, nothing authored yet.)

## Success Criteria

- <criterion>

## Source References

- <ref>

## Decisions

- <decision>

## Outputs

- <artifact produced>

## Blockers

- <blocker, or "none">

## Next Action

<the single next concrete action>

## Handoff Notes

<what the next session needs to know>
`,
};

// ── the template's own design, rendered as a Brief (plan-as-visual) ────────
const templateSpec: BriefContract = {
  view: 'brief',
  kind: 'spec',
  id: 'template.session-brief',
  title: 'The session work-log template',
  summary:
    'One deterministic mapping from the 8/9-section session scaffold (identical across ' +
    'Project-System, Asset-Studio, and Roblox-Development-Studio) onto Brief sub-components — ' +
    'each section rendered by the kind whose affordances match what the section records.',
  meta: [
    { label: 'sources', value: '30 records · 3 spaces' },
    { label: 'sub-components', value: 'checklist · reference · decisions · artifacts · prose' },
    { label: 'engine', value: 'sessionToBrief() — deterministic, model-free' },
  ],
  sections: [
    {
      id: 'mapping',
      heading: 'Section → sub-component mapping',
      kind: 'decisions',
      note: 'The structural decisions — every canonical section routed to the Brief kind whose shape it already has.',
      items: [
        { text: 'Goal', choice: 'the header summary — a session’s goal IS its intro paragraph' },
        {
          text: 'Success Criteria',
          choice: 'checklist — the gate conditions; severity flips with the lifecycle',
        },
        {
          text: 'Source References',
          choice:
            'reference rows — markdown links, wiki-links, and leading path code-spans become pointer chips; typed frontmatter links[] join with their rel as the trailing chip',
        },
        {
          text: 'Decisions',
          choice:
            'decisions rows — the authored "bold lead (qualifier): resolution" idiom becomes lead → resolution',
        },
        {
          text: 'First-Principles Candidates',
          choice:
            'decisions rows — the records already write "observation → disposition"; the arrow is native',
        },
        {
          text: 'Outputs',
          choice: 'artifacts — deliverable + pointer chip to the entity it minted',
        },
        {
          text: 'Blockers',
          choice: 'checklist — danger rows; a lone "none" renders as one success all-clear row',
        },
        {
          text: 'Next Action',
          choice: 'a single spotlight checklist row — warn while live, info once closed',
        },
        { text: 'Handoff Notes', choice: 'prose — the successor’s narrative stays narrative' },
        {
          text: 'Ad-hoc extra sections',
          choice: 'reference rows / prose — degrade gracefully, never break the render',
        },
      ],
    },
    {
      id: 'indicators',
      heading: 'Visual indicators',
      kind: 'checklist',
      note: 'Each row demonstrates the severity it describes.',
      items: [
        {
          text: 'Lifecycle status pill',
          desc: 'planned neutral · active gold · blocked danger · completed success · shelved warning — tone always paired with the word',
          severity: 'info',
        },
        {
          text: 'In-flight scaffolding is visible',
          desc: 'placeholder sections render an italic "Not yet recorded" note and roll up into the filled n/m sections pill',
          severity: 'warn',
        },
        {
          text: 'A completed session reads as a wall of met criteria',
          desc: 'checklist severity flips to success when status = completed',
          severity: 'success',
        },
        {
          text: 'Blockers scream only when real',
          desc: 'authored blockers render danger rows; the all-clear renders green',
          severity: 'danger',
        },
      ],
    },
    {
      id: 'boundaries',
      heading: 'Boundaries',
      kind: 'boundaries',
      items: [
        {
          text: 'Deterministic, model-free',
          desc: 'same thesis as fromMarkdown — transcription, not generation; lenient parse, strict render',
        },
        {
          text: 'Fixtures, not live reads',
          desc: 'the stories must render without the private project spaces on disk',
        },
        {
          text: 'Status-aware folding, not data loss',
          desc: 'closed sessions fold references/decisions/first-principles by default — every section stays one click away',
        },
      ],
    },
    {
      id: 'files',
      heading: 'Files',
      kind: 'artifacts',
      items: [
        {
          text: 'sessionToBrief.ts',
          desc: 'the template engine',
          ref: 'src/examples/sessionBrief/sessionToBrief.ts',
        },
        {
          text: 'sessions.fixture.ts',
          desc: 'real records, captured verbatim',
          ref: 'src/examples/sessionBrief/sessions.fixture.ts',
        },
        {
          text: 'Brief',
          desc: 'session kind + success severity shipped with this template',
          ref: 'src/components/Brief/Brief.tsx',
        },
      ],
    },
  ],
};

/**
 * The **session work-log template** for `Brief` — the reference mapping from a
 * project-system SESSION entity record (the 8/9-section scaffold shared by the
 * Project-System, Asset-Studio, and Roblox-Development-Studio `_project/sessions/`
 * folders) onto Brief sub-components, with lifecycle-aware visual indicators.
 *
 * ### When to use it
 * - Rendering `_project/sessions/*.md` work logs in a command center, previews site, or dossier page.
 * - As the worked example for designing your own Brief template: per-section sub-component choice, status→tone mapping, pending detection, graceful degradation.
 * - Not for instruction docs (CLAUDE.md/AGENTS.md) — use `fromMarkdown` (Components/Brief → FromMarkdown); not for a single decision record — see Visualizations/DecisionMap.
 *
 * ### Data & key props
 * - `sessionToBrief(markdown, { id, space, collapse })` → `{ data, defaultCollapsed, status, pending }`; hand `data` + `defaultCollapsed` to `<Brief>`.
 * - The mapping: Goal → header summary · Success Criteria → checklist (success once completed, info in flight) · Source References (+ typed frontmatter links) → reference chips · Decisions / First-Principles Candidates → decisions rows (lead → resolution / observation → disposition) · Outputs → artifacts · Blockers → danger rows or one success "none" · Next Action → single spotlight row (warn live, info closed) · Handoff Notes → prose.
 * - Scaffold placeholders such as `<artifact produced>` become "Not yet recorded" notes, the `filled n/m sections` pill, and the returned `pending[]`.
 *
 * ### Accessibility
 * - Everything renders through Brief's accessible spine: per-section disclosure buttons, an article landmark, and tone always paired with a word (the status pill spells its status; severity rows carry their text).
 *
 * ### Theming & setup
 * - Status tones ride tokens (`var(--tcl-status-*)`, `var(--tcl-accent)`); works in light · dark · reliquary via `[data-theme]`.
 * - `--tcl-brief-max-width` on a wrapper sizes each column (these stories use 520/380px).
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Examples/Session Brief',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — one real record per project space, side by side: the same template
 * absorbs an active mid-flight session (RDS), the fully-filled reference shape
 * (Project-System), and a record carrying an ad-hoc extra section (Asset-Studio). */
export const AcrossThreeSpaces: Story = {
  render: () => (
    <div style={page}>
      <div style={row}>
        <SessionDoc record={rdsActiveSession} width={520} />
        <SessionDoc record={psCompletedSession} width={520} />
        <SessionDoc record={asCompletedSession} width={520} />
      </div>
    </div>
  ),
};

/** Job: Reveal State — an in-flight session wears its incompleteness: gold `active` pill,
 * `filled 5/9 sections`, and italic "Not yet recorded" notes where the scaffold still
 * holds placeholders. The resize handle is live (drag it, or Arrow/Home/End). */
export const ActiveWithPending: Story = {
  render: () => {
    const { data, defaultCollapsed } = sessionToBrief(rdsActiveSession.markdown, {
      id: rdsActiveSession.id,
      space: rdsActiveSession.space,
    });
    return (
      <div style={page}>
        <Brief data={data} defaultCollapsed={defaultCollapsed} resizable defaultWidth={720} />
      </div>
    );
  },
};

/** Job: Reveal State — all five lifecycle states in narrow columns: planned (fresh
 * scaffold, 1/8 filled) → active (gold) → blocked (danger rows) → completed (met
 * criteria, success all-clear) → shelved (warning pill + status-note annotation). */
export const LifecycleRange: Story = {
  render: () => (
    <div style={page}>
      <div style={row}>
        <SessionDoc record={plannedScaffold} width={380} />
        <SessionDoc record={rdsActiveSession} width={380} />
        <SessionDoc record={syntheticBlockedSession} width={380} />
        <SessionDoc record={psCompletedSession} width={380} />
        <SessionDoc record={psShelvedSession} width={380} />
      </div>
    </div>
  ),
};

/** Job: Reveal State — the template's own design, rendered by the component it targets:
 * the section→sub-component mapping as decisions rows, the indicator inventory as a
 * checklist that demonstrates each severity it describes. */
export const TemplateSpec: Story = {
  render: () => (
    <div style={{ ...page, display: 'flex', justifyContent: 'center' }}>
      <Brief data={templateSpec} />
    </div>
  ),
};
