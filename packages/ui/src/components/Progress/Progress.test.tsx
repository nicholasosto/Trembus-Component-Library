import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Progress } from './Progress';

describe('Progress', () => {
  it('exposes a named progressbar with aria values', () => {
    render(<Progress value={72} label="Upload" />);
    const bar = screen.getByRole('progressbar', { name: 'Upload' });
    expect(bar).toHaveAttribute('aria-valuenow', '72');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('shows the rounded percentage', () => {
    render(<Progress value={72} label="Upload" />);
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('clamps the percentage and aria-valuenow to max', () => {
    render(<Progress value={150} label="Over" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Over' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });

  it('fills the right number of cells in the segments variant', () => {
    const { container } = render(
      <Progress value={50} variant="segments" segments={10} label="Cells" />,
    );
    expect(container.querySelectorAll('.tcl-fillbar__cell')).toHaveLength(10);
    expect(container.querySelectorAll('.tcl-fillbar__cell.is-on')).toHaveLength(5);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Progress value={72} tone="info" label="Upload" />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
