import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders a decorative placeholder with the variant class', () => {
    const { container } = render(<Skeleton variant="rect" width={120} height={20} />);
    const el = container.querySelector('.tcl-skeleton');
    expect(el).toHaveClass('tcl-skeleton--rect');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders one bar per line for multi-line text', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);
    expect(container.querySelectorAll('.tcl-skeleton--text')).toHaveLength(3);
  });

  it('has no axe violations', async () => {
    const { container } = render(<Skeleton variant="rect" width={120} height={20} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
