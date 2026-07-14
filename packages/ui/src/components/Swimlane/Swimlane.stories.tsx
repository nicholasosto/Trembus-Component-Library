import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Swimlane } from './Swimlane';
import type { SwimlaneContract } from './Swimlane';

// A real swimlane contract — the authored Visual Grammar shape. A turn-by-turn
// loop where work crosses between the human, the agent, and its tools.
const shipFeature: SwimlaneContract = {
  view: 'swimlane',
  brand: 'Trembus',
  code: 'workflow.ship-feature',
  title: 'Ship a feature with Claude',
  caption: 'A turn-by-turn human ↔ agent loop. Click any step to inspect its handoff.',
  lanes: [
    { id: 'human', label: 'You', kind: 'human' },
    { id: 'ai', label: 'Claude', kind: 'ai' },
    { id: 'tools', label: 'Tools', kind: 'tool' },
  ],
  steps: [
    {
      id: 'ask',
      lane: 'human',
      label: 'Describe task',
      status: 'done',
      note: 'You describe the change in plain language.',
    },
    {
      id: 'plan',
      lane: 'ai',
      label: 'Draft a plan',
      detail: 'reads the codebase',
      status: 'done',
      note: 'Claude explores the relevant files and proposes an approach for sign-off.',
    },
    { id: 'approve', lane: 'human', label: 'Approve plan', status: 'done' },
    { id: 'code', lane: 'ai', label: 'Write code', status: 'done' },
    {
      id: 'test',
      lane: 'tools',
      label: 'Run tests',
      detail: 'pnpm validate',
      status: 'active',
      note: 'Type-check, unit + a11y, the contract gate, and the build.',
      // a branch: the gate either fails back to Claude, or passes to review
      to: ['fix', 'review'],
    },
    { id: 'fix', lane: 'ai', label: 'Fix failures', status: 'pending' },
    {
      id: 'review',
      lane: 'human',
      label: 'Review diff',
      status: 'pending',
      note: 'You read the diff and request changes or approve.',
    },
    { id: 'merge', lane: 'tools', label: 'Merge & deploy', status: 'pending', to: [] },
  ],
};

const meta = {
  title: 'Visualizations/Swimlane',
  component: Swimlane,
  args: { data: shipFeature },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 820 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Swimlane>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — the full loop; lanes are actors, columns are turns, connectors are handoffs. */
export const Default: Story = {};

/**
 * Job: Afford Action — a leaner research loop where each step is a selectable button,
 * one per status. Lanes are referenced by label and steps carry no ids (index fallback).
 */
export const States: Story = {
  args: {
    data: {
      view: 'swimlane',
      code: 'workflow.research-loop',
      title: 'Deep-research loop',
      caption: 'One pass of question → search → synthesize, with a gap that blocks a re-run.',
      lanes: [
        { label: 'You', kind: 'human' },
        { label: 'Claude', kind: 'ai' },
      ],
      steps: [
        { lane: 'You', label: 'Ask question', status: 'done' },
        { lane: 'Claude', label: 'Search sources', status: 'done' },
        { lane: 'Claude', label: 'Synthesize', status: 'active' },
        {
          lane: 'You',
          label: 'Spot a gap',
          status: 'blocked',
          note: 'A key claim has no primary source — needs another search pass.',
        },
        { lane: 'Claude', label: 'Cite & verify', status: 'pending' },
        { lane: 'Claude', label: 'Translate', status: 'skipped', note: 'Not needed this run.' },
      ],
    },
  },
};

/** Job: Acknowledge Input — selecting a step rings it and reveals its handoff in the live panel. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const step = canvas.getByRole('button', { name: 'Tools: Run tests — Active' });
    await expect(step).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(step);
    await expect(step).toHaveAttribute('aria-pressed', 'true');
    // the inspector announces the handoff targets of the selected step
    await expect(canvas.getByText(/Hands off to/)).toBeInTheDocument();
  },
};

/**
 * The process-board kit: `density="comfortable"` gives step labels two clamped
 * lines instead of an ellipsis; per-step `markers` annotate cards (decision refs,
 * file ops) with each marker's title folded into the step's accessible name; lane
 * heads carry a kind glyph (tooltip = the kind word) instead of a dot + raw word.
 */
export const Comfortable: Story = {
  args: {
    density: 'comfortable',
    data: {
      view: 'swimlane',
      code: 'workflow.component-kit',
      title: 'Component request, intake to release',
      caption: 'Longer step labels wrap; markers carry per-step annotations.',
      lanes: [
        { id: 'human', label: 'You', kind: 'human' },
        { id: 'ai', label: 'Claude', kind: 'ai' },
        { id: 'tools', label: 'Tools', kind: 'tool' },
        { id: 'ci', label: 'Gate', kind: 'system' },
        { id: 'docs', label: 'Docs' },
      ],
      steps: [
        {
          id: 'intake',
          lane: 'human',
          label: 'File the component request with context',
          detail: 'inbox item',
          status: 'done',
        },
        {
          id: 'plan',
          lane: 'ai',
          label: 'Review the request against the codebase',
          detail: 'verifies every claim',
          status: 'done',
          markers: [{ id: 'dec', glyph: 'check', title: 'Realizes decision 0013' }],
        },
        {
          id: 'scaffold',
          lane: 'tools',
          label: 'Scaffold the canonical 5-file shape',
          detail: 'new-component skill',
          status: 'done',
          markers: [{ id: 'files', glyph: 'file', title: 'Creates the 5-file shape' }],
        },
        {
          id: 'build',
          lane: 'ai',
          label: 'Implement the component with regression tests',
          status: 'active',
          markers: [
            { id: 'ts', glyph: 'typescript', title: 'Touches TypeScript sources' },
            { id: 'note', title: 'Tracked in the release plan' },
          ],
        },
        {
          id: 'gate',
          lane: 'ci',
          label: 'Run the full validation gate',
          detail: 'pnpm validate',
          status: 'pending',
          to: ['fix', 'changelog'],
        },
        { id: 'fix', lane: 'ai', label: 'Fix regressions surfaced by the gate', status: 'pending' },
        {
          id: 'changelog',
          lane: 'docs',
          label: 'Record the change in the package changelog',
          status: 'pending',
          to: [],
        },
      ],
    },
  },
};
