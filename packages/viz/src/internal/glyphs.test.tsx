import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Glyph, GLYPHS, SYSTEM_KIND_GLYPH } from './glyphs';

describe('Glyph', () => {
  it('renders a known glyph carrying its data-glyph + aria-hidden', () => {
    const { container } = render(<Glyph name="database" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('data-glyph')).toBe('database');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders nothing for an unknown name (safe to call eagerly)', () => {
    const { container } = render(<Glyph name="does-not-exist" />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('every kind in SYSTEM_KIND_GLYPH maps to a real glyph', () => {
    for (const [kind, name] of Object.entries(SYSTEM_KIND_GLYPH)) {
      expect(GLYPHS[name], `kind "${kind}" → "${name}"`).toBeTruthy();
    }
  });

  it('every registered glyph renders an svg stamped with its own name', () => {
    for (const name of Object.keys(GLYPHS)) {
      const { container } = render(<Glyph name={name} />);
      expect(container.querySelector(`[data-glyph="${name}"]`), name).toBeTruthy();
    }
  });
});
