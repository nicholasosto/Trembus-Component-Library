// Example PAGE — a monorepo "package dossier" composed from many @trembus/ui
// components, NOT a library component (no single 3-jobs contract, so it lives in
// src/examples/, outside src/components/, where check:contracts never looks).
//
// The point: use Brief for what it is great at — a structured document whose
// sections are real collapsible disclosures — to progressively reveal a package's
// public API, and surround it with the at-a-glance chrome Brief does not cover
// (Badge status chips, a condensed meta strip, a Callout tier note, Table
// dependency lists, Button setup actions). Compose from the public barrel so the
// example exercises the same API a consumer would.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Brief, Button, Callout, Card, Inline, Stack, Table, Text } from '../../index';
import { apiSize, PACKAGES } from './packages';
import type { PackageDossier } from './packages';
import { COLLAPSED_SECTIONS, toBrief } from './toBrief';

// ── small helpers ──────────────────────────────────────────────────────────
const STATUS_TONE = { stable: 'success', beta: 'warning', planned: 'neutral' } as const;

function copy(text: string): void {
  void navigator.clipboard?.writeText(text).catch(() => undefined);
}

function tierNote(pkg: PackageDossier): {
  tone: 'info' | 'warning' | 'success' | 'neutral';
  title: string;
  body: string;
} {
  if (pkg.status === 'beta') {
    return {
      tone: 'warning',
      title: 'Beta',
      body: 'API may change before 1.0 — pin an exact version in consuming games.',
    };
  }
  if (pkg.internalDeps.length === 0) {
    return {
      tone: 'info',
      title: 'Foundation package',
      body: 'No internal dependencies — safe to depend on from any package or game repo.',
    };
  }
  return {
    tone: 'info',
    title: `${pkg.tier} package`,
    body: `Builds on ${pkg.internalDeps.map((d) => `@trembus/${d}`).join(' + ')}.`,
  };
}

// ── master rail item (a page-local selectable button, token-styled) ──────────
function RailItem({
  pkg,
  selected,
  onSelect,
}: {
  pkg: PackageDossier;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-current={selected ? 'true' : undefined}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        width: '100%',
        textAlign: 'left',
        cursor: 'pointer',
        padding: 'var(--tcl-space-3)',
        borderRadius: 'var(--tcl-radius-md)',
        border: `1px solid ${selected ? 'var(--tcl-accent)' : 'var(--tcl-border)'}`,
        background: selected ? 'var(--tcl-surface-raised)' : 'transparent',
        color: 'var(--tcl-text)',
        font: 'inherit',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--tcl-space-2)',
        }}
      >
        <Text weight="semibold" size="sm" truncate>
          {pkg.name}
        </Text>
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            flex: '0 0 auto',
            borderRadius: '50%',
            background: `var(--tcl-status-${STATUS_TONE[pkg.status]})`,
          }}
        />
      </span>
      <Text mono size="xs" tone="dim">
        v{pkg.version} · {pkg.tier} · {pkg.status}
      </Text>
    </button>
  );
}

// ── header chrome ────────────────────────────────────────────────────────────
function StatusChips({ pkg }: { pkg: PackageDossier }) {
  return (
    <Inline gap={2} wrap align="center">
      <Badge tone={STATUS_TONE[pkg.status]} dot variant="soft">
        {pkg.status}
      </Badge>
      <Badge tone="info" variant="outline">
        {pkg.tier}
      </Badge>
      <Badge tone="neutral" variant="soft">
        v{pkg.version}
      </Badge>
      {pkg.built && (
        <Badge tone="success" dot variant="outline">
          built
        </Badge>
      )}
    </Inline>
  );
}

