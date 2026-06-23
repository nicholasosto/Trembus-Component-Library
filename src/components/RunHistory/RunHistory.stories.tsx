import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { RunHistory } from './RunHistory';
import type { RunHistoryContract, RunStepOutcome } from './RunHistory';

const now = Date.now();
const min = 60_000;
const hr = 60 * min;

const STEPS = ['ask', 'plan', 'approve', 'code', 'test', 'fix', 'review', 'merge'];
const allDone: RunStepOutcome[] = STEPS.map((step) => ({ step, status: 'done' }));
const failedAtTest: RunStepOutcome[] = [
  ...['ask', 'plan', 'approve', 'code'].map((step) => ({ step, status: 'done' as const })),
  { step: 'test', status: 'blocked', outputs: [{ label: 'ci.log', href: '#', kind: 'log' }] },
  ...['fix', 'review', 'merge'].map((step) => ({ step, status: 'pending' as const })),
];
const runningAtTest: RunStepOutcome[] = [
  ...['ask', 'plan', 'approve', 'code'].map((step) => ({ step, status: 'done' as const })),
  { step: 'test', status: 'active' },
  ...['fix', 'review', 'merge'].map((step) => ({ step, status: 'pending' as const })),
];

// A real run-history contract — past executions of the Swimlane "ship a feature" workflow.
const log: RunHistoryContract = {
  view: 'run-history',
  brand: 'Trembus',
  code: 'workflow.ship-feature.runs',
  title: 'Ship a feature — run history',
  caption: 'Past executions of the workflow. Select a run to see its outputs and results.',
  runs: [
    {
      id: 'r129',
      label: '#129',
      status: 'running',
      startedAt: now - 3 * min,
      trigger: 'manual',
      note: 'In flight — waiting on the test gate.',
      stepOutcomes: runningAtTest,
      outputs: [{ label: 'live log', href: '#', kind: 'log' }],
    },
    {
      id: 'r128',
      label: '#128',
      status: 'failed',
      startedAt: now - 2 * hr,
      durationMs: 4 * min + 12 * 1000,
      trigger: 'manual',
      note: 'Type-check failed on 1 file; fixed in the next run.',
      stepOutcomes: failedAtTest,
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
      id: 'r126',
      label: '#126',
      status: 'cancelled',
      startedAt: now - 26 * hr,
      durationMs: 70 * 1000,
      trigger: 'schedule',
      note: 'Cancelled during review.',
      tally: { done: 6, skipped: 2 },
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
  ],
};

const meta = {
  title: 'Visualizations/RunHistory',
  component: RunHistory,
  args: { data: log },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 760 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RunHistory>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — the run log: each row reveals status, when, duration, steps, outputs. */
export const Default: Story = {};

/** Job: Afford Action — one run per outcome status; each row is a selectable button. */
export const States: Story = {
  args: {
    data: {
      view: 'run-history',
      title: 'Every run status',
      runs: [
        {
          id: 's1',
          label: '#310',
          status: 'succeeded',
          startedAt: now - 1 * hr,
          durationMs: 3 * min,
        },
        {
          id: 's2',
          label: '#309',
          status: 'failed',
          startedAt: now - 2 * hr,
          durationMs: 90 * 1000,
        },
        { id: 's3', label: '#308', status: 'running', startedAt: now - 4 * min },
        {
          id: 's4',
          label: '#307',
          status: 'partial',
          startedAt: now - 3 * hr,
          durationMs: 5 * min,
        },
        {
          id: 's5',
          label: '#306',
          status: 'cancelled',
          startedAt: now - 5 * hr,
          durationMs: 40 * 1000,
        },
        { id: 's6', label: '#305', status: 'queued', startedAt: now - 1 * min },
      ],
    },
  },
};

/** Job: Acknowledge Input — selecting a run reveals its outputs as real links in the live panel. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole('button', { name: /Succeeded #127/ });
    await userEvent.click(row);
    // the inspector now spells out the run's outputs as real links
    await expect(canvas.getByRole('link', { name: /transcript\.md/ })).toBeInTheDocument();
  },
};

/** The empty state when a workflow has never run. */
export const Empty: Story = {
  args: { data: { title: 'Ship a feature — run history', runs: [] } },
};
