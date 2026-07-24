// Example PAGE — a full GAME DESIGN DOCUMENT for Soul Steel, NOT a library
// component (no single 3-jobs contract). Lives in src/examples/ so
// `check:contracts` ignores it; Storybook finds it via the packages/*/src glob.
//
// Import paths are the point: game-viz components come from the public barrel
// ('../../index'), while @trembus/ui rides game-viz's REAL package dependency —
// this page dog-foods the exact resolution path a consuming studio app would
// use (Storybook aliases the bare specifiers to source; a package build
// resolves dist).
//
// The stage trick: the Brief (the document) is `resizable` — drag its inline-end
// handle, or focus the handle and press Arrow / Shift+Arrow / Home / End — and
// the appendix grid re-columns live around it.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Brief, Callout, Stat, Table } from '@trembus/ui';
import {
  Chronicle,
  CinematicHero,
  Constellation,
  EpisodeDeck,
  MediaFrame,
  SoulCard,
} from '../../index';
import { COLLAPSED_SECTIONS, GDD } from './gdd';
import { ART, CHAPTERS, HERO, LITANY, PRODUCTION, ROSTER, SOULS, STATS } from './appendix';

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        margin: '0 0 var(--tcl-space-4)',
        fontFamily: 'var(--tcl-font-mono)',
        fontSize: 'var(--tcl-text-xs)',
        letterSpacing: 'var(--tcl-tracking-caps)',
        textTransform: 'uppercase',
        color: 'var(--tcl-text-dim)',
      }}
    >
      {children}
    </p>
  );
}

function RosterTable() {
  return (
    <Table>
      <Table.Caption>Enemy roster — the Chapter I census</Table.Caption>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell>Foe</Table.HeaderCell>
          <Table.HeaderCell>Order</Table.HeaderCell>
          <Table.HeaderCell>Threat</Table.HeaderCell>
          <Table.HeaderCell align="end">Souls yielded</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {ROSTER.map((r) => (
          <Table.Row key={r.foe}>
            <Table.Cell>{r.foe}</Table.Cell>
            <Table.Cell>{r.order}</Table.Cell>
            <Table.Cell>
              <Badge tone={r.threat.tone}>{r.threat.label}</Badge>
            </Table.Cell>
            <Table.Cell align="end">
              <span style={{ fontFamily: 'var(--tcl-font-mono)' }}>{r.souls}</span>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

function GameDesignDocumentPage() {
  const [chapterId, setChapterId] = useState('ch01');

  return (
    <div
      style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: 'var(--tcl-space-6)',
        display: 'grid',
        // minmax(0, …) so the hero's display type can't stretch the page track.
        gridTemplateColumns: 'minmax(0, 1fr)',
        gap: 'var(--tcl-space-8)',
      }}
    >
      <CinematicHero data={HERO} />

      <section>
        <SectionLabel>The Codex · drag the edge of the document</SectionLabel>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--tcl-space-6)',
            alignItems: 'flex-start',
          }}
        >
          {/* The resizable Brief is the flex item itself — its CSS carries the
              pure-length flex-basis that keeps this row's line-breaking honest. */}
          <Brief
            data={GDD}
            defaultCollapsed={COLLAPSED_SECTIONS}
            resizable
            defaultWidth={560}
            minWidth={380}
            maxWidth={900}
          />
          {/* The appendix absorbs every pixel the document releases. */}
          <div
            style={{
              flex: '1 1 300px',
              minWidth: 0,
              display: 'grid',
              gap: 'var(--tcl-space-5)',
              alignContent: 'start',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            }}
          >
            <div
              style={{
                display: 'grid',
                gap: 'var(--tcl-space-3)',
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              {STATS.map((s) => (
                <Stat key={s.label} {...s} />
              ))}
            </div>
            {SOULS.map((s) => (
              <SoulCard key={s.name} data={s} />
            ))}
            <EpisodeDeck
              data={CHAPTERS}
              tone="danger"
              selectedId={chapterId}
              onSelect={setChapterId}
            />
            <div style={{ display: 'grid', gap: 'var(--tcl-space-4)', alignContent: 'start' }}>
              <MediaFrame data={ART} ratio="16 / 10" />
              <Callout tone="warning" title="Provisional rating — M">
                The ninety-nine-voice audio treatment for Mara is the rating driver; final
                classification waits on the alpha audio pass.
              </Callout>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <RosterTable />
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionLabel>Rite of Production</SectionLabel>
        <Chronicle data={PRODUCTION} archive="Rite of Production" tone="danger" />
      </section>

      <section>
        <SectionLabel>Discipline · Litany of Iron</SectionLabel>
        <Constellation
          data={LITANY}
          tone="danger"
          designation="Discipline · Litany of Iron"
          defaultAllocated={{ nail: 1, hymn: 2, weight: 1 }}
          defaultSelectedId="weight"
        />
      </section>
    </div>
  );
}

const meta = {
  title: 'Examples/Game Design Document',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The full GDD: hero cover, the resizable Brief document beside a reflowing appendix (stats · classes · chapters · key art · roster), the production Chronicle, and the Litany of Iron Constellation. */
export const Default: Story = {
  render: () => <GameDesignDocumentPage />,
};

/** Just the document pane — isolates the resizable Brief (drag the edge, or Arrow / Shift+Arrow / Home / End on the handle; the narrow layout engages below ~480px). */
export const DocumentOnly: Story = {
  render: () => (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 'var(--tcl-space-6)' }}>
      <Brief
        data={GDD}
        defaultCollapsed={COLLAPSED_SECTIONS}
        resizable
        defaultWidth={560}
        minWidth={380}
        maxWidth={900}
      />
    </div>
  ),
};
