import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Table } from './Table';
import type { SortDescriptor } from './Table';

/**
 * A composable data table on real `<table>` semantics — compound parts
 * (`Table.Caption/Head/Body/Foot/Row/HeaderCell/Cell/Empty`) instead of a
 * column-config API, so the markup stays yours. Lead job: **reveal state** — rows of
 * records with sort, selection, and emptiness all perceivable.
 *
 * ### When to use it
 * - Records with mixed columns: names, owners, figures, row links.
 * - Not for rows × columns intensity matrices — use `Heatmap`; execution logs
 *   already have `RunHistory`, which builds on this Table.
 *
 * ### Data & key props
 * - Sorting is CONTROLLED: `sortDescriptor: {column, direction}` + `onSortChange` —
 *   the table renders the indicators; YOUR code reorders the data. Mark sortable
 *   columns with `HeaderCell sortKey`.
 * - `selectionMode="multiple"` adds a checkbox column with a tri-state select-all;
 *   wire `selectedKeys` / `defaultSelectedKeys` / `onSelectionChange` and give each
 *   body `Row` a `rowKey`.
 * - `Table.Row href` / `onClick` — the whole row becomes a stretched link/button.
 * - Levers: `density` (`comfortable` default | `compact`) · `striped` · `sticky` +
 *   `maxHeight` · `Cell align` / `numeric` · `Table.Empty colSpan`.
 *
 * ### Accessibility
 * - Header cells are `<th scope="col">`; sortable ones render a real `<button>` and
 *   reflect `aria-sort` on the column.
 * - Selection checkboxes carry accessible names ("Select all rows" / "Select row").
 * - Row links/buttons are real focusable elements hosted in the first cell, so
 *   keyboard activation works; name the table with `Table.Caption` or `aria-label`.
 *
 * ### Theming & setup
 * - Zebra, hover, and `[data-selected]` states paint from surface tokens; works in
 *   light · dark · reliquary via `[data-theme]`.
 * - Setup: import `@trembus/ui/styles.css` once at the app root (it carries the full tokens foundation).
 */
