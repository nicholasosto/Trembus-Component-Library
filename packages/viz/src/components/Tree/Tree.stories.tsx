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

// A small file tree — folders + per-file-type glyphs (TS vs JS vs JSON at a glance).
const fileTree: TreeContract = {
  view: 'tree',
  code: 'repo.packages.viz.src',
  title: 'src',
  orientation: 'horizontal',
  nodes: [
    { id: 'src', label: 'src', icon: 'folder', tone: 'accent' },
    { id: 'comp', label: 'components', parentId: 'src', icon: 'folder', tone: 'info' },
    { id: 'tree', label: 'Tree.tsx', parentId: 'comp', icon: 'typescript' },
    { id: 'treecss', label: 'Tree.css', parentId: 'comp', icon: 'file' },
    { id: 'internal', label: 'internal', parentId: 'src', icon: 'folder', tone: 'success' },
    { id: 'glyphs', label: 'glyphs.tsx', parentId: 'internal', icon: 'typescript' },
    { id: 'legacy', label: 'legacy.js', parentId: 'internal', icon: 'javascript' },
    { id: 'cfg', label: 'tsconfig.json', parentId: 'src', icon: 'json' },
  ],
};

/**
 * A strict parent→child hierarchy as a node-link diagram — org charts, file trees,
 * dendrograms — laid out by `d3-hierarchy` (tidy Reingold–Tilford or aligned-leaf
 * `dendrogram`) in vertical, horizontal, or radial orientation.
 *
 * ### When to use it
 * - One-parent structure: reporting lines, folder contents, taxonomies, call trees.
 * - Not for graphs — any node with TWO parents or cross-links → `Lineage`.
 * - Not for containment drill-down (boxes inside boxes) → `SystemMap`; not for an
 *   interactive file EXPLORER (checkboxes, filtering, lazy loading) → ui `FolderTree`.
 *
 * ### Data & key props
 * - `data.nodes` — a FLAT list; hierarchy derives from `parentId`. Node `id` is
 *   REQUIRED and unique (the Tier-2 rule: no index fallback — parents reference it).
 * - Forgiving input: multiple roots get a synthetic root; a `parentId` that doesn't
 *   exist re-parents to it — rendered, never thrown.
 * - `orientation` (`vertical` | `horizontal` | `radial`) · `variant` (`tidy` | `dendrogram`).
 * - `selectedId` / `defaultSelectedId` / `onSelect` — the selection trio; `collapsedIds`
 *   / `onToggle` — controlled subtree collapse (a node's `collapsed` seeds it).
 * - Per node: `tone` / `color`, `sub`, `note` (inspector detail), decorative `icon`.
 *
 * ### Accessibility
 * - The SVG scene is `aria-hidden` decoration; every node is a real focusable HTML
 *   `<button>` overlaid on it, and selection is revealed in an `aria-live` inspector.
 * - Node glyphs are decorative — the accessible name is the label (+ `sub`).
 *
 * ### Theming & setup
 * - Untoned nodes cycle tone by depth; explicit `tone` / `color` overrides per node.
 * - Setup: import `@trembus/viz/styles.css` once at the app root (it carries the full
 *   tokens foundation). `@trembus/viz` depends only on `@trembus/tokens` — no ui needed.
 */
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

/** A file tree distinguishing types at a glance — TS vs JS vs JSON vs folders (per-node `icon`). */
export const FileTree: Story = { args: { data: fileTree } };

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
