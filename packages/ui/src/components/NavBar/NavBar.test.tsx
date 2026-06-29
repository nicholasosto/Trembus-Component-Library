import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { NavBar } from './NavBar';

describe('NavBar', () => {
  it('renders a labelled nav with a list of links', () => {
    render(
      <NavBar aria-label="Primary">
        <NavBar.Link href="/">Home</NavBar.Link>
        <NavBar.Link href="/about" active>
          About
        </NavBar.Link>
      </NavBar>,
    );
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    expect(nav.querySelector('ul')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('marks only the active link with aria-current', () => {
    render(
      <NavBar>
        <NavBar.Link href="/">Home</NavBar.Link>
        <NavBar.Link href="/about" active>
          About
        </NavBar.Link>
      </NavBar>,
    );
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('renders a plain href link', () => {
    render(
      <NavBar>
        <NavBar.Link href="/x">X</NavBar.Link>
      </NavBar>,
    );
    expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute('href', '/x');
  });

  it('composes asChild and preserves the child own aria-current', () => {
    render(
      <NavBar>
        <NavBar.Link asChild>
          <a href="/active" aria-current="page">
            Active
          </a>
        </NavBar.Link>
      </NavBar>,
    );
    const link = screen.getByRole('link', { name: 'Active' });
    expect(link).toHaveClass('tcl-navbar__link');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('clears a wrapped child aria-current when active is explicitly false', () => {
    render(
      <NavBar>
        <NavBar.Link asChild active={false}>
          <a href="/" aria-current="page">
            Home
          </a>
        </NavBar.Link>
      </NavBar>,
    );
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <NavBar aria-label="Primary">
        <NavBar.Link href="/" active>
          Home
        </NavBar.Link>
        <NavBar.Link href="/about">About</NavBar.Link>
      </NavBar>,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
