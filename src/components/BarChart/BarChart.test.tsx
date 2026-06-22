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
