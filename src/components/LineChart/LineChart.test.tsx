import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { a11yViolations } from '../../test/a11y';
import { LineChart } from './LineChart';
import type { LineChartContract } from './LineChart';

const data: LineChartContract = {
  view: 'line-chart',
  code: 'pmo.test.dirt',
  title: 'DIRT trend',
  unit: 'd',
  target: { value: 1.0, label: 'target 1.0d' },
  band: { lo: 0.5, hi: 1.5, label: 'tolerance' },
  series: [
    {
      id: 'raw',
      name: 'DIRT raw',
      tone: 'warning',
      points: [
        { x: 'W1', y: 2.1 },
        { x: 'W2', y: null },
        { x: 'W3', y: 1.3, note: 'Improving after the policy nudge.' },
        { x: 'W4', y: 1.0 },
      ],
    },
    {
      id: 'mon',
      name: 'DIRT Monday',
      tone: 'info',
      dashed: true,
      points: [
        { x: 'W1', y: 1.4 },
        { x: 'W2', y: 1.2 },
        { x: 'W3', y: 0.9 },
        { x: 'W4', y: 0.7 },
      ],
    },
  ],
};

describe('LineChart', () => {
  it('renders the header code and target / band labels', () => {
    render(<LineChart data={data} />);
    expect(screen.getByText('pmo.test.dirt')).toBeInTheDocument();
    expect(screen.getByText('target 1.0d')).toBeInTheDocument();
    expect(screen.getByText('tolerance')).toBeInTheDocument();
  });

  it('renders a labelled button per finite point and skips null gaps', () => {
    render(<LineChart data={data} />);
    expect(screen.getByRole('button', { name: 'DIRT raw, W1: 2.1d' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'DIRT raw, W3: 1.3d' })).toBeInTheDocument();
    // W2 of the raw series is null → no button for it
    expect(screen.queryByRole('button', { name: /DIRT raw, W2/ })).not.toBeInTheDocument();
    // the Monday series still has W2
    expect(screen.getByRole('button', { name: 'DIRT Monday, W2: 1.2d' })).toBeInTheDocument();
  });

  it('does not emit NaN coordinates for series with gaps', () => {
    const { container } = render(<LineChart data={data} />);
    for (const line of container.querySelectorAll('.tcl-line-chart__line')) {
      expect(line.getAttribute('points')).not.toMatch(/NaN/);
    }
  });

  it('selects a point, sets aria-pressed, and reveals its note', async () => {
    const user = userEvent.setup();
    render(<LineChart data={data} />);
    const point = screen.getByRole('button', { name: 'DIRT raw, W3: 1.3d' });
    expect(point).toHaveAttribute('aria-pressed', 'false');
    await user.click(point);
    expect(point).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Improving after the policy nudge.')).toBeInTheDocument();
  });

  it('calls onSelect with the composite point id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<LineChart data={data} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'DIRT raw, W1: 2.1d' }));
    expect(onSelect).toHaveBeenCalledWith('raw#0');
  });

  it('renders a single-point series as one selectable dot with no line', () => {
    const { container } = render(
      <LineChart data={{ series: [{ name: 'Solo', points: [{ x: 'W1', y: 5 }] }] }} />,
    );
    expect(screen.getByRole('button', { name: 'Solo, W1: 5' })).toBeInTheDocument();
    expect(container.querySelector('.tcl-line-chart__line')).not.toBeInTheDocument();
  });

  it('disambiguates two series that share a name and have no id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <LineChart
        onSelect={onSelect}
        data={{
          series: [
            { name: 'Dup', points: [{ x: 'W1', y: 1, note: 'first series' }] },
            { name: 'Dup', points: [{ x: 'W1', y: 9, note: 'second series' }] },
          ],
        }}
      />,
    );
    // the two points are distinct buttons; selecting the second resolves to it
    await user.click(screen.getByRole('button', { name: 'Dup, W1: 9' }));
    expect(onSelect).toHaveBeenCalledWith('s1#0');
    expect(screen.getByText('second series')).toBeInTheDocument();
    expect(screen.queryByText('first series')).not.toBeInTheDocument();
  });

  it('crops points outside a forced yMin/yMax instead of floating phantom buttons', () => {
    render(
      <LineChart
        data={{
          yMin: 4,
          series: [{ name: 'S', points: [0, 5, 10].map((y, i) => ({ x: `W${i}`, y })) }],
        }}
      />,
    );
    // y=0 is below the forced floor → no button for it
    expect(screen.queryByRole('button', { name: 'S, W0: 0' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'S, W1: 5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'S, W2: 10' })).toBeInTheDocument();
  });

  it('exposes the plot as a group naming the target and band for assistive tech', () => {
    render(<LineChart data={data} />);
    expect(
      screen.getByRole('group', { name: /DIRT trend, target 1d, tolerance band 0.5d to 1.5d/ }),
    ).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<LineChart data={data} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
