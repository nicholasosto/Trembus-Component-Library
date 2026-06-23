import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Gauge } from './Gauge';
import type { GaugeProps } from './Gauge';

const zones: GaugeProps['zones'] = [
  { upTo: 1, tone: 'success', label: 'on target' },
  { upTo: 2, tone: 'warning', label: 'slipping' },
  { upTo: 3, tone: 'danger', label: 'late' },
];

describe('Gauge', () => {
  it('exposes a meter with value bounds and a textual value', () => {
    render(<Gauge value={1.2} max={3} unit="d" zones={zones} label="DIRT lag" />);
    const meter = screen.getByRole('meter', { name: 'DIRT lag' });
    expect(meter).toHaveAttribute('aria-valuenow', '1.2');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '3');
    // value sits in the second band → "slipping"
    expect(meter).toHaveAttribute('aria-valuetext', '1.2d, slipping');
  });

  it('renders the value readout and label', () => {
    render(<Gauge value={1.2} max={3} unit="d" label="DIRT lag" />);
    expect(screen.getByText('1.2')).toBeInTheDocument();
    expect(screen.getByText('d')).toBeInTheDocument();
    expect(screen.getByText('DIRT lag')).toBeInTheDocument();
  });

  it('draws one arc per zone plus a track', () => {
    const { container } = render(<Gauge value={1.2} max={3} zones={zones} />);
    expect(container.querySelectorAll('.tcl-gauge__zone')).toHaveLength(3);
    expect(container.querySelector('.tcl-gauge__track')).toBeInTheDocument();
  });

  it('draws a single value arc when no zones are given', () => {
    const { container } = render(<Gauge value={2} max={4} tone="info" />);
    expect(container.querySelectorAll('.tcl-gauge__zone')).toHaveLength(1);
  });

  it('renders a target tick and label', () => {
    const { container } = render(
      <Gauge value={1.2} max={3} unit="d" target={{ value: 1.0, label: '≤ 1.0d' }} />,
    );
    expect(container.querySelector('.tcl-gauge__target')).toBeInTheDocument();
    expect(screen.getByText('target ≤ 1.0d')).toBeInTheDocument();
  });

  it('clamps the value consistently across aria-valuenow, aria-valuetext, and the readout', () => {
    render(<Gauge value={9} max={3} unit="d" zones={zones} label="Over" />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '3');
    // valuetext and the visible readout must agree with valuenow (no "9" leaking through)
    expect(meter).toHaveAttribute('aria-valuetext', '3d, late');
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('9')).not.toBeInTheDocument();
  });

  it('announces only the number when the value sits past the last zone', () => {
    // zones top out at 2 but max is 3 → 2.5 is in no band
    render(<Gauge value={2.5} max={3} unit="d" zones={zones.slice(0, 2)} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', '2.5d');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Gauge value={1.2} max={3} unit="d" zones={zones} target={{ value: 1 }} label="DIRT lag" />,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
