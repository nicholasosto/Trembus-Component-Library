// Example PAGE — a composition of multiple components, NOT a library component.
// Lives in src/examples/ (outside src/components/) so `check:contracts` ignores it.
// Compose from the public barrel ('../index') so the example exercises the same
// API a consumer would.
//
// The scenario is an LLM planning session — the exact moment DecisionMap exists
// for: the assistant maintains a plan doc (Brief), surfaces ONE open decision as
// a DecisionMap (options + recommendation strength + confidence + downstream
// consequence cascades), and the human locks a pick, which re-renders the same
// contract in its `decided` state. A second, static decided DecisionMap shows
// the at-rest ledger view beside the plan.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Brief, Button, Card, DecisionMap, Inline, Stack, Text } from '../index';
import type { BriefContract, DecisionMapContract } from '../index';

// ── the plan doc the assistant maintains (Brief = the ledger of MADE calls) ──
const BETA_PLAN: BriefContract = {
  view: 'brief',
  kind: 'plan',
  id: 'editor.beta-plan',
  title: 'Collaborative editor — beta plan',
  summary:
    'Ship the multiplayer editor beta behind an invite gate. Decisions already locked live ' +
    'below; the session store is still open — see the decision map.',
  meta: [
    { label: 'phase', value: 'beta' },
    { label: 'open decisions', value: 1 },
    { label: 'target', value: '2026-08' },
  ],
  sections: [
    {
      id: 'locked',
      heading: 'Decisions locked',
      kind: 'decisions',
      items: [
        { text: 'Sync engine', choice: 'CRDT (Yjs)' },
        { text: 'Transport', choice: 'WebSocket with SSE fallback' },
        { text: 'Package manager', choice: 'pnpm' },
      ],
    },
    {
      id: 'next',
      heading: 'Next up',
      kind: 'checklist',
      items: [
        { text: 'Decide the session store (open — see the decision map).', severity: 'warn' },
        { text: 'Load-test the presence channel at 200 concurrent cursors.', severity: 'info' },
        { text: 'Write the invite-gate copy.', severity: 'info' },
      ],
    },
  ],
};

// ── the OPEN decision (the assistant's hand-off to the human) ──
const SESSION_STORE: DecisionMapContract = {
  view: 'decision-map',
  title: 'Where should session state live?',
  context:
    'The editor needs server-side session state for presence + auth. Choose the store before the beta.',
  recommendation: {
    optionId: 'pg',
    strength: 'strong',
    confidence: 82,
    rationale: 'You already run Postgres; sessions are low-write and the ops story is free.',
  },
  options: [
    {
      id: 'pg',
      label: 'Postgres session table',
      summary: 'Sessions live beside the data they guard.',
      tone: 'success',
      effort: 'medium',
      reversibility: 'reversible',
      confidence: 82,
      consequences: [
        {
          label: 'One fewer service to operate',
          tone: 'success',
          likelihood: 'certain',
          horizon: 'immediate',
        },
        {
          label: 'Session reads join the primary DB load',
          tone: 'warning',
          likelihood: 'likely',
          horizon: 'near',
          then: [
            {
              label: 'May need a read replica if the editor takes off',
              tone: 'warning',
              likelihood: 'possible',
              horizon: 'later',
            },
          ],
        },
        {
          label: 'Backups already cover session recovery',
          tone: 'success',
          likelihood: 'certain',
          horizon: 'immediate',
        },
      ],
    },
    {
      id: 'redis',
      label: 'Redis',
      summary: 'A dedicated in-memory session store.',
      tone: 'info',
      effort: 'medium',
      reversibility: 'reversible',
      confidence: 60,
      consequences: [
        {
          label: 'Sub-millisecond session reads',
          tone: 'success',
          likelihood: 'certain',
          horizon: 'immediate',
        },
        {
          label: 'A new service to deploy, monitor, and upgrade',
          tone: 'danger',
          likelihood: 'certain',
          horizon: 'near',
        },
        {
          label: 'Persistence needs its own snapshot story',
          tone: 'warning',
          likelihood: 'likely',
          horizon: 'later',
        },
      ],
    },
    {
      id: 'jwt',
      label: 'Stateless JWT',
      summary: 'No server-side state at all — claims ride the token.',
      tone: 'warning',
      effort: 'low',
      reversibility: 'one-way',
      confidence: 35,
      consequences: [
        {
          label: 'Zero session infrastructure',
          tone: 'success',
          likelihood: 'certain',
          horizon: 'immediate',
        },
        {
          label: 'Issued tokens cannot be revoked',
          tone: 'danger',
          likelihood: 'certain',
          horizon: 'immediate',
          then: [
            {
              label: 'A leaked token stays valid until expiry',
              tone: 'danger',
              likelihood: 'possible',
              horizon: 'later',
            },
          ],
        },
      ],
    },
  ],
};

