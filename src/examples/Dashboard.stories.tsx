// Example PAGE — a composition of multiple components, NOT a library component.
// Lives in src/examples/ (outside src/components/) so `check:contracts` ignores it:
// composed pages have no single 3-jobs contract. Storybook still picks it up via the
// `src/**/*.stories.tsx` glob. Compose from the public barrel ('../index') so the
// example exercises the same API a consumer would.
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar, Badge, BarChart, Card, Hub, Inline, Meter, Stack, Table, Text } from '../index';
import type { BarChartContract, HubContract, SortDescriptor } from '../index';

// ── the data this page renders ───────────────────────────────────────
const coverage: BarChartContract = {
  view: 'bar-chart',
  title: 'Coverage by area',
  caption: 'Line coverage against the 90% target.',
  unit: '%',
  markers: [{ value: 90, label: 'target', tone: 'success' }],
  bars: [
    { id: 'tokens', label: 'Tokens', value: 98, tone: 'success' },
    { id: 'prims', label: 'Primitives', value: 94, tone: 'success' },
    { id: 'comp', label: 'Components', value: 82, tone: 'warning' },
    { id: 'hooks', label: 'Hooks', value: 72, tone: 'warning' },
    { id: 'viz', label: 'Viz', value: 61, tone: 'danger' },
  ],
};

const platform: HubContract = {
  view: 'hub',
  tagline: 'platform map',
  sub: 'Surfaces sharing one design language.',
  domains: [
    {
      id: 'core',
      pos: 'hub',
      kind: 'center',
      tag: 'Core',
      name: 'Design Language',
      sub: 'tokens + grammar',
      status: 'Shared',
    },
    {
      id: 'web',
      pos: 'robot',
      kind: 'shipped',
      tag: 'Web',
      name: '@trembus/ui',
      sub: 'react',
      status: 'Shipped',
      dot: '#44DDFF',
    },
    {
      id: 'rbx',
      pos: 'blood',
      kind: 'shipped',
      tag: 'Roblox',
      name: 'rbx-ui',
      sub: 'roblox-ts',
      status: 'Shipped',
      dot: '#88FF44',
    },
    {
      id: 'viz',
      pos: 'decay',
      kind: 'current',
      tag: 'Viz',
      name: 'Visualizations',
      sub: 'hub · charts',
      status: 'In progress',
      dot: '#D4AF37',
    },
    {
      id: 'brain',
      pos: 'spirit',
      kind: 'planned',
      tag: 'Brain',
      name: 'Knowledge graph',
      sub: 'concepts',
      status: 'Planned',
    },
    {
      id: 'ops',
      pos: 'fate',
      kind: 'planned',
      tag: 'Ops',
      name: 'Delivery Ops',
      sub: 'kpis',
      status: 'Planned',
    },
  ],
};

interface Row {
  key: string;
  name: string;
  status: 'shipped' | 'current' | 'planned';
  coverage: number;
  owner: string;
}

const ROWS: Row[] = [
  { key: 'barchart', name: 'BarChart', status: 'current', coverage: 61, owner: 'Nicholas Osto' },
  { key: 'hub', name: 'Hub', status: 'shipped', coverage: 92, owner: 'Nicholas Osto' },
  { key: 'table', name: 'Table', status: 'shipped', coverage: 78, owner: 'Ada Lovelace' },
  { key: 'brief', name: 'Brief', status: 'shipped', coverage: 88, owner: 'Ada Lovelace' },
  { key: 'meter', name: 'Meter', status: 'shipped', coverage: 95, owner: 'Grace Hopper' },
];

const STATUS_TONE = { shipped: 'success', current: 'info', planned: 'neutral' } as const;

// ── small local helper (page-local, not a library component) ─────────
function Stat({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <Card>
      <Card.Body>
        <Stack gap={3}>
          <Text
            size="xs"
            tone="faint"
            mono
            style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}
          >
            {label}
          </Text>
          <Text size="xl" weight="bold">
            {value}
          </Text>
          {children}
        </Stack>
      </Card.Body>
    </Card>
  );
}

