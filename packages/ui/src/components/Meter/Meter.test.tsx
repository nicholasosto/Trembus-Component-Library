import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Meter } from './Meter';

describe('Meter', () => {
  it('exposes a named meter with aria-valuenow', () => {
    render(<Meter value={57} label="Disk usage" />);
    const meter = screen.getByRole('meter', { name: 'Disk usage' });
    expect(meter).toHaveAttribute('aria-valuenow', '57');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
  });

  it('recolors at the active threshold and renders a marker per threshold', () => {
    const { container } = render(
      <Meter
        value={57}
        tone="success"
        variant="threshold"
        thresholds={[
          { value: 50, tone: 'warning' },
          { value: 80, tone: 'danger' },
        ]}
        label="Gauge"
      />,
    );
    // 57 crosses the 50/warning threshold but not 80/danger.
    expect(container.querySelector('.tcl-fillbar--warning')).not.toBeNull();
    expect(container.querySelectorAll('.tcl-fillbar__marker')).toHaveLength(2);
  });

  it('renders one segment per entry in the stacked variant', () => {
    const { container } = render(
      <Meter
        variant="stacked"
        segments={[
          { value: 45, tone: 'info', label: '45%' },
          { value: 30, tone: 'success', label: '30%' },
          { value: 25, tone: 'neutral', label: '25%' },
        ]}
        label="Storage"
      />,
    );
    expect(container.querySelectorAll('.tcl-fillbar__seg')).toHaveLength(3);
    expect(screen.getByRole('meter', { name: 'Storage' })).toHaveAttribute('aria-valuenow', '100');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Meter value={57} tone="success" label="Disk usage" />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
