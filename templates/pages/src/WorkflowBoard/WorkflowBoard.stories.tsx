// Storybook is the ITERATION surface for this template — not a consumer.
// Demo data adapted from the Examples/SwimlaneRuns page; the template itself is
// props-fed (that IS its contract demonstrated).
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { RunRecord, RunStepOutcome, SwimlaneContract } from '@trembus/ui';
import { WorkflowBoard } from './WorkflowBoard';

const workflow: SwimlaneContract = {
  view: 'swimlane',
  brand: 'Trembus',
  code: 'workflow.ship-feature',
  title: 'Ship a feature with Claude',
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

const now = Date.now();
const min = 60_000;
const hr = 60 * min;

const runs: RunRecord[] = [
  {
    id: 'r129',
    label: '#129',
    status: 'running',
    startedAt: now - 3 * min,
    trigger: 'manual',
    note: 'In flight — waiting on the test gate.',
    stepOutcomes: [...done(['ask', 'plan', 'approve', 'code']), { step: 'test', status: 'active' }],
    outputs: [{ label: 'live log', href: '#', kind: 'log' }],
  },
  {
    id: 'r128',
    label: '#128',
    status: 'failed',
    startedAt: now - 2 * hr,
    durationMs: 4 * min + 12_000,
    trigger: 'manual',
    note: 'Type-check failed at the test gate; fixed in #127.',
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
    durationMs: 3 * min + 48_000,
    trigger: 'manual',
    note: 'Gate passed after the #128 fix; merged to main.',
    stepOutcomes: done(ALL),
    outputs: [
      { label: 'PR #482', href: '#', kind: 'pr' },
      { label: 'deploy · web-1f3a', href: '#', kind: 'deploy' },
    ],
  },
];

const meta = {
  title: 'Templates/WorkflowBoard',
  component: WorkflowBoard,
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'Ship a feature with Claude',
    workflow,
    runs,
    dataStatus: 'live',
    updatedAt: now - 4 * min,
    updatedLabel: 'Updated 4m ago',
    metrics: [
      { id: 'runs', label: 'runs', value: String(runs.length) },
      { id: 'lanes', label: 'lanes', value: String(workflow.lanes.length) },
    ],
    onRefresh: () => {},
  },
} satisfies Meta<typeof WorkflowBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The full board: status bar, toolbar, run history (failed run pre-selected so
 * the time-travel — a blocked test step — shows immediately), inspector. */
export const Default: Story = {};

/** No recorded runs: the Run history switch disables, the toolbar slot renders
 * nothing (no onRefresh), and the bare workflow definition shows. */
export const NoHistory: Story = {
  args: {
    runs: [],
    onRefresh: undefined,
    dataStatus: undefined,
    updatedAt: undefined,
    updatedLabel: undefined,
    metrics: undefined,
  },
};
