import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('exposes a busy status with a screen-reader label', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('accepts a custom label', () => {
    render(<Spinner label="Saving…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Spinner tone="accent" />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
