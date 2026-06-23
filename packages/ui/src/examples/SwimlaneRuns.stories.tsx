// Example PAGE — a composition of Swimlane + RunHistory, NOT a library component.
// Lives in src/examples/ so `check:contracts` ignores it (composed pages have no single
// 3-jobs contract). Compose from the public barrel ('../index') so it exercises the real
// consumer API. The "magic" — selecting a run time-travels the diagram — lives here, via
// the page-local `applyRun` transform, so Swimlane itself stays untouched.
//
// Run history is treated as an OPTIONAL companion to the flow: a pill switch toggles it,
// and when a workflow has no history the switch is disabled (greyed) and only the flow's
// definition shows. With the switch on, run history sits ABOVE a full-width flow so the
// diagram is never starved for horizontal room.
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
  caption: 'Pick a run to replay its state across the lanes.',
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

// ── page-local pill switch: a true on/off control that greys out (and disables) when
// there is nothing to toggle. role=switch + aria-checked keeps it accessible. ──
function SwitchPill({
  checked,
  onChange,
  label,
  count,
  disabled = false,
  disabledHint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  count?: number;
  disabled?: boolean;
  disabledHint?: string;
}) {
  const on = checked && !disabled; // a disabled switch always reads + paints as off
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      title={disabled ? disabledHint : undefined}
      onClick={() => onChange(!checked)}
      style={{
        appearance: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--tcl-space-2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        font: 'inherit',
        fontSize: 'var(--tcl-text-sm)',
        fontWeight: 600,
        color: disabled ? 'var(--tcl-text-faint)' : on ? 'var(--tcl-text)' : 'var(--tcl-text-dim)',
        padding: '6px 14px 6px 8px',
        borderRadius: 'var(--tcl-radius-full)',
        border: '1px solid var(--tcl-border)',
        background: disabled ? 'var(--tcl-surface-sunken)' : 'var(--tcl-surface-raised)',
        opacity: disabled ? 0.6 : 1,
        boxShadow: on ? 'var(--tcl-elevation-1)' : 'none',
        transition: 'color var(--tcl-dur-fast) var(--tcl-ease-calm)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'relative',
          flex: 'none',
          width: 32,
          height: 18,
          borderRadius: 'var(--tcl-radius-full)',
          background: on ? 'var(--tcl-accent)' : 'var(--tcl-border-strong)',
          transition: 'background var(--tcl-dur-fast) var(--tcl-ease-calm)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            width: 14,
            height: 14,
            borderRadius: 'var(--tcl-radius-full)',
            background: 'var(--tcl-surface-raised)',
            boxShadow: 'var(--tcl-elevation-1)',
            transform: on ? 'translateX(14px)' : 'none',
            transition: 'transform var(--tcl-dur-fast) var(--tcl-ease-calm)',
          }}
        />
      </span>
      <span>
        {label}
        {typeof count === 'number' && (
          <span style={{ fontWeight: 500, color: 'var(--tcl-text-dim)' }}> · {count}</span>
        )}
      </span>
    </button>
  );
}

function WorkflowConsole({ runs }: { runs: RunRecord[] }) {
  const hasRuns = runs.length > 0;
  // start on the failed run (if present) so the time-travel — a blocked test step — shows
  // immediately; otherwise the first run, or nothing when there is no history.
  const [selectedRunId, setSelectedRunId] = useState(
    () => runs.find((r) => r.status === 'failed')?.id ?? runs[0]?.id ?? '',
  );
  const [showRuns, setShowRuns] = useState(true);

  const runsVisible = showRuns && hasRuns;
  const selectedRun = runs.find((r) => r.id === selectedRunId) ?? runs[0];

  // Keep the flow's caption honest about what is (or isn't) being replayed.
  const swimlaneData: SwimlaneContract =
    runsVisible && selectedRun
      ? {
          ...applyRun(base, selectedRun),
          caption: 'Selected run replayed across the lanes — pick another above.',
        }
      : {
          ...base,
          caption: hasRuns
            ? 'Run history is hidden — switch it on to replay past executions.'
            : 'No run history yet — this is the workflow definition.',
        };

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: 'var(--tcl-space-6)' }}>
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
          <SwitchPill
            checked={showRuns}
            onChange={setShowRuns}
            label="Run history"
            count={hasRuns ? runs.length : undefined}
            disabled={!hasRuns}
            disabledHint="No run history configured for this workflow"
          />
        </Inline>

        <Stack gap={5}>
          {runsVisible && (
            <RunHistory
              data={{ ...runLog, runs }}
              selectedRunId={selectedRunId}
              onSelectRun={setSelectedRunId}
            />
          )}
          <Card>
            <Card.Body>
              {/* key by run so the diagram's own step-selection resets on run change */}
              <Swimlane key={runsVisible ? selectedRunId : 'base'} data={swimlaneData} />
            </Card.Body>
          </Card>
        </Stack>
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

/**
 * Run history above a time-travelled Swimlane: pick a run and the flow replays its state.
 * The "Run history" pill switch hides the log to show the bare workflow definition.
 */
export const Default: Story = {
  render: () => <WorkflowConsole runs={RUNS} />,
};

/**
 * A workflow with no recorded runs: the "Run history" switch is disabled (greyed) and only
 * the flow's definition renders — the same component, gracefully degraded.
 */
export const NoHistory: Story = {
  render: () => <WorkflowConsole runs={[]} />,
};
