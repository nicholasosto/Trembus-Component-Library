import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Tree } from './Tree';
import type { TreeContract } from './Tree';

// An authored org-chart contract — the Visual Grammar `tree` shape.
const orgChart: TreeContract = {
  view: 'org-chart',
  brand: 'Trembus',
  code: 'pmo.delivery.org',
  title: 'Delivery org',
  caption: 'Click a node to inspect its path to the root.',
  nodes: [
    {
      id: 'cdo',
      label: 'Chief Delivery Officer',
      sub: '3 reports',
      tone: 'accent',
      note: 'Owns delivery across platform, data, and ops.',
    },
    { id: 'plat', label: 'Platform', parentId: 'cdo', tone: 'info', sub: 'Engineering' },
    { id: 'data', label: 'Data', parentId: 'cdo', tone: 'success', sub: 'Analytics' },
    { id: 'ops', label: 'Delivery Ops', parentId: 'cdo', tone: 'warning', sub: 'PMO' },
    {
      id: 'plat-a',
      label: 'Team Alpha',
      parentId: 'plat',
      note: 'Owns the component library.',
    },
    { id: 'plat-b', label: 'Team Beta', parentId: 'plat', note: 'Owns the design system.' },
    { id: 'data-a', label: 'Pipelines', parentId: 'data', note: 'Ingestion + transforms.' },
    { id: 'data-b', label: 'Modeling', parentId: 'data', note: 'Semantic models + KPIs.' },
    { id: 'ops-a', label: 'Capacity', parentId: 'ops', note: 'Staffing + utilization.' },
  ],
  orientation: 'vertical',
};

// A small file tree — used to show the dendrogram variant.
const fileTree: TreeContract = {
  view: 'tree',
  code: 'repo.packages.viz.src',
  title: 'src',
  nodes: [
    { id: 'src', label: 'src', tone: 'accent' },
    { id: 'comp', label: 'components', parentId: 'src', tone: 'info' },
    { id: 'tree', label: 'Tree', parentId: 'comp' },
    { id: 'line', label: 'Lineage', parentId: 'comp' },
    { id: 'internal', label: 'internal', parentId: 'src', tone: 'success' },
    { id: 'overlay', label: 'VizOverlay', parentId: 'internal' },
    { id: 'hooks', label: 'hooks', parentId: 'internal' },
  ],
};

const meta = {
  title: 'Visualizations/Tree',
  component: Tree,
  args: { data: orgChart },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 620, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — parent→child structure as a tidy node-link layout. */
export const Default: Story = {};

/** Job: Afford Action — orientations, the dendrogram variant, and a pre-collapsed subtree. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '2rem' }}>
      <Tree data={{ ...orgChart, title: 'Horizontal', orientation: 'horizontal' }} />
      <Tree data={{ ...fileTree, title: 'Dendrogram (aligned leaves)', variant: 'dendrogram' }} />
      <Tree
        data={{
          ...orgChart,
          title: 'Data subtree collapsed',
          nodes: orgChart.nodes.map((n) => (n.id === 'data' ? { ...n, collapsed: true } : n)),
        }}
      />
    </div>
  ),
};

/** Job: Acknowledge Input — selecting rings the node + reveals ancestry; toggling collapses a subtree. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Selecting a node reveals its note + ancestry in the live inspector.
    const alpha = canvas.getByRole('button', { name: /Team Alpha, level 3/ });
    await expect(alpha).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(alpha);
    await expect(alpha).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/Owns the component library\./)).toBeInTheDocument();

    // Collapsing Platform hides its descendants.
    const collapse = canvas.getByRole('button', { name: /Collapse Platform/ });
    await userEvent.click(collapse);
    await expect(canvas.queryByRole('button', { name: /Team Alpha, level 3/ })).toBeNull();
  },
};
