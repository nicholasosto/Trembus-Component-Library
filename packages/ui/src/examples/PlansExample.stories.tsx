// Example PAGE — a composition of multiple components, NOT a library component.
// Lives in src/examples/ (outside src/components/) so `check:contracts` ignores it:
// composed pages have no single 3-jobs contract. Storybook still picks it up via the
// `src/**/*.stories.tsx` glob. Compose from the public barrel ('../index') so the
// example exercises the same API a consumer would.
//
// Three jobs, three regions:
//  1. A static `Brief` (kind: 'plan') at the top that documents HOW to add a plan —
//     the page dogfoods Brief twice (this guide + the per-plan detail).
//  2. A filterable, sortable, single-select `Table` of plan summaries (Input search +
//     Select category filter are consumer-owned; Table has no built-in filtering).
//  3. A dynamic `Brief` on the right that re-renders from the selected plan's contract.
import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Brief, Card, Inline, Input, Select, Stack, Table, Text } from '../index';
import type { BadgeProps, BriefContract, BriefItem, SortDescriptor } from '../index';

// ── domain model ─────────────────────────────────────────────────────
type Tier = 'Free' | 'Pro' | 'Enterprise';
type Status = 'Active' | 'Beta' | 'Deprecated';

/** A plan is plain data — every field below drives a piece of the page. */
interface Plan {
  id: string;
  name: string;
  tier: Tier; // → the category filter (Select)
  price: number; // → numeric, sortable column (0 renders as "Free")
  seats: number; // → numeric, sortable column (Infinity renders as "Unlimited")
  status: Status; // → the colored Badge pill
  bestFor: string; // → the detail brief's lead prose
  features: string[]; // → the detail brief's "What's included" checklist
  limits: { text: string; severity?: 'info' | 'warn' }[]; // → the "Limits" checklist
}

const TIERS: Tier[] = ['Free', 'Pro', 'Enterprise'];

const STATUS_TONE: Record<Status, BadgeProps['tone']> = {
  Active: 'success',
  Beta: 'info',
  Deprecated: 'warning',
};

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tier: 'Free',
    price: 0,
    seats: 1,
    status: 'Active',
    bestFor: 'Kicking the tires on a personal project, with no commitment.',
    features: ['1 project', 'Community support', 'Local-only history'],
    limits: [
      { text: 'No team seats — single user only.', severity: 'warn' },
      { text: 'History capped at 7 days.', severity: 'info' },
    ],
  },
  {
    id: 'hobby',
    name: 'Hobby',
    tier: 'Free',
    price: 0,
    seats: 3,
    status: 'Beta',
    bestFor: 'Small side projects shared with a couple of collaborators.',
    features: ['3 projects', 'Up to 3 seats', 'Email support'],
    limits: [
      { text: 'Beta — billing and limits may change.', severity: 'warn' },
      { text: 'No SSO or audit log.', severity: 'info' },
    ],
  },
  {
    id: 'solo',
    name: 'Solo',
    tier: 'Pro',
    price: 12,
    seats: 1,
    status: 'Active',
    bestFor: 'A professional working alone who needs the full toolset.',
    features: ['Unlimited projects', 'Priority email support', '30-day history'],
    limits: [{ text: 'Single seat — add Team for collaborators.', severity: 'info' }],
  },
  {
    id: 'team',
    name: 'Team',
    tier: 'Pro',
    price: 29,
    seats: 10,
    status: 'Active',
    bestFor: 'A growing team that wants shared workspaces and roles.',
    features: ['Up to 10 seats', 'Shared workspaces', 'Role-based access', '90-day history'],
    limits: [{ text: 'No SAML SSO — that lands in Enterprise.', severity: 'info' }],
  },
  {
    id: 'studio',
    name: 'Studio',
    tier: 'Pro',
    price: 59,
    seats: 25,
    status: 'Beta',
    bestFor: 'Agencies juggling many client workspaces at once.',
    features: ['Up to 25 seats', 'Client workspaces', 'Usage analytics'],
    limits: [
      { text: 'Beta — analytics dashboards are still landing.', severity: 'warn' },
      { text: 'No dedicated support contact yet.', severity: 'info' },
    ],
  },
  {
    id: 'legacy-pro',
    name: 'Legacy Pro',
    tier: 'Pro',
    price: 19,
    seats: 5,
    status: 'Deprecated',
    bestFor: 'Existing customers grandfathered on the old Pro pricing.',
    features: ['Up to 5 seats', '90-day history', 'Email support'],
    limits: [
      { text: 'Deprecated — closed to new signups; migrate to Team.', severity: 'warn' },
      { text: 'No new features ship to this plan.', severity: 'info' },
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tier: 'Enterprise',
    price: 199,
    seats: 100,
    status: 'Active',
    bestFor: 'Larger orgs needing SSO, audit logs, and a real contract.',
    features: ['Up to 100 seats', 'SAML SSO', 'Audit log', 'Priority support', '1-year history'],
    limits: [{ text: 'Annual contract required.', severity: 'info' }],
  },
  {
    id: 'scale',
    name: 'Scale',
    tier: 'Enterprise',
    price: 499,
    seats: Infinity,
    status: 'Active',
    bestFor: 'Enterprises that need unlimited seats and a dedicated team.',
    features: [
      'Unlimited seats',
      'Dedicated success manager',
      'Custom data residency',
      '99.9% uptime SLA',
    ],
    limits: [{ text: 'Custom onboarding — talk to sales first.', severity: 'info' }],
  },
];

