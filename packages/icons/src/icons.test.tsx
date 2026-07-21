import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import {
  DatabaseIcon,
  Glyph,
  GLYPHS,
  SYSTEM_KIND_GLYPH,
  OUTPUT_CATEGORY_GLYPH,
  OUTPUT_KIND_GLYPH,
  PROVENANCE_GLYPH,
  EXT_GLYPH,
  extToGlyph,
  WELL_KNOWN_FILE_GLYPH,
  fileToGlyph,
} from './index';

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

  it('every workflow-output category, kind, and provenance maps to a real glyph', () => {
    for (const [map, entries] of Object.entries({
      OUTPUT_CATEGORY_GLYPH,
      OUTPUT_KIND_GLYPH,
      PROVENANCE_GLYPH,
      WELL_KNOWN_FILE_GLYPH,
    })) {
      for (const [key, name] of Object.entries(entries)) {
        expect(GLYPHS[name], `${map} "${key}" → "${name}"`).toBeTruthy();
      }
    }
  });

  it('extends extension inference across media / config / script types', () => {
    expect(extToGlyph('Photo.PNG')).toBe('image');
    expect(extToGlyph('clip.mp4')).toBe('video');
    expect(extToGlyph('theme.wav')).toBe('waveform');
    expect(extToGlyph('Effigy.rbxm')).toBe('model-3d');
    expect(extToGlyph('deploy.sh')).toBe('terminal');
    expect(extToGlyph('config.yaml')).toBe('json');
    expect(extToGlyph('settings.ini')).toBe('sliders');
  });

  it('fileToGlyph recognizes well-known basenames before falling back to extension', () => {
    expect(fileToGlyph('SKILL.md')).toBe('book');
    expect(fileToGlyph('CLAUDE.md')).toBe('robot');
    expect(fileToGlyph('AGENTS.md')).toBe('robot');
    expect(fileToGlyph('MEMORY.md')).toBe('brain');
    expect(fileToGlyph('package.json')).toBe('box');
    expect(fileToGlyph('.env')).toBe('key');
    expect(fileToGlyph('.env.local')).toBe('key');
    expect(fileToGlyph('notes.md')).toBe('markdown'); // non-special .md → extension path
    expect(fileToGlyph('Button.tsx')).toBe('typescript');
    expect(fileToGlyph('noext')).toBe('file');
  });

  it('fileToGlyph never resolves prototype-chain names', () => {
    for (const name of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
      expect(fileToGlyph(name)).toBe('file');
    }
  });
});
