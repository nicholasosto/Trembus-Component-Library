import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DatabaseIcon, Glyph, GLYPHS, SYSTEM_KIND_GLYPH, EXT_GLYPH, extToGlyph } from './index';

describe('icons', () => {
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

  it('renders nothing for prototype-chain names — junk JSON must not crash', () => {
    // a bare GLYPHS[name] index would resolve these to functions up the
    // prototype chain and React would throw rendering them as components
    for (const name of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
      const { container } = render(<Glyph name={name} />);
      expect(container.querySelector('svg'), name).toBeNull();
    }
  });

  it('exposes tree-shakeable named components', () => {
    const { container } = render(<DatabaseIcon />);
    expect(container.querySelector('[data-glyph="database"]')).toBeTruthy();
  });

  it('every kind in SYSTEM_KIND_GLYPH maps to a real glyph', () => {
    for (const [kind, name] of Object.entries(SYSTEM_KIND_GLYPH)) {
      expect(GLYPHS[name], `kind "${kind}" → "${name}"`).toBeTruthy();
    }
  });

  it('every extension in EXT_GLYPH maps to a real glyph', () => {
    for (const [ext, name] of Object.entries(EXT_GLYPH)) {
      expect(GLYPHS[name], `ext ".${ext}" → "${name}"`).toBeTruthy();
    }
  });

  it('every registered glyph renders an svg stamped with its own name', () => {
    for (const name of Object.keys(GLYPHS)) {
      const { container } = render(<Glyph name={name} />);
      expect(container.querySelector(`[data-glyph="${name}"]`), name).toBeTruthy();
    }
  });

  it('infers file-type glyphs from extensions, all resolving to real glyphs', () => {
    expect(extToGlyph('Button.tsx')).toBe('typescript');
    expect(extToGlyph('readme.md')).toBe('markdown');
    expect(extToGlyph('noext')).toBe('file');
    expect(GLYPHS[extToGlyph('Button.tsx')]).toBeTruthy();
  });
});
