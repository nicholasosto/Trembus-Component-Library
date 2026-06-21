import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Text } from './Text';

describe('Text', () => {
  it('renders a span by default and applies the tone color', () => {
    render(
      <Text tone="accent" data-testid="t">
        hi
      </Text>,
    );
    const el = screen.getByTestId('t');
    expect(el.tagName).toBe('SPAN');
    expect(el.style.color).toContain('var(--tcl-accent)');
  });

  it('uses `as` for meaning (a heading is exposed as a heading role)', () => {
    render(<Text as="h1">Title</Text>);
    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument();
  });

  it('applies mono + truncate modifiers', () => {
    render(
      <Text mono truncate data-testid="m">
        x
      </Text>,
    );
    expect(screen.getByTestId('m')).toHaveClass('tcl-text--mono', 'tcl-text--truncate');
  });
});
