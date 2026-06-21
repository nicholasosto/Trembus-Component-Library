import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Table } from './Table';
import type { SortDescriptor, TableProps } from './Table';

const ROWS = [
  { id: 'a', name: 'Alpha', n: 3 },
  { id: 'b', name: 'Bravo', n: 1 },
  { id: 'c', name: 'Charlie', n: 2 },
];

function BasicTable(props: Partial<TableProps>) {
  return (
    <Table {...props}>
      <Table.Caption>Demo</Table.Caption>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell sortKey="name">Name</Table.HeaderCell>
          <Table.HeaderCell sortKey="n" align="end">
            Count
          </Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {ROWS.map((r) => (
          <Table.Row key={r.id} rowKey={r.id}>
            <Table.Cell>{r.name}</Table.Cell>
            <Table.Cell numeric>{r.n}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

describe('Table', () => {
  it('renders accessible table semantics', () => {
    render(<BasicTable />);
    expect(screen.getByRole('table', { name: 'Demo' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getAllByRole('row')).toHaveLength(4); // 1 head + 3 body
    expect(screen.getByRole('cell', { name: 'Alpha' })).toBeInTheDocument();
  });

  it('toggles aria-sort and emits sort intent', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    function Controlled() {
      const [sort, setSort] = useState<SortDescriptor | null>(null);
      return (
        <BasicTable
          sortDescriptor={sort}
          onSortChange={(d) => {
            onSortChange(d);
            setSort(d);
          }}
        />
      );
    }
    render(<Controlled />);
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');

    await user.click(within(nameHeader).getByRole('button'));
    expect(onSortChange).toHaveBeenCalledWith({ column: 'name', direction: 'asc' });
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    await user.click(within(nameHeader).getByRole('button'));
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  });

  it('selects all rows via the header checkbox', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(<BasicTable selectionMode="multiple" onSelectionChange={onSelectionChange} />);

    await user.click(screen.getByLabelText('Select all rows'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(['a', 'b', 'c']));
    for (const box of screen.getAllByLabelText('Select row')) expect(box).toBeChecked();
  });

  it('toggles a single row and reflects a tri-state select-all', async () => {
    const user = userEvent.setup();
    render(<BasicTable selectionMode="multiple" />);
    const selectAll = screen.getByLabelText('Select all rows') as HTMLInputElement;
    const [firstRow] = screen.getAllByLabelText('Select row');

    await user.click(firstRow);
    expect(firstRow).toBeChecked();
    expect(selectAll.indeterminate).toBe(true);
    expect(selectAll.checked).toBe(false);
  });

  it('makes an href row a stretched link', () => {
    render(
      <Table>
        <Table.Body>
          <Table.Row href="/x">
            <Table.Cell>Open me</Table.Cell>
            <Table.Cell>second</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(screen.getByRole('link', { name: 'Open me' })).toHaveAttribute('href', '/x');
  });

  it('makes an onClick row a button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Table>
        <Table.Body>
          <Table.Row onClick={onClick}>
            <Table.Cell>Act</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>,
    );
    await user.click(screen.getByRole('button', { name: 'Act' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('spans the select column in the empty state', () => {
    render(
      <Table selectionMode="multiple">
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Count</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          <Table.Empty colSpan={2}>Nothing here</Table.Empty>
        </Table.Body>
      </Table>,
    );
    expect(screen.getByRole('cell', { name: 'Nothing here' })).toHaveAttribute('colspan', '3');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <BasicTable selectionMode="multiple" defaultSelectedKeys={['a']} />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