// ── a decision already decided in an earlier session (the at-rest ledger view) ──
const HOSTING_DECIDED: DecisionMapContract = {
  view: 'decision-map',
  title: 'Where do we host the beta?',
  context: 'Locked in last week’s session — kept here as the worked example of the decided state.',
  status: 'decided',
  decidedId: 'fly',
  decidedNote:
    'Locked 2026-07-04: Fly.io — regional WebSocket latency beat the platform-maturity caution for a beta.',
  recommendation: {
    optionId: 'fly',
    strength: 'moderate',
    confidence: 68,
    rationale: 'Regions near users matter most for multiplayer cursors.',
  },
  options: [
    {
      id: 'fly',
      label: 'Fly.io',
      summary: 'Apps run in regions near users.',
      tone: 'success',
      effort: 'medium',
      reversibility: 'reversible',
      confidence: 68,
      consequences: [
        {
          label: 'Low-latency WebSockets per region',
          tone: 'success',
          likelihood: 'likely',
          horizon: 'immediate',
        },
        {
          label: 'Smaller platform — fewer managed add-ons',
          tone: 'warning',
          likelihood: 'certain',
          horizon: 'near',
        },
      ],
    },
    {
      id: 'aws',
      label: 'AWS (ECS)',
      summary: 'The everything platform.',
      tone: 'info',
      effort: 'high',
      reversibility: 'costly',
      confidence: 55,
      consequences: [
        { label: 'Every managed service on tap', tone: 'success', likelihood: 'certain' },
        {
          label: 'Ops surface area grows immediately',
          tone: 'danger',
          likelihood: 'likely',
          horizon: 'immediate',
        },
      ],
    },
  ],
};

// ── the page ─────────────────────────────────────────────────────────
function PlanningSessionPage() {
  // Controlled selection so the lock-in button knows the current pick. It starts
  // on the recommended option — the same first paint the uncontrolled auto-seed gives.
  const [pick, setPick] = useState<string>('pg');
  // The decision is FROZEN at lock time (lockedId), independent of `pick` — so
  // exploring other options' cascades after locking can't silently re-decide the ledger.
  const [lockedId, setLockedId] = useState<string | null>(null);
  const locked = lockedId !== null;

  const optionName = (id: string): string =>
    SESSION_STORE.options.find((o) => o.id === id)?.label ?? id;

  const sessionStore: DecisionMapContract = lockedId
    ? {
        ...SESSION_STORE,
        status: 'decided',
        decidedId: lockedId,
        decidedNote: `Locked in this session: ${optionName(lockedId)}.`,
      }
    : SESSION_STORE;

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: 'var(--tcl-space-6)' }}>
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
              Trembus · Planning session
            </Text>
            <Text as="h1" size="xl" weight="bold">
              Collaborative editor — beta
            </Text>
          </Stack>
          <Badge tone={locked ? 'success' : 'warning'} dot variant="soft">
            {locked ? 'All decisions locked' : '1 open decision'}
          </Badge>
        </Inline>

        <div
          style={{
            display: 'grid',
            gap: 'var(--tcl-space-5)',
            // collapses to one column on narrow viewports (inline styles can't media-query)
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            alignItems: 'start',
          }}
        >
          {/* LEFT — the plan doc: Brief is the ledger of decisions already MADE */}
          <Card>
            <Card.Body>
              <Brief data={BETA_PLAN} />
            </Card.Body>
          </Card>

          {/* RIGHT — the open decision, then last week's decided one */}
          <Stack gap={5}>
            <Card>
              <Card.Body>
                <Stack gap={4}>
                  <DecisionMap data={sessionStore} selectedId={pick} onSelect={setPick} />
                  <Inline justify="between" align="center" wrap gap={4}>
                    <Text size="sm" tone="dim">
                      {locked
                        ? 'Decision recorded — the map keeps the full consequence trail.'
                        : 'Explore each option’s downstream effects, then lock your pick.'}
                    </Text>
                    <Inline gap={3}>
                      {locked && (
                        <Button variant="ghost" onPress={() => setLockedId(null)}>
                          Reopen
                        </Button>
                      )}
                      <Button onPress={() => setLockedId(pick)} disabled={locked}>
                        {locked ? 'Locked' : `Lock in ${optionName(pick)}`}
                      </Button>
                    </Inline>
                  </Inline>
                </Stack>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <DecisionMap data={HOSTING_DECIDED} />
              </Card.Body>
            </Card>
          </Stack>
        </div>
      </Stack>
    </div>
  );
}

const meta = {
  title: 'Examples/Planning Session',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A planning session composed from the public barrel: the plan doc (`Brief`, the ledger
 * of made calls) beside the open decision (`DecisionMap` — recommendation strength,
 * confidence, consequence cascades), a consumer-owned lock-in flow that re-renders the
 * same contract as `decided`, and a second decision already at rest.
 */
export const Default: Story = {
  render: () => <PlanningSessionPage />,
};
