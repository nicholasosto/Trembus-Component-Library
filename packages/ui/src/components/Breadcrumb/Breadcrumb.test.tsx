import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { Breadcrumb } from './Breadcrumb';

const trail = [
  { label: 'Home', href: '/' },
  { label: 'Library', href: '/library' },
  { label: 'Settings' },
];

describe('Breadcrumb', () => {
  it('renders a labelled nav wrapping an ordered list', () => {
    render(<Breadcrumb items={trail} />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav.querySelector('ol')).toBeInTheDocument();
  });

  it('marks the last item as the current page and not a link', () => {
    render(<Breadcrumb items={trail} />);
    const current = screen.getByText('Settings');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.closest('a')).toBeNull();
  });

  it('renders ancestor crumbs as links', () => {
    render(<Breadcrumb items={trail} />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Library' })).toHaveAttribute('href', '/library');
  });

  it('composes asChild children and preserves their own aria-current', () => {
    render(
      <Breadcrumb>
        <Breadcrumb.Item asChild>
          <a href="/">Home</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item asChild>
          <a href="/here" aria-current="page">
            Here
          </a>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('tcl-breadcrumb__link');
    const here = screen.getByRole('link', { name: 'Here' });
    expect(here).toHaveAttribute('aria-current', 'page');
    expect(here).toHaveClass('tcl-breadcrumb__link');
  });

  it('honors asChild for a current crumb instead of wrapping it in a span', () => {
    render(
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item asChild current>
          <span>Current</span>
        </Breadcrumb.Item>
      </Breadcrumb>,
    );
    const current = screen.getByText('Current');
    // The current state is slotted onto the consumer's element — not double
    // wrapped in a <span class="tcl-breadcrumb__current">, which would have left
    // a link activatable.
    expect(current.tagName).toBe('SPAN');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveClass('tcl-breadcrumb__link');
    expect(current.closest('.tcl-breadcrumb__current')).toBeNull();
  });

  it('renders crumbs that share an href without colliding', () => {
    render(
      <Breadcrumb
        items={[{ label: 'Root', href: '/' }, { label: 'Nested', href: '/' }, { label: 'Leaf' }]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Root' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nested' })).toBeInTheDocument();
  });

  it('hides separators from assistive tech', () => {
    const { container } = render(<Breadcrumb items={trail} />);
    const seps = container.querySelectorAll('.tcl-breadcrumb__sep');
    expect(seps).toHaveLength(trail.length - 1);
    seps.forEach((s) => expect(s).toHaveAttribute('aria-hidden', 'true'));
  });

  it('has no axe violations', async () => {
    const { container } = render(<Breadcrumb items={trail} />);
    expect(await a11yViolations(container)).toEqual([]);
  });
});
