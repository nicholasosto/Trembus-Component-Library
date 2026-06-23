import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { BarChart } from './BarChart';
import type { BarChartContract } from './BarChart';

const data: BarChartContract = {
  view: 'bar-chart',
  code: 'trembus.test.coverage',
  title: 'Coverage',
  unit: '%',
  markers: [{ value: 90, label: 'target' }],
  bars: [
    { id: 'tokens', label: 'Tokens', value: 98, tone: 'success', note: 'Fully covered.' },
    { id: 'comp', label: 'Components', value: 86, tone: 'warning', note: 'Edge cases pending.' },
    { id: 'viz', label: 'Viz', value: 61, tone: 'danger' },
  ],
};

describe('BarChart', () => {
  it('renders a labelled button per bar', () => {
    render(<BarChart data={data} />);
    expect(screen.getByRole('button', { name: 'Tokens: 98%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Components: 86%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Viz: 61%' })).toBeInTheDocument();
  });

  it('shows the header code and an inspector hint by default', () => {
    render(<BarChart data={data} />);
    expect(screen.getByText('trembus.test.coverage')).toBeInTheDocument();
    expect(screen.getByText(/Select a bar/)).toBeInTheDocument();
  });

  it('selects a bar, sets aria-pressed, and reveals its note', async () => {
    const user = userEvent.setup();
    render(<BarChart data={data} />);
    const bar = screen.getByRole('button', { name: 'Components: 86%' });
    expect(bar).toHaveAttribute('aria-pressed', 'false');
    await user.click(bar);
    expect(bar).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Edge cases pending.')).toBeInTheDocument();
  });

  it('calls onSelect with the bar id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<BarChart data={data} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Tokens: 98%' }));
    expect(onSelect).toHaveBeenCalledWith('tokens');
  });

  it('falls back to the label as the id when none is given', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<BarChart data={{ bars: [{ label: 'Solo', value: 10 }] }} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Solo: 10' }));
    expect(onSelect).toHaveBeenCalledWith('Solo');
  });

  it('renders horizontally without error', () => {
    render(<BarChart data={{ ...data, orientation: 'horizontal' }} />);
    expect(screen.getByRole('group', { name: 'Coverage' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<BarChart data={data} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});

const grouped: BarChartContract = {
  view: 'bar-chart',
  code: 'test.grouped',
  title: 'Utilization by team',
  unit: '%',
  categories: ['Platform', 'Data', 'Cloud'],
  series: [
    { id: 'billable', name: 'Billable', tone: 'accent', values: [78, 84, 71] },
    { id: 'target', name: 'Target', tone: 'neutral', values: [80, 80, null] },
  ],
};

describe('BarChart (grouped multi-series)', () => {
  it('renders a labelled button per series × category cell', () => {
    render(<BarChart data={grouped} />);
    expect(screen.getByRole('button', { name: 'Billable, Platform: 78%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Target, Data: 80%' })).toBeInTheDocument();
  });

  it('leaves no button for null values', () => {
    render(<BarChart data={grouped} />);
    // Target has no Cloud value → no button for that slot.
    expect(screen.queryByRole('button', { name: /Target, Cloud/ })).not.toBeInTheDocument();
  });

  it('renders the legend with each series name', () => {
    render(<BarChart data={grouped} />);
    const legend = document.querySelector('.tcl-bar-chart__legend');
    expect(legend).toHaveTextContent('Billable');
    expect(legend).toHaveTextContent('Target');
  });

  it('selects a grouped bar and reveals its series + category', async () => {
    const user = userEvent.setup();
    render(<BarChart data={grouped} />);
    const bar = screen.getByRole('button', { name: 'Billable, Data: 84%' });
    await user.click(bar);
    expect(bar).toHaveAttribute('aria-pressed', 'true');
    const inspector = document.querySelector('.tcl-bar-chart__inspector');
    expect(inspector).toHaveTextContent('Billable');
    expect(inspector).toHaveTextContent('Data · 84%');
  });

  it('calls onSelect with a collision-proof {series}#{category} id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<BarChart data={grouped} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Target, Platform: 80%' }));
    expect(onSelect).toHaveBeenCalledWith('target#0');
  });

  it('has no axe violations in grouped mode', async () => {
    const { container } = render(<BarChart data={grouped} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
