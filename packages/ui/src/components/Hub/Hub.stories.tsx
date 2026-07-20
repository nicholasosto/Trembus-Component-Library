import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Hub } from './Hub';
import type { HubContract } from './Hub';

// A real hub contract instance — the same shape as the VG hub.schema.json.
const platform: HubContract = {
  view: 'hub',
  brand: 'Trembus',
  code: 'trembus.platform-map',
  tagline: 'multi-surface ui',
  taglineNote: 'web · roblox · viz',
  sub: 'One design language across surfaces — a web React library, a Roblox UI kit, and a shared visual grammar. Click a domain to inspect it.',
  axis: 'one grammar → many surfaces · hub-and-spoke',
  stats: [
    { label: 'surfaces', value: 3 },
    { label: 'shipped', value: 2, color: '#1a7f37' },
    { label: 'in progress', value: 2, color: '#0969da' },
  ],
  domains: [
    {
      id: 'core',
      pos: 'hub',
      kind: 'center',
      tag: 'Core',
      name: 'Design Language',
      sub: 'tokens + grammar',
      status: 'Shared',
      note: 'The shared token system and visual grammar every surface inherits.',
    },
    {
      id: 'web',
      pos: 'robot',
      kind: 'shipped',
      tag: 'Web',
      name: '@trembus/ui',
      sub: 'react + dom',
      status: 'Shipped',
      dot: '#44DDFF',
      note: '18 components across the three UI jobs — this very library.',
      sources: ['src/index.ts', 'README.md'],
    },
    {
      id: 'rbx',
      pos: 'blood',
      kind: 'shipped',
      tag: 'Roblox',
      name: '@trembus/rbx-ui',
      sub: 'roblox-ts',
      status: 'Shipped',
      dot: '#88FF44',
      note: 'The Roblox-side UI kit — shares ideas, not code, with the web library.',
    },
    {
      id: 'viz',
      pos: 'decay',
      kind: 'current',
      tag: 'Viz',
      name: 'Visualizations',
      sub: 'hub · plans · flows',
      status: 'In progress',
      dot: '#D4AF37',
      note: 'Data-driven views that render the VG contracts — starting with this Hub.',
    },
    {
      id: 'brain',
      pos: 'spirit',
      kind: 'planned',
      tag: 'Brain',
      name: 'Knowledge graph',
      sub: 'concepts + dreams',
      status: 'Planned',
      note: 'Future surface: render the Artificial Brain concept graph.',
    },
    {
      id: 'ops',
      pos: 'fate',
      kind: 'planned',
      tag: 'Ops',
      name: 'Delivery Ops',
      sub: 'kpis + status',
      status: 'Planned',
      note: 'Future surface: operational dashboards from live KPIs.',
    },
    {
      id: 'shared',
      pos: 'shared',
      kind: 'planned',
      tag: 'Shared',
      name: 'Cross-surface',
      sub: 'assets + motion',
      status: 'Cross-cutting',
      dot: '#8b949e',
      note: 'Shared assets, motion easing, and the status ontology used everywhere.',
    },
  ],
};

/**
 * A hex-flower domain overview: one reserved center tile plus up to six satellite
 * petals, each color-coded by kind (center / shipped / current / planned) with a
 * status line. It consumes the Trembus Visual Grammar **hub contract** — the same
 * JSON the static HTML kit renders — with deterministic geometry (no layout
 * engine). Lead job: **reveal state**.
 *
 * ### When to use it
 * - A program/platform map at a glance: what exists, what's active, what's next.
 * - Not when satellites interconnect — use viz `Lineage`; not when containers
 *   nest — use viz `SystemMap`; more than six satellites don't fit, by design.
 *
 * ### Data & key props
 * - `data.domains` — `{ id, pos?, kind, tag, name, sub, status, dot?, note?, sources? }[]`;
 *   `id` is required (the selection identity — duplicates drop, first wins).
 *   `pos` accepts legacy VG slot names (`hub`/`robot`/`blood`/…) or
 *   generic `center`/`n`/`ne`/`se`/`s`/`sw`/`nw`; omit it to auto-place in ring order.
 * - `data.stats` / `tagline` / `taglineNote` / `sub` / `axis` — header + footer chrome.
 * - `selectedId` / `defaultSelectedId` / `onSelect` — the standard selection trio.
 * - `size` — hex tile width in px (default 200; height derives as ~0.866×).
 *
 * ### Accessibility
 * - Tiles are real `<button>`s under `role="group"` (named by the tagline/brand)
 *   with one roving tab stop: Arrow keys move between tiles in DOM order,
 *   Home/End jump to the ends.
 * - Selection sets `aria-pressed`; each tile's accessible name is
 *   "name, tag, status", and the selected domain's note + sources are announced
 *   through the `aria-live` inspector.
 *
 * ### Theming & setup
 * - Kind styling rides `--tcl-accent` / `--tcl-status-*`; optional `dot` /
 *   stat colors take explicit hex. Correct in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Visualizations/Hub',
  component: Hub,
  args: { data: platform },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Hub>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — the full domain topology as a hex flower. */
export const Default: Story = {};

/** Job: Afford Action — the four kinds (center/shipped/current/planned), tiles are buttons. */
export const States: Story = {
  args: {
    data: {
      view: 'hub',
      code: 'kinds.legend',
      domains: [
        {
          id: 'c',
          pos: 'hub',
          kind: 'center',
          tag: 'Center',
          name: 'Reserved',
          sub: 'convergence',
          status: 'Reserved',
        },
        {
          id: 's',
          pos: 'robot',
          kind: 'shipped',
          tag: 'Shipped',
          name: 'Done',
          sub: 'complete',
          status: 'Shipped',
        },
        {
          id: 'p',
          pos: 'decay',
          kind: 'current',
          tag: 'Current',
          name: 'Active',
          sub: 'in progress',
          status: 'In progress',
        },
        {
          id: 'l',
          pos: 'spirit',
          kind: 'planned',
          tag: 'Planned',
          name: 'Later',
          sub: 'not started',
          status: 'Planned',
        },
      ],
    },
  },
};

/** Job: Acknowledge Input — selecting a tile reveals its detail. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tile = canvas.getByRole('button', { name: /@trembus\/ui/ });
    await expect(tile).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(tile);
    await expect(tile).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/18 components/)).toBeInTheDocument();
  },
};
