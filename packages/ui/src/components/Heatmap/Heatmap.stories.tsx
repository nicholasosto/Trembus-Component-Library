import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Heatmap } from './Heatmap';
import type { HeatmapContract } from './Heatmap';

const weeks = ['Apr 7', 'Apr 14', 'Apr 21', 'Apr 28', 'May 5', 'May 12', 'May 19', 'May 26'];

// The PMO utilization heatmap: resource × week, bucketed against the 75% target.
const util: HeatmapContract = {
  view: 'heatmap',
  code: 'pmo.delivery.util',
  title: 'Utilization heatmap — resource × week',
  caption: 'Utilized ÷ basis hours, billable resources. Select a cell to inspect it.',
  unit: '%',
  columns: weeks,
  stops: [
    { at: 0, tone: 'danger', label: '< 45%' },
    { at: 45, tone: 'warning', label: '45–65' },
    { at: 65, tone: 'info', label: '65–75' },
    { at: 75, tone: 'success', label: '≥ 75%' },
  ],
  rows: [
    { label: 'Dana Okafor', sub: 'Cloud', cells: [82, 88, 91, 92, 86, 78, 84, 90] },
    { label: 'Sam Reyes', sub: 'Data', cells: [71, 68, 74, 80, 83, 79, 72, 76] },
    { label: 'Priya Nair', sub: 'Cloud', cells: [55, 61, 58, 64, 70, 66, 62, 59] },
    { label: 'Jonah Kim', sub: 'Security', cells: [44, 39, 52, 48, 55, 61, 47, 43] },
    { label: 'Mara Vance', sub: 'Data', cells: [90, 92, 88, 85, 91, 94, 89, 87] },
    { label: 'Theo Blume', sub: 'Design', cells: [38, 42, 35, 49, 51, 44, 40, 46] },
  ],
};

/**
 * A rows × columns intensity matrix: every cell shaded by its value on a bucketed
 * or continuous scale. It consumes the Trembus Visual Grammar **heatmap
 * contract**. Lead job: **reveal state** — the pattern across two categorical
 * axes reads at a glance; selection drills into one cell (or one whole row).
 *
 * ### When to use it
 * - Density/intensity across two categorical axes: resource × week, kind × day.
 * - Not for reading one series precisely — use `LineChart` / `BarChart`; for a
 *   master-detail list of records, use `selectionMode="row"` here or a `Table`.
 *
 * ### Data & key props
 * - `data.columns: string[]` + `data.rows` —
 *   `{ id?, label, display?, sub?, cells: (number|null)[] }`;
 *   `label` stays a **string** (it is the accessible
 *   name), use `display` for rich header content; `null` = a no-data cell.
 * - Scale: `stops` (bucketed) or a continuous tone ramp over `min`/`max`
 *   (defaults to the data extent); `columnTones` gives each column its own ramp
 *   on the shared domain; `showValues` prints values in cells.
 * - `selectionMode="cell"` (default) uses `selectedId`/`defaultSelectedId`/`onSelect`
 *   with `"{rowIndex}#{colIndex}"` ids; `"row"` uses `selectedRowId`/
 *   `defaultSelectedRowId`/`onSelectRow` (`HeatmapRow.id`, else the row index;
 *   duplicate explicit ids resolve first-authored-wins).
 * - `showInspector` / `showScale` (both default `true`).
 *
 * ### Accessibility
 * - In cell mode every populated cell is a real `<button>` with `aria-pressed`
 *   and a "row, column: value" name; no-data cells are named `role="img"`
 *   placeholders. In row mode the whole row is one button carrying `aria-current`
 *   and a name that enumerates every column/value pair; its cells go decorative.
 * - Selection is announced via the `aria-live` (`aria-atomic`) inspector — and
 *   when `showInspector={false}`, a hidden live region still announces it.
 * - Cell/row transitions stop under `prefers-reduced-motion`.
 *
 * ### Theming & setup
 * - The continuous scale is tokens-only: the tone color-mixed over
 *   `--tcl-surface-sunken`, legible in light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Visualizations/Heatmap',
  component: Heatmap,
  args: { data: util },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ width: 560, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Heatmap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Job: Reveal State — resource × week shaded by a bucketed utilization scale. */
export const Default: Story = {};

/** Job: Afford Action — a compact continuous-scale grid with values and a no-data cell. */
export const States: Story = {
  args: {
    data: {
      view: 'heatmap',
      code: 'pmo.time.dirt-dow',
      title: 'DIRT by day-of-week × cost center',
      caption: 'Average submission lag (days); hatched = no hours that day.',
      unit: 'd',
      tone: 'warning',
      showValues: true,
      columns: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      rows: [
        { label: 'CC-Cloud', cells: [2.1, 1.4, 1.2, 0.9, 0.6] },
        { label: 'CC-Data', cells: [1.8, 1.6, 1.1, 1.0, 0.8] },
        { label: 'CC-Security', cells: [2.4, 1.9, null, 1.3, 0.7] },
      ],
    },
  },
};

