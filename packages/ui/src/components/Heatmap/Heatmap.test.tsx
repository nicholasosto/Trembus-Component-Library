import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { Heatmap } from './Heatmap';
import type { HeatmapContract } from './Heatmap';

const data: HeatmapContract = {
  view: 'heatmap',
  code: 'pmo.test.util',
  title: 'Utilization',
  unit: '%',
  columns: ['W1', 'W2', 'W3'],
  stops: [
    { at: 0, tone: 'danger', label: '< 45%' },
    { at: 45, tone: 'warning', label: '45–75' },
    { at: 75, tone: 'success', label: '≥ 75%' },
  ],
  rows: [
    { label: 'Dana', sub: 'Cloud', cells: [82, 88, 91] },
    { label: 'Jonah', sub: 'Security', cells: [44, null, 52] },
  ],
};

describe('Heatmap', () => {
  it('renders a labelled button per populated cell', () => {
    render(<Heatmap data={data} />);
    expect(screen.getByRole('button', { name: 'Dana, W1: 82%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jonah, W3: 52%' })).toBeInTheDocument();
  });

  it('renders no-data cells as a non-interactive placeholder', () => {
    const { container } = render(<Heatmap data={data} />);
    // Jonah/W2 is null → not a button
    expect(screen.queryByRole('button', { name: /Jonah, W2/ })).not.toBeInTheDocument();
    expect(container.querySelector('.tcl-heatmap__cell--empty')).toBeInTheDocument();
  });

  it('selects a cell, sets aria-pressed, and reveals its value in the inspector', async () => {
    const user = userEvent.setup();
    render(<Heatmap data={data} />);
    const cell = screen.getByRole('button', { name: 'Dana, W2: 88%' });
    expect(cell).toHaveAttribute('aria-pressed', 'false');
    await user.click(cell);
    expect(cell).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/W2 · 88%/)).toBeInTheDocument();
    expect(screen.getByText(/Cloud/)).toBeInTheDocument();
  });

  it('calls onSelect with the row#col id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Heatmap data={data} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Dana, W1: 82%' }));
    expect(onSelect).toHaveBeenCalledWith('0#0');
  });

  it('ignores a selectedId that points outside the grid or at a no-data cell', () => {
    render(<Heatmap data={data} selectedId="0#99" />);
    expect(screen.getByText(/Select a cell/)).toBeInTheDocument();
  });

  it('renders a bucketed scale legend', () => {
    render(<Heatmap data={data} />);
    expect(screen.getByText('< 45%')).toBeInTheDocument();
    expect(screen.getByText('≥ 75%')).toBeInTheDocument();
  });

  it('falls back to a continuous scale when no stops are given', () => {
    const { container } = render(
      <Heatmap
        data={{ columns: ['A', 'B'], tone: 'info', rows: [{ label: 'R', cells: [10, 90] }] }}
      />,
    );
    expect(container.querySelector('.tcl-heatmap__scale-gradient')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Heatmap data={data} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