function ActionBar({ pkg }: { pkg: PackageDossier }) {
  const [copied, setCopied] = useState<string | null>(null);
  const act = (label: string, text: string): void => {
    copy(text);
    setCopied(label);
  };
  return (
    <Stack gap={1} align="end">
      <Inline gap={2} wrap justify="end">
        <Button
          variant="outline"
          tone="neutral"
          size="sm"
          onPress={() => act('pnpm add', `pnpm add ${pkg.name}`)}
        >
          pnpm add
        </Button>
        <Button
          variant="outline"
          tone="neutral"
          size="sm"
          onPress={() => act('workspace link', `pnpm add ${pkg.name}@workspace:*`)}
        >
          link
        </Button>
        <Button
          variant="outline"
          tone="neutral"
          size="sm"
          onPress={() => act('dir path', pkg.path)}
        >
          dir path
        </Button>
        <Button asChild variant="outline" tone="neutral" size="sm">
          <a href={`https://www.npmjs.com/package/${pkg.name}`} target="_blank" rel="noreferrer">
            npm ↗
          </a>
        </Button>
      </Inline>
      {copied && (
        <Text size="xs" tone="success" aria-live="polite">
          Copied {copied} to clipboard
        </Text>
      )}
    </Stack>
  );
}

// ── at-a-glance meta strip ───────────────────────────────────────────────────
// Condensed from a row of big Stat cards into one compact inset bar: the cards
// dwarfed the panel and mostly echoed chrome already on the page (version/built
// are status chips above; deps/consumers/API recur in the Callout, tables, and
// Brief below). One quiet line of label→value pairs keeps the glanceable facts.
function MetaStrip({ pkg }: { pkg: PackageDossier }) {
  const items: Array<[label: string, value: string | number]> = [
    ['Updated', pkg.updatedRel],
    ['Consumers', pkg.consumers.length],
    ['Internal deps', pkg.internalDeps.length === 0 ? 'none' : pkg.internalDeps.length],
    ['Public API', `${apiSize(pkg)} exports`],
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: 'var(--tcl-space-2) var(--tcl-space-5)',
        padding: 'var(--tcl-space-3) var(--tcl-space-4)',
        border: '1px solid var(--tcl-border)',
        borderRadius: 'var(--tcl-radius-md)',
        background: 'var(--tcl-surface-sunken)',
      }}
    >
      {items.map(([label, value]) => (
        <span
          key={label}
          style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--tcl-space-2)' }}
        >
          <Text size="xs" tone="dim">
            {label}
          </Text>
          <Text size="sm" weight="semibold">
            {value}
          </Text>
        </span>
      ))}
    </div>
  );
}

