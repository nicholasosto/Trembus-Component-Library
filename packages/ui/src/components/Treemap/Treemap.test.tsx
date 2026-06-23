import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Treemap } from './Treemap';
import type { TreemapContract } from './Treemap';

const data: TreemapContract = {
  view: 'treemap',
  code: 'test.treemap',
  title: 'Portfolio',
  unit: 'h',
  nodes: [
    { id: 'a', label: 'Alpha', value: 60, tone: 'accent', note: 'Biggest.' },
    { id: 'b', label: 'Bravo', value: 30, tone: 'info', note: 'Middle.' },
    { id: 'c', label: 'Charlie', value: 10, tone: 'success', note: 'Smallest.' },
  ],
};

describe('Treemap', () => {
  it('renders a labelled button per node with its share of the total', () => {
    render(<Treemap data={data} />);
    expect(screen.getByRole('button', { name: 'Alpha: 60h, 60% of total' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bravo: 30h, 30% of total' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Charlie: 10h, 10% of total' })).toBeInTheDocument();
  });

  it('shows the header code and an inspector hint by default', () => {
    render(<Treemap data={data} />);
    expect(screen.getByText('test.treemap')).toBeInTheDocument();
    expect(screen.getByText(/Select a cell/)).toBeInTheDocument();
  });

  it('selects a cell, sets aria-pressed, and reveals its note', async () => {
    const user = userEvent.setup();
    render(<Treemap data={data} />);
    const cell = screen.getByRole('button', { name: /Bravo: 30h/ });
    expect(cell).toHaveAttribute('aria-pressed', 'false');
    await user.click(cell);
    expect(cell).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Middle.')).toBeInTheDocument();
  });

  it('calls onSelect with the node id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Treemap data={data} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /Alpha: 60h/ }));
    expect(onSelect).toHaveBeenCalledWith('a');
  });

  it('falls back to the node index as the id when none is given (duplicate labels never collide)', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <Treemap
        data={{
          nodes: [
            { label: 'Dup', value: 50 },
            { label: 'Dup', value: 50 },
          ],
        }}
        onSelect={onSelect}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    await user.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledWith('s1');
  });

  it('omits cells for zero and negative values', () => {
    render(
      <Treemap
        data={{
          nodes: [
            { id: 'real', label: 'Real', value: 40 },
            { id: 'zero', label: 'Zero', value: 0 },
            { id: 'neg', label: 'Neg', value: -10 },
          ],
        }}
      />,
    );
    expect(screen.getByRole('button', { name: /Real: 40/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Zero/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Neg/ })).not.toBeInTheDocument();
  });

  it('renders a no-data state when the total is zero', () => {
    render(<Treemap data={{ title: 'Empty', nodes: [{ label: 'None', value: 0 }] }} />);
    expect(screen.getByText('No data in range')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('exposes a group role for the cells', () => {
    render(<Treemap data={data} />);
    expect(screen.getByRole('group', { name: 'Portfolio' })).toBeInTheDocument();
  });

  it('renders a single node filling the box', () => {
    render(<Treemap data={{ nodes: [{ id: 'solo', label: 'Solo', value: 99 }] }} />);
    expect(screen.getByRole('button', { name: 'Solo: 99, 100% of total' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Treemap data={data} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