function PlatformDashboard() {
  const [sort, setSort] = useState<SortDescriptor>({ column: 'coverage', direction: 'desc' });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sorted = [...ROWS].sort((a, b) => {
    const dir = sort.direction === 'asc' ? 1 : -1;
    if (sort.column === 'coverage') return (a.coverage - b.coverage) * dir;
    if (sort.column === 'name') return a.name.localeCompare(b.name) * dir;
    return 0;
  });
  const avg = Math.round(ROWS.reduce((s, r) => s + r.coverage, 0) / ROWS.length);

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'var(--tcl-space-6)' }}>
      <Stack gap={6}>
        {/* header */}
        <Inline justify="between" align="center" wrap gap={4}>
          <Stack gap={1}>
            <Text
              size="xs"
              tone="faint"
              mono
              style={{ textTransform: 'uppercase', letterSpacing: '0.14em' }}
            >
              Trembus
            </Text>
            <Text as="h1" size="xl" weight="bold">
              Platform Dashboard
            </Text>
          </Stack>
          <Inline align="center" gap={3}>
            <Badge tone="accent" variant="outline">
              v0.1.0
            </Badge>
            <Avatar name="Nicholas Osto" size="sm" tone="info" />
          </Inline>
        </Inline>

        {/* stat row */}
        <div
          style={{
            display: 'grid',
            gap: 'var(--tcl-space-5)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          }}
        >
          <Stat label="Test coverage" value="82%">
            <Meter
              value={82}
              tone="warning"
              size="sm"
              showValue={false}
              label="Overall test coverage"
            />
          </Stat>
          <Stat label="Components" value="24">
            <Badge tone="success" variant="soft">
              +3 this week
            </Badge>
          </Stat>
          <Stat label="Open issues" value="30">
            <Inline gap={2} wrap>
              <Badge tone="warning" dot>
                5 high
              </Badge>
              <Badge tone="neutral" variant="soft">
                25 other
              </Badge>
            </Inline>
          </Stat>
          <Stat label="Build" value="Passing">
            <Badge tone="success" dot variant="soft">
              main
            </Badge>
          </Stat>
        </div>

        {/* main viz row — each viz self-titles, so no Card.Header needed */}
        <div
          style={{
            display: 'grid',
            gap: 'var(--tcl-space-5)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          }}
        >
          <Card>
            <Card.Body>
              <BarChart data={coverage} height={200} />
            </Card.Body>
          </Card>
          <Card>
            <Card.Body>
              <Hub data={platform} size={130} />
            </Card.Body>
          </Card>
        </div>

        {/* table */}
        <Card>
          <Card.Header>
            <Inline justify="between" align="center">
              <Text as="h2" size="md" weight="semibold">
                Component status
              </Text>
              <Text size="sm" tone="dim">
                {selected.size > 0 ? `${selected.size} selected` : `${ROWS.length} components`}
              </Text>
            </Inline>
          </Card.Header>
          <Card.Body>
            <Table
              selectionMode="multiple"
              selectedKeys={selected}
              onSelectionChange={setSelected}
              sortDescriptor={sort}
              onSortChange={setSort}
            >
              <Table.Head>
                <Table.Row>
                  <Table.HeaderCell sortKey="name">Component</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell sortKey="coverage" align="end">
                    Coverage
                  </Table.HeaderCell>
                  <Table.HeaderCell>Owner</Table.HeaderCell>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {sorted.map((r) => (
                  <Table.Row key={r.key} rowKey={r.key}>
                    <Table.Cell>
                      <Text weight="medium">{r.name}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge tone={STATUS_TONE[r.status]} dot variant="soft">
                        {r.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell numeric>{r.coverage}%</Table.Cell>
                    <Table.Cell>
                      <Inline gap={2} align="center">
                        <Avatar name={r.owner} size="xs" tone="neutral" />
                        <Text size="sm">{r.owner}</Text>
                      </Inline>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
              <Table.Foot>
                <Table.Row>
                  <Table.Cell>
                    <Text tone="dim">Average</Text>
                  </Table.Cell>
                  <Table.Cell />
                  <Table.Cell numeric>{avg}%</Table.Cell>
                  <Table.Cell />
                </Table.Row>
              </Table.Foot>
            </Table>
          </Card.Body>
        </Card>
      </Stack>
    </div>
  );
}

const meta = {
  title: 'Examples/Dashboard',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A real page composed from the public barrel: stat cards, BarChart + Hub, and a sortable, selectable Table. */
export const Default: Story = {
  render: () => <PlatformDashboard />,
};