// ── dependency relationships (tabular) ───────────────────────────────────────
function RelationTables({ pkg }: { pkg: PackageDossier }) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--tcl-space-5)',
        // Full-width at typical card sizes (long package names need the room); the
        // two tables sit side by side only when the panel is genuinely wide.
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        alignItems: 'start',
      }}
    >
      <Stack gap={2}>
        <Text as="h3" size="sm" weight="semibold">
          Peer dependencies
        </Text>
        <Table density="compact" aria-label="Peer dependencies">
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Package</Table.HeaderCell>
              <Table.HeaderCell align="end">Range</Table.HeaderCell>
              <Table.HeaderCell align="end">Required</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {pkg.peerDeps.map((d) => (
              <Table.Row key={d.name}>
                <Table.Cell>
                  <Text mono size="sm">
                    {d.name}
                  </Text>
                </Table.Cell>
                <Table.Cell numeric>{d.range}</Table.Cell>
                <Table.Cell align="end">
                  {d.required ? (
                    <Badge size="sm" tone="info" variant="soft">
                      required
                    </Badge>
                  ) : (
                    <Badge size="sm" tone="neutral" variant="outline">
                      optional
                    </Badge>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Stack>

      <Stack gap={2}>
        <Text as="h3" size="sm" weight="semibold">
          Consumed by
        </Text>
        <Table density="compact" aria-label="Consumed by">
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Consumer</Table.HeaderCell>
              <Table.HeaderCell align="end">Type</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {pkg.consumers.length === 0 ? (
              <Table.Empty colSpan={2}>Nothing depends on this yet.</Table.Empty>
            ) : (
              pkg.consumers.map((c) => (
                <Table.Row key={c.name}>
                  <Table.Cell>
                    <Text mono size="sm">
                      {c.name}
                    </Text>
                  </Table.Cell>
                  <Table.Cell align="end">
                    <Badge size="sm" tone={c.kind === 'game' ? 'accent' : 'info'} variant="soft">
                      {c.kind === 'game' ? 'game repo' : 'package'}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </Stack>
    </div>
  );
}

// ── the detail dossier for one package ───────────────────────────────────────
function PackageDetail({ pkg }: { pkg: PackageDossier }) {
  const note = tierNote(pkg);
  return (
    <Card>
      <Card.Header>
        <Stack gap={3}>
          <Inline justify="between" align="start" wrap gap={3}>
            <Stack gap={1}>
              <Text as="h2" size="lg" weight="bold">
                {pkg.name}
              </Text>
              <Text mono size="xs" tone="dim">
                {pkg.path} · {pkg.monorepo}
              </Text>
            </Stack>
            <ActionBar pkg={pkg} />
          </Inline>
          <StatusChips pkg={pkg} />
          <Text tone="dim" size="sm">
            {pkg.summary}
          </Text>
        </Stack>
      </Card.Header>
      <Card.Body>
        <Stack gap={5}>
          <MetaStrip pkg={pkg} />
          <Callout tone={note.tone} title={note.title}>
            {note.body}
          </Callout>
          {/* Brief owns the reference document: Setup + the progressively-disclosed
              API (Types / Interfaces / Functions / Conventions collapse on click). */}
          <Brief data={toBrief(pkg)} headingLevel={3} defaultCollapsed={COLLAPSED_SECTIONS} />
          <RelationTables pkg={pkg} />
        </Stack>
      </Card.Body>
    </Card>
  );
}

// ── the page: master rail + detail ───────────────────────────────────────────
function PackageDossierPage({ initialId = PACKAGES[0].id }: { initialId?: string }) {
  const [selectedId, setSelectedId] = useState(initialId);
  const selected = PACKAGES.find((p) => p.id === selectedId) ?? PACKAGES[0];

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 'var(--tcl-space-6)' }}>
      <Stack gap={5}>
        <Stack gap={1}>
          <Text as="h1" size="xl" weight="bold">
            Package dossier
          </Text>
          <Text tone="dim">
            A monorepo package viewer — key facts at a glance, with the public API progressively
            disclosed. Select a package to inspect it.
          </Text>
        </Stack>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--tcl-space-5)',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: '1 1 200px', maxWidth: 260 }}>
            <Stack as="nav" gap={2} aria-label="Packages">
              {/* A rail caption, not a heading — the nav is labelled by aria-label, and
                  keeping the only h2 on the package name gives a clean h1 → h2 → h3 outline. */}
              <Text size="xs" weight="semibold" tone="dim">
                Packages
              </Text>
              {PACKAGES.map((p) => (
                <RailItem
                  key={p.id}
                  pkg={p}
                  selected={p.id === selectedId}
                  onSelect={() => setSelectedId(p.id)}
                />
              ))}
            </Stack>
          </div>

          <div style={{ flex: '4 1 460px', minWidth: 0 }}>
            <PackageDetail key={selected.id} pkg={selected} />
          </div>
        </div>
      </Stack>
    </div>
  );
}

const meta = {
  title: 'Examples/Package Dossier',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A Foundation package (logger): status chips, at-a-glance stats, and a Brief whose
 * API sections (Types / Interfaces / Functions / Conventions) expand on click. */
export const Default: Story = {
  render: () => <PackageDossierPage />,
};

/** A beta Feature package (pets-and-mounts): the warning Callout, beta stability chips
 * on each API member, and a deeper internal-dependency chain. */
export const BetaPackage: Story = {
  render: () => <PackageDossierPage initialId="pets-and-mounts" />,
};
