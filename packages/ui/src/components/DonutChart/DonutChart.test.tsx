import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { DonutChart } from './DonutChart';
import type { DonutContract } from './DonutChart';

const data: DonutContract = {
  view: 'donut',
  code: 'pmo.test.mix',
  title: 'Hours mix',
  unit: 'h',
  segments: [
    { id: 'tm', label: 'T&M', value: 60, tone: 'warning', note: 'Largest book.' },
    { id: 'fp', label: 'Fixed', value: 30, tone: 'success' },
    { id: 'internal', label: 'Internal', value: 10, tone: 'neutral' },
  ],
};

describe('DonutChart', () => {
  it('renders a labelled legend button per segment with its share', () => {
    render(<DonutChart data={data} />);
    expect(screen.getByRole('button', { name: 'T&M: 60h, 60%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fixed: 30h, 30%' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Internal: 10h, 10%' })).toBeInTheDocument();
  });

  it('shows the total in the center by default', () => {
    render(<DonutChart data={data} />);
    expect(screen.getByText('100h')).toBeInTheDocument();
    expect(screen.getByText('total')).toBeInTheDocument();
  });

  it('selects a segment: sets aria-pressed, dims others, swaps the center, reveals the note', async () => {
    const user = userEvent.setup();
    const { container } = render(<DonutChart data={data} />);
    const tm = screen.getByRole('button', { name: 'T&M: 60h, 60%' });
    await user.click(tm);
    expect(tm).toHaveAttribute('aria-pressed', 'true');
    // center swaps to the selected segment
    expect(screen.getByText('60h')).toBeInTheDocument();
    // the other arcs dim
    expect(container.querySelectorAll('.tcl-donut__seg.is-dim')).toHaveLength(2);
    expect(screen.getByText('Largest book.')).toBeInTheDocument();
  });

  it('calls onSelect with the segment id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<DonutChart data={data} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /Fixed/ }));
    expect(onSelect).toHaveBeenCalledWith('fp');
  });

  it('disambiguates two segments that share a label and have no id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <DonutChart
        onSelect={onSelect}
        data={{
          segments: [
            { label: 'Dup', value: 30, note: 'first' },
            { label: 'Dup', value: 70, note: 'second' },
          ],
        }}
      />,
    );
    const buttons = screen.getAllByRole('button', { name: /Dup:/ });
    expect(buttons).toHaveLength(2);
    await user.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledWith('s1');
    expect(screen.getByText('second')).toBeInTheDocument();
    expect(screen.queryByText('first')).not.toBeInTheDocument();
  });

  it('ignores a selectedId that resolves to no segment (no ghost dimming)', () => {
    const { container } = render(<DonutChart data={data} selectedId="ghost" />);
    expect(container.querySelectorAll('.tcl-donut__seg.is-dim')).toHaveLength(0);
    expect(screen.getByText(/Select a segment/)).toBeInTheDocument();
  });

  it('handles an all-zero total without dividing by zero', () => {
    render(
      <DonutChart
        data={{
          segments: [
            { label: 'A', value: 0 },
            { label: 'B', value: 0 },
          ],
        }}
      />,
    );
    expect(screen.getByRole('button', { name: 'A: 0, 0%' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<DonutChart data={data} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
