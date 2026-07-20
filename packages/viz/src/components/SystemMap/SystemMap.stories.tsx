import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { SystemMap } from './SystemMap';
import type { SystemMapContract } from './SystemMap';

// A C4-style architecture: at the root it reads as a Context diagram (actors +
// systems); drilling a container unfolds its Containers, then its Components — and
// deep component-to-component edges aggregate up to the visible level.
const saas: SystemMapContract = {
  view: 'c4',
  brand: 'Trembus',
  code: 'arch.storefront',
  title: 'Storefront platform',
  caption: 'Open a container (⌕) to drill in; select a node to inspect its interfaces and links.',
  direction: 'TB',
  nodes: [
    // ── root / context level ──
    { id: 'customer', label: 'Customer', kind: 'actor' },
    { id: 'admin', label: 'Operator', kind: 'actor' },
    { id: 'shop', label: 'Storefront platform', kind: 'system', sub: 'our product' },
    { id: 'stripe', label: 'Stripe', kind: 'external', sub: 'payments' },
    { id: 'sendgrid', label: 'SendGrid', kind: 'external', sub: 'email' },
    // ── containers (inside shop) ──
    { id: 'web', label: 'Web app', parentId: 'shop', kind: 'container', sub: 'React SPA' },
    { id: 'api', label: 'API', parentId: 'shop', kind: 'container', sub: 'Node service' },
    { id: 'worker', label: 'Worker', parentId: 'shop', kind: 'container', sub: 'queue consumer' },
    { id: 'db', label: 'Database', parentId: 'shop', kind: 'datastore', sub: 'Postgres' },
    // ── components (inside web) ──
    { id: 'storefront', label: 'Storefront', parentId: 'web', kind: 'component' },
    { id: 'account', label: 'Account', parentId: 'web', kind: 'component' },
    // ── components (inside api) ──
    { id: 'auth', label: 'Auth', parentId: 'api', kind: 'component', note: 'Sessions & tokens.' },
    { id: 'catalog', label: 'Catalog', parentId: 'api', kind: 'component' },
    { id: 'orders', label: 'Orders', parentId: 'api', kind: 'component' },
    {
      id: 'billing',
      label: 'Billing',
      parentId: 'api',
      kind: 'component',
      note: 'Invoicing & charges.',
    },
    // ── components (inside worker) ──
    { id: 'emailer', label: 'Emailer', parentId: 'worker', kind: 'component' },
    { id: 'indexer', label: 'Indexer', parentId: 'worker', kind: 'component' },
  ],
  ports: [
    { id: 'shop-store', nodeId: 'shop', label: '/shop', direction: 'provided' },
    { id: 'shop-admin', nodeId: 'shop', label: '/admin', direction: 'provided' },
    { id: 'web-ui', nodeId: 'web', label: '/ui', direction: 'provided' },
    { id: 'api-v1', nodeId: 'api', label: '/v1', direction: 'provided' },
    { id: 'bill-inv', nodeId: 'billing', label: '/invoices', direction: 'provided' },
    { id: 'bill-charge', nodeId: 'billing', label: '/charge', direction: 'required' },
    { id: 'auth-session', nodeId: 'auth', label: '/session', direction: 'provided' },
    { id: 'cat-products', nodeId: 'catalog', label: '/products', direction: 'provided' },
    { id: 'orders-products', nodeId: 'orders', label: '/products', direction: 'required' },
  ],
  edges: [
    { from: 'customer', to: 'storefront', kind: 'uses' },
    { from: 'admin', to: 'account', kind: 'uses' },
    { from: 'storefront', to: 'catalog', kind: 'sync' },
    { from: 'storefront', to: 'orders', kind: 'sync' },
    { from: 'account', to: 'auth', kind: 'sync' },
    { from: 'orders', to: 'billing', kind: 'sync' },
    { from: 'orders', to: 'catalog', kind: 'sync' },
    { from: 'orders', to: 'db', kind: 'data' },
    { from: 'catalog', to: 'db', kind: 'data' },
    { from: 'auth', to: 'db', kind: 'data' },
    { from: 'billing', to: 'stripe', kind: 'sync', label: 'charge' },
    { from: 'orders', to: 'emailer', kind: 'async', dashed: true },
    { from: 'emailer', to: 'sendgrid', kind: 'sync' },
    { from: 'indexer', to: 'catalog', kind: 'async', dashed: true },
  ],
};

