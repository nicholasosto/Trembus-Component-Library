// Example PAGE — a composition of Swimlane + RunHistory, NOT a library component.
// Lives in src/examples/ so `check:contracts` ignores it (composed pages have no single
// 3-jobs contract). Compose from the public barrel ('../index') so it exercises the real
// consumer API. The "magic" — selecting a run time-travels the diagram — lives here, via
// the page-local `applyRun` transform, so Swimlane itself stays untouched.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, Inline, RunHistory, Stack, Swimlane, Text } from '../index';
import type { RunHistoryContract, RunRecord, RunStepOutcome, SwimlaneContract } from '../index';
import { applyRun } from './applyRun';

// The workflow being run, authored once. Steps carry NO status — each run supplies it.
const base: SwimlaneContract = {
  view: 'swimlane',
  brand: 'Trembus',
  code: 'workflow.ship-feature',
  title: 'Ship a feature with Claude',
  caption: 'Pick a run on the left to replay its state across the lanes.',
  lanes: [
    { id: 'human', label: 'You', kind: 'human' },
    { id: 'ai', label: 'Claude', kind: 'ai' },
    { id: 'tools', label: 'Tools', kind: 'tool' },
  ],
  steps: [
    { id: 'ask', lane: 'human', label: 'Describe task' },
    { id: 'plan', lane: 'ai', label: 'Draft a plan', detail: 'reads the codebase' },
    { id: 'approve', lane: 'human', label: 'Approve plan' },
    { id: 'code', lane: 'ai', label: 'Write code' },
    {
      id: 'test',
      lane: 'tools',
      label: 'Run tests',
      detail: 'pnpm validate',
      to: ['fix', 'review'],
    },
    { id: 'fix', lane: 'ai', label: 'Fix failures' },
    { id: 'review', lane: 'human', label: 'Review diff' },
    { id: 'merge', lane: 'tools', label: 'Merge & deploy', to: [] },
  ],
};

const ALL = ['ask', 'plan', 'approve', 'code', 'test', 'fix', 'review', 'merge'];
const done = (steps: string[]): RunStepOutcome[] => steps.map((step) => ({ step, status: 'done' }));
const allDone: RunStepOutcome[] = done(ALL);

const now = Date.now();
const min = 60_000;
const hr = 60 * min;

const RUNS: RunRecord[] = [
  {
    id: 'r129',
    label: '#129',
    status: 'running',
    startedAt: now - 3 * min,
    trigger: 'manual',
    note: 'In flight — Claude is waiting on the test gate.',
    stepOutcomes: [...done(['ask', 'plan', 'approve', 'code']), { step: 'test', status: 'active' }],
    outputs: [{ label: 'live log', href: '#', kind: 'log' }],
  },
  {
    id: 'r128',
    label: '#128',
    status: 'failed',
    startedAt: now - 2 * hr,
    durationMs: 4 * min + 12 * 1000,
    trigger: 'manual',
    note: 'Type-check failed at the test gate; handed back to Claude and fixed in #127.',
    stepOutcomes: [
      ...done(['ask', 'plan', 'approve', 'code']),
      { step: 'test', status: 'blocked', outputs: [{ label: 'ci.log', href: '#', kind: 'log' }] },
    ],
    outputs: [
      { label: 'ci.log', href: '#', kind: 'log' },
      { label: 'PR #482', href: '#', kind: 'pr' },
    ],
  },
  {
    id: 'r127',
    label: '#127',
    status: 'succeeded',
    startedAt: now - 5 * hr,
    durationMs: 3 * min + 48 * 1000,
    trigger: 'manual',
    note: 'Gate passed on the first attempt after the #128 fix; merged to main.',
    stepOutcomes: allDone,
    outputs: [
      { label: 'PR #482', href: '#', kind: 'pr' },
      { label: 'transcript.md', href: '#', kind: 'doc' },
      { label: 'deploy · web-1f3a', href: '#', kind: 'deploy' },
    ],
  },
  {
    id: 'r125',
    label: '#125',
    status: 'succeeded',
    startedAt: now - 50 * hr,
    durationMs: 4 * min + 2 * 1000,
    stepOutcomes: allDone,
    outputs: [
      { label: 'PR #471', href: '#', kind: 'pr' },
      { label: 'deploy · web-09c2', href: '#', kind: 'deploy' },
    ],
  },
];

const runLog: RunHistoryContract = {
  view: 'run-history',
  title: 'Run history',
  caption: 'Past executions. Select one to replay it on the diagram.',
  runs: RUNS,
};

// ── page-local segmented control (no aria-controls → no dangling refs) ──
function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}) {
  return (
    <div
      role="group"
      aria-label="Layout"
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 2,
        background: 'var(--tcl-surface-sunken)',
        border: '1px solid var(--tcl-border)',
        borderRadius: 'var(--tcl-radius-md)',
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            style={{
              appearance: 'none',
              cursor: 'pointer',
              border: 'none',
              borderRadius: 'var(--tcl-radius-sm)',
              padding: '6px 14px',
              font: 'inherit',
              fontSize: 'var(--tcl-text-sm)',
              fontWeight: active ? 600 : 500,
              color: active ? 'var(--tcl-text)' : 'var(--tcl-text-dim)',
              background: active ? 'var(--tcl-surface-raised)' : 'transparent',
              boxShadow: active ? 'var(--tcl-elevation-1)' : 'none',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function WorkflowConsole() {
  // start on the failed run so the time-travel (a blocked test step) shows immediately
  const [selectedRunId, setSelectedRunId] = useState('r128');
  const [view, setView] = useState<'split' | 'full'>('split');
  const selectedRun = RUNS.find((r) => r.id === selectedRunId) ?? RUNS[0];
  const derived = applyRun(base, selectedRun);

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: 'var(--tcl-space-6)' }}>
      <Stack gap={5}>
        <Inline justify="between" align="center" wrap gap={4}>
          <Stack gap={1}>
            <Text
              size="xs"
              tone="faint"
              mono
              style={{ textTransform: 'uppercase', letterSpacing: '0.14em' }}
            >
              Workflow console
            </Text>
            <Text as="h1" size="xl" weight="bold">
              Ship a feature with Claude
            </Text>
          </Stack>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'split', label: 'Split view' },
              { value: 'full', label: 'Full table' },
            ]}
          />
        </Inline>

        {view === 'split' ? (
          <div
            style={{
              display: 'grid',
              gap: 'var(--tcl-space-5)',
              gridTemplateColumns: 'minmax(0, 540px) minmax(0, 1fr)',
              alignItems: 'start',
            }}
          >
            <RunHistory
              data={runLog}
              density="compact"
              selectedRunId={selectedRunId}
              onSelectRun={setSelectedRunId}
            />
            <Card>
              <Card.Body>
                {/* key by run so the diagram's own step-selection resets on run change */}
                <Swimlane key={selectedRunId} data={derived} />
              </Card.Body>
            </Card>
          </div>
        ) : (
          <RunHistory data={runLog} selectedRunId={selectedRunId} onSelectRun={setSelectedRunId} />
        )}
      </Stack>
    </div>
  );
}

const meta = {
  title: 'Examples/SwimlaneRuns',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Run history beside a time-travelled Swimlane: pick a run and the diagram replays its state. */
export const Default: Story = {
  render: () => <WorkflowConsole />,
};
