import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its label with the tone + variant classes', () => {
    render(
      <Badge tone="success" variant="solid">
        Shipped
      </Badge>,
    );
    const el = screen.getByText('Shipped');
    expect(el).toHaveClass('tcl-badge--success', 'tcl-badge--solid');
  });

  it('renders a decorative dot hidden from assistive tech', () => {
    const { container } = render(<Badge dot>New</Badge>);
    expect(container.querySelector('.tcl-badge__dot')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Badge tone="info">Info</Badge>);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
