import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Inline, Stack } from './Stack';

describe('Stack / Inline', () => {
  it('Stack lays out as a flex column with a token gap', () => {
    render(
      <Stack gap={3} data-testid="st">
        <span>a</span>
      </Stack>,
    );
    const el = screen.getByTestId('st');
    expect(el.style.display).toBe('flex');
    expect(el.style.flexDirection).toBe('column');
    expect(el.style.gap).toContain('var(--tcl-space-3)');
  });

  it('Inline lays out as a row and maps justify to justify-content', () => {
    render(<Inline justify="between" data-testid="in" />);
    const el = screen.getByTestId('in');
    expect(el.style.flexDirection).toBe('row');
    expect(el.style.justifyContent).toBe('space-between');
  });
});
