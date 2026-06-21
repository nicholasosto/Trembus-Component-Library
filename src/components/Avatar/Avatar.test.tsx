import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders initials and an accessible name from `name`', () => {
    render(<Avatar name="Ada Lovelace" />);
    const avatar = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(avatar).toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('falls back to initials when the image fails to load', () => {
    render(<Avatar src="broken.png" name="Grace Hopper" />);
    const img = screen.getByRole('img', { name: 'Grace Hopper' }).querySelector('img');
    expect(img).not.toBeNull();
    fireEvent.error(img as HTMLImageElement);
    expect(screen.getByText('GH')).toBeInTheDocument();
  });

  it('is decorative (hidden) when it has no identity', () => {
    const { container } = render(<Avatar data-testid="a" />);
    const el = screen.getByTestId('a');
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.tcl-avatar__fallback')).not.toBeNull();
  });

  it('has no axe violations', async () => {
    const { container } = render(<Avatar name="Ada Lovelace" tone="info" />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
