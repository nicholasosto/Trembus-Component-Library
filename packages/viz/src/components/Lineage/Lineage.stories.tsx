import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Lineage } from './Lineage';
import type { GraphContract } from './Lineage';

// An authored data-lineage contract — the Visual Grammar `lineage` shape.
const pipeline: GraphContract = {
  view: 'lineage',
  brand: 'Trembus',
  code: 'pmo.data.lineage',
  title: 'Delivery KPI lineage',
  caption: 'Click a node to trace its upstream sources and downstream consumers.',
  direction: 'LR',
  nodes: [
    { id: 'epsa', label: 'EPSA', kind: 'source', sub: 'PSA' },
    { id: 'sfdc', label: 'Salesforce', kind: 'source', sub: 'CRM' },
    { id: 'ns', label: 'NetSuite', kind: 'source', sub: 'GL' },
    { id: 'stg', label: 'Staging', kind: 'transform', sub: 'Lakehouse' },
    { id: 'model', label: 'Semantic model', kind: 'transform', sub: 'Fabric' },
    { id: 'util', label: 'Utilization', kind: 'metric', note: 'Billable ÷ capacity.' },
    { id: 'rev', label: 'Revenue', kind: 'metric', note: 'Recognized revenue.' },
    { id: 'dash', label: 'Exec dashboard', kind: 'sink', sub: 'Power BI' },
  ],
  edges: [
    { from: 'epsa', to: 'stg' },
    { from: 'sfdc', to: 'stg' },
    { from: 'ns', to: 'stg' },
    { from: 'stg', to: 'model' },
    { from: 'model', to: 'util' },
    { from: 'model', to: 'rev' },
    { from: 'util', to: 'dash' },
    { from: 'rev', to: 'dash' },
    { from: 'sfdc', to: 'rev', dashed: true, label: 'inferred' },
  ],
};

// A dependency graph WITH a cycle — exercises dagre's cycle handling.
const deps: GraphContract = {
  view: 'graph',
  code: 'repo.module.deps',
  title: 'Module dependencies (with a cycle)',
  direction: 'TB',
  nodes: [
    { id: 'app', label: 'app', kind: 'entry' },
    { id: 'ui', label: 'ui', kind: 'lib' },
    { id: 'core', label: 'core', kind: 'lib' },
    { id: 'utils', label: 'utils', kind: 'lib' },
  ],
  edges: [
    { from: 'app', to: 'ui' },
    { from: 'app', to: 'core' },
    { from: 'ui', to: 'core' },
    { from: 'core', to: 'utils' },
    { from: 'utils', to: 'core', dashed: true, label: 'cycle' },
  ],
};

const meta = {
  title: 'Visualizations/Lineage',
  component: Lineage,
  args: { data: pipeline },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 720, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Lineage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — a left→right layered pipeline; arrowheads show flow direction. */
export const Default: Story = {};

/** Job: Afford Action — direction variants + a dependency graph with a cycle (dagre-safe). */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <Lineage data={{ ...pipeline, title: 'Top→bottom', direction: 'TB' }} />
      <Lineage data={deps} />
    </div>
  ),
};

/** Job: Acknowledge Input — selecting a node highlights its lineage + dims the rest. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const util = canvas.getByRole('button', { name: /^Utilization/ });
    await expect(util).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(util);
    await expect(util).toHaveAttribute('aria-pressed', 'true');
    // Inspector reveals the connection counts (5 upstream, 1 downstream).
    await expect(canvas.getByText(/5 upstream/)).toBeInTheDocument();
    await expect(canvas.getByText(/1 downstream/)).toBeInTheDocument();
    // Revenue is off Utilization's lineage → not emphasized (but still legible).
    await expect(canvas.getByRole('button', { name: /^Revenue/ })).not.toHaveClass('is-lineage');
    // EPSA is upstream of Utilization → on the lineage.
    await expect(canvas.getByRole('button', { name: /^EPSA/ })).toHaveClass('is-lineage');
  },
};
