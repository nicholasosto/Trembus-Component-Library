import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { a11yViolations } from '../../test/a11y';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  it('renders a default bypass link to #main', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveAttribute('href', '#main');
    expect(link).toHaveClass('tcl-skip-link');
  });

  it('accepts a custom target and label', () => {
    render(<SkipLink href="#content">Skip to content</SkipLink>);
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#content',
    );
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <SkipLink />
        <main id="main">content</main>
      </div>,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
