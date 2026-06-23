import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Box } from './Box';

describe('Box', () => {
  it('renders a div with the tcl-box class and resolves padding to token vars', () => {
    render(
      <Box p={4} data-testid="b">
        hi
      </Box>,
    );
    const el = screen.getByTestId('b');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('tcl-box');
    expect(el.style.padding).toContain('var(--tcl-space-4)');
  });

  it('is polymorphic via `as` and applies the surface modifier', () => {
    render(<Box as="section" surface="raised" data-testid="s" />);
    const el = screen.getByTestId('s');
    expect(el.tagName).toBe('SECTION');
    expect(el).toHaveClass('tcl-box--surface-raised');
  });

  it('composes axis padding (px) over a base, leaving the other axis at 0', () => {
    render(<Box px={5} data-testid="p" />);
    const el = screen.getByTestId('p');
    // top/bottom -> 0, left/right -> space-5
    expect(el.style.padding).toBe('0 var(--tcl-space-5) 0 var(--tcl-space-5)');
  });
});
