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

// A continuous-scale grid with a per-column tone on the trailing column, used for
// the row-select + columnTones coverage. The third row has no id (index fallback).
const rowData: HeatmapContract = {
  columns: ['A', 'B', 'C'],
  columnTones: ['accent', 'accent', 'info'],
  rows: [
    { id: 'r1', label: 'One', sub: 'x', cells: [0.2, 0.6, 0.9] },
    { id: 'r2', label: 'Two', cells: [0.5, 0.1, 0.4] },
    { label: 'Three', cells: [0.7, 0.3, 0.8] },
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

  it('cell mode colors each cell off its column tone (columnTones)', () => {
    render(
      <Heatmap
        data={{
          columns: ['A', 'B'],
          columnTones: ['success', 'danger'],
          rows: [{ label: 'R', cells: [10, 90] }],
        }}
      />,
    );
    const a = screen.getByRole('button', { name: 'R, A: 10' });
    const b = screen.getByRole('button', { name: 'R, B: 90' });
    expect(a.style.background).toContain('var(--tcl-status-success)');
    expect(b.style.background).toContain('var(--tcl-status-danger)');
  });

  it('row mode: renders one button per row and no per-cell buttons', () => {
    const { container } = render(<Heatmap data={rowData} selectionMode="row" />);
    expect(screen.getAllByRole('button')).toHaveLength(3); // one per row
    expect(screen.queryByRole('button', { name: /One, A/ })).not.toBeInTheDocument();
    expect(container.querySelectorAll('.tcl-heatmap__row')).toHaveLength(3);
    // cells are decorative (still tinted, still color off their column tone)
    const statics = container.querySelectorAll('.tcl-heatmap__cell--static');
    expect(statics).toHaveLength(9);
    expect((statics[0] as HTMLElement).style.background).toContain('var(--tcl-accent)');
    expect((statics[2] as HTMLElement).style.background).toContain('var(--tcl-status-info)');
  });

  it('row mode: clicking a row emits onSelectRow with its id (index fallback when absent)', async () => {
    const onSelectRow = vi.fn();
    const user = userEvent.setup();
    render(<Heatmap data={rowData} selectionMode="row" onSelectRow={onSelectRow} />);
    await user.click(screen.getByRole('button', { name: 'One · x' }));
    expect(onSelectRow).toHaveBeenCalledWith('r1');
    await user.click(screen.getByRole('button', { name: 'Three' }));
    expect(onSelectRow).toHaveBeenCalledWith('2'); // no id → row index as a string
  });

  it('row mode: marks the selected row aria-current and reveals it in the inspector', () => {
    render(<Heatmap data={rowData} selectionMode="row" selectedRowId="r2" />);
    const row = screen.getByRole('button', { name: 'Two' });
    expect(row).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: 'One · x' })).not.toHaveAttribute('aria-current');
    // the inspector (not just the row header) reflects the selection
    expect(
      screen.getByText('Two', { selector: '.tcl-heatmap__inspector-title' }),
    ).toBeInTheDocument();
  });

  it('renders a ReactNode display in the row header while label stays the accessible name', () => {
    render(
      <Heatmap
        data={{
          columns: ['A'],
          rows: [{ id: 'r1', label: 'Serial One', display: <em>styled</em>, cells: [0.5] }],
        }}
        selectionMode="row"
      />,
    );
    expect(screen.getByText('styled')).toBeInTheDocument(); // visual node
    expect(screen.getByRole('button', { name: 'Serial One' })).toBeInTheDocument(); // string name
  });

  it('showInspector=false hides the inspector but keeps a hidden aria-live region', () => {
    const { container } = render(<Heatmap data={data} selectedId="0#0" showInspector={false} />);
    expect(container.querySelector('.tcl-heatmap__inspector')).not.toBeInTheDocument();
    const live = container.querySelector('.tcl-heatmap__sr-live');
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent('Dana, W1: 82%'); // selection still announced
  });

  it('showScale=false hides the scale legend', () => {
    const { container } = render(<Heatmap data={data} showScale={false} />);
    expect(container.querySelector('.tcl-heatmap__scale')).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Heatmap data={data} />);
    expect(await a11yViolations(container)).toEqual([]);
  });

  it('has no axe violations in row mode', async () => {
    const { container } = render(<Heatmap data={rowData} selectionMode="row" selectedRowId="r1" />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