// ── derived display helpers ──────────────────────────────────────────
const priceLabel = (price: number): string => (price === 0 ? 'Free' : `$${price}/mo`);
const seatsLabel = (seats: number): string =>
  seats === Infinity ? 'Unlimited' : `${seats} seat${seats === 1 ? '' : 's'}`;

/** Build the per-plan detail contract that the right-hand <Brief> renders. */
function briefForPlan(plan: Plan): BriefContract {
  const includes: BriefItem[] = plan.features.map((f) => ({ text: f, severity: 'info' }));
  return {
    view: 'brief',
    kind: 'plan',
    id: `plans.${plan.id}`,
    title: `${plan.name} plan`,
    summary: plan.bestFor,
    meta: [
      { label: 'tier', value: plan.tier },
      { label: 'price', value: priceLabel(plan.price) },
      { label: 'seats', value: seatsLabel(plan.seats) },
      { label: 'status', value: plan.status },
    ],
    sections: [
      { id: 'includes', heading: "What's included", kind: 'checklist', items: includes },
      { id: 'limits', heading: 'Limits', kind: 'checklist', items: plan.limits },
      {
        id: 'reference',
        heading: 'Reference',
        kind: 'reference',
        items: [
          { text: 'Plan terms', ref: 'docs/plans.md' },
          { text: 'Pricing FAQ', ref: 'https://example.com/pricing' },
        ],
      },
    ],
  };
}

// ── the "how to add a plan" guide — a static Brief contract (dogfood) ─
const ADD_PLAN_GUIDE: BriefContract = {
  view: 'brief',
  kind: 'plan',
  id: 'plans.add-a-plan',
  title: 'How to add a plan',
  summary:
    'Plans are plain data. Append one entry to the PLANS array and it shows up in the ' +
    'table, the filters, the sort, and the detail panel automatically — no extra wiring.',
  meta: [
    { label: 'source', value: 'PLANS array' },
    { label: 'steps', value: 3 },
  ],
  sections: [
    {
      id: 'steps',
      heading: 'Add a plan in three steps',
      kind: 'commands',
      items: [
        {
          text: '{ id, name, tier, price, seats, status }',
          desc: 'append a Plan to the PLANS array',
        },
        { text: 'bestFor / features / limits', desc: 'the copy the detail Brief renders' },
        { text: 'save', desc: 'the table, filters, sort & detail panel pick it up automatically' },
      ],
    },
    {
      id: 'fields',
      heading: 'What each field drives',
      kind: 'rules',
      items: [
        { text: 'tier', desc: 'feeds the category filter (Free / Pro / Enterprise)' },
        { text: 'name', desc: 'the searchable text column + a sort key' },
        { text: 'price & seats', desc: 'numeric, sortable columns' },
        { text: 'status', desc: 'the colored Badge pill (Active / Beta / Deprecated)' },
        {
          text: 'briefForPlan(plan)',
          desc: 'derives the BriefContract shown when the row is selected',
        },
      ],
    },
    {
      id: 'gotchas',
      heading: 'Gotchas',
      kind: 'checklist',
      items: [
        {
          text: 'Give every plan a unique id — it keys the row and the selection.',
          severity: 'warn',
        },
        {
          text: 'The detail panel swaps via a React key so collapse state resets per plan.',
          severity: 'info',
        },
      ],
    },
  ],
};

// ── sort: Table emits intent; the consumer reorders the data ─────────
type SortColumn = 'name' | 'price' | 'seats';

function sortPlans(plans: Plan[], sort: SortDescriptor): Plan[] {
  const dir = sort.direction === 'asc' ? 1 : -1;
  const col = sort.column as SortColumn;
  return [...plans].sort((a, b) => {
    if (col === 'name') return a.name.localeCompare(b.name) * dir;
    return (a[col] - b[col]) * dir;
  });
}