/**
 * A nested, drillable C4-style architecture map. The same flat model reads at every
 * altitude: the top level is a Context diagram, drilling into a container reveals its
 * children (semantic zoom), a breadcrumb trail walks back up, and edges that cross the
 * visible boundary aggregate up to it instead of disappearing.
 *
 * ### When to use it
 * - Architecture with CONTAINMENT — systems holding containers holding components
 *   (C4 Context → Container → Component), plus provided/required interfaces.
 * - Not for flat dependency stories → `Lineage`; not for class-level UML members →
 *   `ClassDiagram`; not for a strict org-style hierarchy without edges → `Tree`.
 *
 * ### Data & key props
 * - `data.nodes` — FLAT list; `parentId` nesting defines the drill levels; `id` is
 *   REQUIRED and unique (parents, edges, and ports reference it).
 * - `data.edges` may connect nodes at ANY depth — they aggregate to the visible level.
 * - `data.ports` — provided/required interfaces pinned to nodes.
 * - `kind` (`system` | `container` | `component` | `actor` | `datastore` | `external`)
 *   drives the stereotype + tone default; `direction` is the dagre rankdir.
 * - `selectedId` / `defaultSelectedId` / `onSelect` — selection trio;
 *   `defaultFocusId` / `onFocus` — the drilled-into container (`undefined` = top).
 *
 * ### Accessibility
 * - The SVG scene is `aria-hidden` decoration; every node is a real focusable HTML
 *   `<button>`, drill/breadcrumb steps are real controls, and selection is revealed
 *   in an `aria-live` inspector.
 *
 * ### Theming & setup
 * - `kind` supplies tone defaults; explicit `tone` / `color` overrides per node/edge.
 * - Setup: import `@trembus/viz/styles.css` once at the app root (it carries the full
 *   tokens foundation). `@trembus/viz` depends only on `@trembus/tokens` — no ui needed.
 */
const meta = {
  title: 'Visualizations/SystemMap',
  component: SystemMap,
  args: { data: saas },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 760, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SystemMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — the root reads as a C4 Context diagram; deep links aggregate up. */
export const Default: Story = {};

/** Job: Afford Action — the same model at three drill levels (context → containers → components). */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      <SystemMap data={{ ...saas, title: 'Context — all systems', caption: undefined }} />
      <SystemMap
        data={{ ...saas, title: 'Containers — inside the platform', caption: undefined }}
        defaultFocusId="shop"
      />
      <SystemMap
        data={{ ...saas, title: 'Components — inside the API', caption: undefined }}
        defaultFocusId="api"
      />
    </div>
  ),
};

/** Job: Acknowledge Input — drill platform → API, select Billing, read its interfaces. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Drill two levels: platform → API.
    await userEvent.click(canvas.getByRole('button', { name: /Open Storefront platform/ }));
    const apiNode = canvas.getByRole('button', { name: /^API/ });
    await expect(apiNode).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: /Open API/ }));
    // Select a component and read its interfaces in the live inspector.
    const billing = canvas.getByRole('button', { name: /^Billing/ });
    await userEvent.click(billing);
    await expect(billing).toHaveAttribute('aria-pressed', 'true');
    const live = canvasElement.querySelector('[aria-live="polite"]') as HTMLElement;
    await expect(within(live).getByText(/provides \/invoices/)).toBeInTheDocument();
    // The breadcrumb spine can step back out.
    await expect(canvas.getByRole('button', { name: 'All systems' })).toBeInTheDocument();
  },
};