/** Job: Acknowledge Input — selecting a cell rings it and reveals its value. */
export const Interaction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByRole('button', { name: 'Dana Okafor, Apr 28: 92%' });
    await expect(cell).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(cell);
    await expect(cell).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText(/Apr 28 · 92%/)).toBeInTheDocument();
  },
};

/**
 * Per-column tone — each metric colors off its own ramp (`columnTones`) so reads,
 * writes, and errors read distinctly. Values share one domain, so the built-in
 * single-tone legend is turned off (a multi-tone matrix is best paired with a
 * consumer legend or none).
 */
export const TwoToneColumns: Story = {
  args: {
    showScale: false,
    data: {
      view: 'heatmap',
      code: 'assets.io.by-kind',
      title: 'Asset I/O by kind — reads · writes · errors',
      caption: 'Each column on its own tone ramp; values 0–100.',
      showValues: true,
      columns: ['Reads', 'Writes', 'Errors'],
      columnTones: ['success', 'info', 'danger'],
      rows: [
        { label: 'textures/', cells: [92, 40, 6] },
        { label: 'audio/', cells: [61, 55, 18] },
        { label: 'models/', cells: [74, 33, 2] },
        { label: 'shaders/', cells: [48, 71, 27] },
      ],
    },
  },
};

/** The Asset-Studio "impact constellation": entity-kind impact columns on the accent
 *  ramp + a trailing lineage column on a second tone, decisions as SELECTABLE ROWS,
 *  built-in inspector + scale OFF, clicking a row drives the consumer's own drawer. */
const decisions: HeatmapContract = {
  view: 'heatmap',
  code: 'assets.decisions.constellation',
  title: 'Decision impact — entity kinds × lineage',
  columns: ['Player', 'Enemy', 'Ability', 'World', 'Lineage'],
  columnTones: ['accent', 'accent', 'accent', 'accent', 'info'],
  rows: [
    {
      id: 'd-01',
      label: 'AS-14 Rename SoulCard',
      display: (
        <>
          <span style={{ color: 'var(--tcl-accent)' }}>AS-14</span> Rename SoulCard
        </>
      ),
      sub: 'accepted',
      cells: [0.9, 0.2, 0.6, 0.3, 0.7],
    },
    {
      id: 'd-02',
      label: 'AS-21 Split ability registry',
      display: (
        <>
          <span style={{ color: 'var(--tcl-accent)' }}>AS-21</span> Split registry
        </>
      ),
      sub: 'proposed',
      cells: [0.4, 0.5, 0.95, 0.6, 0.8],
    },
    {
      id: 'd-03',
      label: 'AS-08 Merge world tiles',
      display: (
        <>
          <span style={{ color: 'var(--tcl-accent)' }}>AS-08</span> Merge world tiles
        </>
      ),
      sub: 'accepted',
      cells: [0.2, 0.3, 0.25, 0.9, 0.4],
    },
    {
      id: 'd-04',
      label: 'AS-30 Enemy tier rebalance',
      display: (
        <>
          <span style={{ color: 'var(--tcl-accent)' }}>AS-30</span> Enemy rebalance
        </>
      ),
      sub: 'in review',
      cells: [0.3, 0.92, 0.5, 0.45, 0.55],
    },
  ],
};

function ConstellationDemo() {
  const [sel, setSel] = useState<string | undefined>('d-02');
  const selected = decisions.rows.find((r) => r.id === sel);
  return (
    <div style={{ display: 'grid', gap: 'var(--tcl-space-4)' }}>
      <Heatmap
        data={decisions}
        selectionMode="row"
        selectedRowId={sel}
        onSelectRow={setSel}
        showInspector={false}
        showScale={false}
      />
      <aside
        style={{
          padding: 'var(--tcl-space-3) var(--tcl-space-4)',
          background: 'var(--tcl-surface)',
          border: '1px solid var(--tcl-border)',
          borderLeft: '3px solid var(--tcl-accent)',
          borderRadius: 'var(--tcl-radius-md)',
        }}
      >
        {selected ? (
          <>
            <p style={{ margin: 0, fontWeight: 600 }}>{selected.label}</p>
            <p
              style={{
                margin: '4px 0 0',
                color: 'var(--tcl-text-dim)',
                fontSize: 'var(--tcl-text-sm)',
              }}
            >
              Status: {selected.sub} · consumer-owned drawer
            </p>
          </>
        ) : (
          <p style={{ margin: 0, color: 'var(--tcl-text-faint)' }}>Select a decision.</p>
        )}
      </aside>
    </div>
  );
}

/**
 * Row-select master-detail: `selectionMode="row"` turns each decision into one
 * focusable button (whole-row click, `aria-current` + accent rail); the built-in
 * inspector/scale are off and a click updates the consumer's own panel below.
 */
export const RowSelect: Story = {
  name: 'Row select (master-detail)',
  render: () => <ConstellationDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const row = canvas.getByRole('button', { name: /AS-08 Merge world tiles/ });
    await expect(row).not.toHaveAttribute('aria-current');
    await userEvent.click(row);
    await expect(row).toHaveAttribute('aria-current', 'true');
    await expect(canvas.getByText(/Status: accepted/)).toBeInTheDocument();
  },
};