// ── the page ─────────────────────────────────────────────────────────
function PlansExamplePage() {
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<'' | Tier>('');
  const [sort, setSort] = useState<SortDescriptor>({ column: 'price', direction: 'asc' });
  const [activeId, setActiveId] = useState<string>(PLANS[0].id);

  // Table has no built-in filtering — the consumer owns it. Filter, then sort.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = PLANS.filter(
      (p) =>
        (tier === '' || p.tier === tier) &&
        (q === '' || p.name.toLowerCase().includes(q) || p.tier.toLowerCase().includes(q)),
    );
    return sortPlans(filtered, sort);
  }, [query, tier, sort]);

  // Selection persists across filtering; the detail panel shows the last pick.
  const activePlan = PLANS.find((p) => p.id === activeId) ?? null;

  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: 'var(--tcl-space-6)' }}>
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
              Trembus · Billing
            </Text>
            <Text as="h1" size="xl" weight="bold">
              Plans
            </Text>
          </Stack>
          <Badge tone="accent" variant="outline">
            {PLANS.length} plans
          </Badge>
        </Inline>

        {/* 1 — how to add a plan (static Brief, dogfooded) */}
        <Card>
          <Card.Body>
            <Brief data={ADD_PLAN_GUIDE} defaultCollapsed={['fields', 'gotchas']} />
          </Card.Body>
        </Card>

        {/* 2 + 3 — filterable/selectable table (left) and dynamic detail (right) */}
        <div
          style={{
            display: 'grid',
            gap: 'var(--tcl-space-5)',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 380px)',
            alignItems: 'start',
          }}
        >
          {/* LEFT — filter bar + summary table */}
          <Card>
            <Card.Header>
              <Inline justify="between" align="center" wrap gap={4}>
                <Text as="h2" size="md" weight="semibold">
                  Compare plans
                </Text>
                <Text size="sm" tone="dim">
                  {visible.length} of {PLANS.length} shown
                </Text>
              </Inline>
            </Card.Header>
            <Card.Body>
              <Stack gap={5}>
                {/* filter controls — consumer-owned (Input + Select) */}
                <Inline gap={4} align="end" wrap>
                  <div style={{ flex: '1 1 220px' }}>
                    <Input
                      label="Search"
                      placeholder="Filter by name…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      size="sm"
                    />
                  </div>
                  <div style={{ flex: '0 0 160px' }}>
                    <Select
                      label="Tier"
                      placeholder="All tiers"
                      value={tier}
                      onChange={(e) => setTier(e.target.value as '' | Tier)}
                      size="sm"
                    >
                      {TIERS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </Select>
                  </div>
                </Inline>

                <Table sortDescriptor={sort} onSortChange={setSort} striped density="compact">
                  <Table.Caption>
                    Click a row to see its details. Sort by tapping a column header.
                  </Table.Caption>
                  <Table.Head>
                    <Table.Row>
                      <Table.HeaderCell sortKey="name">Plan</Table.HeaderCell>
                      <Table.HeaderCell>Tier</Table.HeaderCell>
                      <Table.HeaderCell sortKey="price" align="end">
                        Price
                      </Table.HeaderCell>
                      <Table.HeaderCell sortKey="seats" align="end">
                        Seats
                      </Table.HeaderCell>
                      <Table.HeaderCell>Status</Table.HeaderCell>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {visible.length === 0 ? (
                      <Table.Empty colSpan={5}>No plans match your filters.</Table.Empty>
                    ) : (
                      visible.map((p) => {
                        const isActive = p.id === activeId;
                        return (
                          <Table.Row
                            key={p.id}
                            onClick={() => setActiveId(p.id)}
                            aria-current={isActive ? 'true' : undefined}
                            style={
                              isActive
                                ? {
                                    background: 'var(--tcl-surface-sunken)',
                                    boxShadow: 'inset 3px 0 0 0 var(--tcl-accent)',
                                  }
                                : undefined
                            }
                          >
                            <Table.Cell>
                              <Text weight="medium">{p.name}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              <Text size="sm" tone="dim">
                                {p.tier}
                              </Text>
                            </Table.Cell>
                            <Table.Cell numeric>{priceLabel(p.price)}</Table.Cell>
                            <Table.Cell numeric>{seatsLabel(p.seats)}</Table.Cell>
                            <Table.Cell>
                              <Badge tone={STATUS_TONE[p.status]} dot variant="soft">
                                {p.status}
                              </Badge>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })
                    )}
                  </Table.Body>
                </Table>
              </Stack>
            </Card.Body>
          </Card>

          {/* RIGHT — dynamic detail; swap data with a key to reset collapse state */}
          <Card>
            <Card.Body>
              {activePlan ? (
                <Brief key={activePlan.id} data={briefForPlan(activePlan)} />
              ) : (
                <Stack gap={2} align="center" style={{ padding: 'var(--tcl-space-7) 0' }}>
                  <Text size="md" weight="semibold">
                    No plan selected
                  </Text>
                  <Text size="sm" tone="dim" align="center">
                    Pick a plan from the table to see what it includes.
                  </Text>
                </Stack>
              )}
            </Card.Body>
          </Card>
        </div>
      </Stack>
    </div>
  );
}

const meta = {
  title: 'Examples/Plans Example',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A real page composed from the public barrel: a static how-to `Brief`, a filterable
 * + sortable + single-select plan `Table`, and a dynamic per-plan detail `Brief`.
 */
export const Default: Story = {
  render: () => <PlansExamplePage />,
};