const meta = {
  title: 'Components/Table',
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

interface Engagement {
  id: string;
  name: string;
  owner: string;
  revenue: number;
}

const DATA: Engagement[] = [
  { id: 'acme', name: 'Acme migration', owner: 'Dana', revenue: 124000 },
  { id: 'globex', name: 'Globex rollout', owner: 'Priya', revenue: 86500 },
  { id: 'initech', name: 'Initech audit', owner: 'Sam', revenue: 43200 },
  { id: 'umbrella', name: 'Umbrella refit', owner: 'Lee', revenue: 210750 },
  { id: 'soylent', name: 'Soylent pilot', owner: 'Max', revenue: 19800 },
];

function sortBy(rows: Engagement[], sort: SortDescriptor): Engagement[] {
  const col = sort.column as keyof Engagement;
  const out = [...rows].sort((a, b) => {
    const av = a[col];
    const bv = b[col];
    const cmp =
      typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
    return sort.direction === 'asc' ? cmp : -cmp;
  });
  return out;
}

const money = (n: number): string => `$${n.toLocaleString('en-US')}`;

function SortableTable() {
  const [sort, setSort] = useState<SortDescriptor>({ column: 'name', direction: 'asc' });
  const rows = useMemo(() => sortBy(DATA, sort), [sort]);
  return (
    <Table sortDescriptor={sort} onSortChange={setSort} style={{ minWidth: 520 }}>
      <Table.Caption>Q2 engagements — click a header to sort, a row to open</Table.Caption>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell sortKey="name">Engagement</Table.HeaderCell>
          <Table.HeaderCell sortKey="owner">Owner</Table.HeaderCell>
          <Table.HeaderCell sortKey="revenue" align="end">
            Revenue
          </Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {rows.map((r) => (
          <Table.Row key={r.id} href={`#/engagements/${r.id}`}>
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell>{r.owner}</Table.Cell>
            <Table.Cell numeric>{money(r.revenue)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

/**
 * Job: Afford Action — sortable column headers are real buttons, and each row is
 * a stretched link (click anywhere on the row to open it).
 */
export const Default: Story = { render: () => <SortableTable /> };

function StatesShowcase() {
  const [sort, setSort] = useState<SortDescriptor>({ column: 'revenue', direction: 'desc' });
  const rows = useMemo(() => sortBy(DATA, sort), [sort]);
  const many = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => DATA.map((r) => ({ ...r, id: `${r.id}-${i}` }))).flat(),
    [],
  );
  return (
    <div style={{ display: 'grid', gap: 24, maxWidth: 560 }}>
      <Table
        striped
        density="compact"
        selectionMode="multiple"
        defaultSelectedKeys={['umbrella']}
        sortDescriptor={sort}
        onSortChange={setSort}
      >
        <Table.Caption>Striped · compact · one row selected · sorted by revenue</Table.Caption>
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell sortKey="name">Engagement</Table.HeaderCell>
            <Table.HeaderCell sortKey="owner">Owner</Table.HeaderCell>
            <Table.HeaderCell sortKey="revenue" align="end">
              Revenue
            </Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {rows.map((r) => (
            <Table.Row key={r.id} rowKey={r.id}>
              <Table.Cell>{r.name}</Table.Cell>
              <Table.Cell>{r.owner}</Table.Cell>
              <Table.Cell numeric>{money(r.revenue)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <Table sticky maxHeight={200} aria-label="Sticky header example">
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell>Engagement</Table.HeaderCell>
            <Table.HeaderCell>Owner</Table.HeaderCell>
            <Table.HeaderCell align="end">Revenue</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {many.map((r) => (
            <Table.Row key={r.id}>
              <Table.Cell>{r.name}</Table.Cell>
              <Table.Cell>{r.owner}</Table.Cell>
              <Table.Cell numeric>{money(r.revenue)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <Table aria-label="Empty example">
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell>Engagement</Table.HeaderCell>
            <Table.HeaderCell>Owner</Table.HeaderCell>
            <Table.HeaderCell align="end">Revenue</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          <Table.Empty colSpan={3}>No engagements match your filters.</Table.Empty>
        </Table.Body>
      </Table>
    </div>
  );
}

/**
 * Job: Reveal State — zebra striping, a selected row, a live sort caret (aria-sort),
 * a sticky header over a scroll area, and the empty state.
 */
export const States: Story = { render: () => <StatesShowcase /> };

function InteractiveTable() {
  const [sort, setSort] = useState<SortDescriptor | null>(null);
  const rows = useMemo(() => (sort ? sortBy(DATA, sort) : DATA), [sort]);
  return (
    <Table
      selectionMode="multiple"
      defaultSelectedKeys={[]}
      sortDescriptor={sort}
      onSortChange={setSort}
      style={{ minWidth: 520 }}
    >
      <Table.Caption>Sort and select</Table.Caption>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell sortKey="name">Engagement</Table.HeaderCell>
          <Table.HeaderCell sortKey="owner">Owner</Table.HeaderCell>
          <Table.HeaderCell sortKey="revenue" align="end">
            Revenue
          </Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {rows.map((r) => (
          <Table.Row key={r.id} rowKey={r.id}>
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell>{r.owner}</Table.Cell>
            <Table.Cell numeric>{money(r.revenue)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

/**
 * Job: Acknowledge Input — clicking a sort header toggles aria-sort; the
 * select-all checkbox selects every row.
 */
export const Interaction: Story = {
  render: () => <InteractiveTable />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Sorting: clicking the Revenue header marks the column ascending.
    const revenueHeader = canvas.getByRole('columnheader', { name: /Revenue/ });
    await userEvent.click(within(revenueHeader).getByRole('button'));
    await expect(revenueHeader).toHaveAttribute('aria-sort', 'ascending');

    // Select-all: checks every row checkbox.
    const selectAll = canvas.getByLabelText('Select all rows');
    await userEvent.click(selectAll);
    const rowBoxes = canvas.getAllByLabelText('Select row');
    for (const box of rowBoxes) await expect(box).toBeChecked();
  },
};
