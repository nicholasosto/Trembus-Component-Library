import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

/**
 * Token-contrast regression guard (WCAG AA).
 *
 * The faint / dim text tokens are used as REAL text (Brief ids & micro-labels,
 * Stat units, Callout bodies, Badge neutral). They must clear 4.5:1 on the
 * solid surfaces they actually sit on, in EVERY theme. jsdom can't measure
 * rendered contrast, and the browser a11y gate (`test:stories`) only runs the
 * DARK theme — so this pure-math check covers light + reliquary too, and pins
 * the token values so a future edit can't silently drop them below AA again.
 * (2026-07-19 lift: dark faint #5a6371→#8b94a4 / dim #8b949e→#a6afba, etc.)
 */

const CSS_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../../tokens/src/css');
const readTheme = (file: string) => readFileSync(resolve(CSS_DIR, file), 'utf8');

/** Pull a literal `--tcl-<name>: #rrggbb;` hex out of a theme's CSS block. */
function token(css: string, name: string): string {
  const m = css.match(new RegExp(`--tcl-${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!m) throw new Error(`token --tcl-${name} not found`);
  return m[1];
}

const toLin = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
function luminance(hex: string): number {
  let h = hex.replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((x) => x + x)
      .join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;

const themes = {
  light: readTheme('tokens.light.css'),
  dark: readTheme('tokens.dark.css'),
  reliquary: readTheme('tokens.reliquary.css'),
};

describe('token contrast (WCAG AA)', () => {
  for (const [name, css] of Object.entries(themes)) {
    describe(name, () => {
      const text = token(css, 'text');
      const dim = token(css, 'text-dim');
      const faint = token(css, 'text-faint');
      const bg = token(css, 'bg');
      const surface = token(css, 'surface');
      const raised = token(css, 'surface-raised');

      // faint is used as real text on all three solid surfaces
      it('faint clears AA on page / surface / raised', () => {
        expect(contrast(faint, bg)).toBeGreaterThanOrEqual(AA);
        expect(contrast(faint, surface)).toBeGreaterThanOrEqual(AA);
        expect(contrast(faint, raised)).toBeGreaterThanOrEqual(AA);
      });

      // dim (secondary body text) must clear AA on the brightest solid surface
      it('dim clears AA on the raised surface', () => {
        expect(contrast(dim, raised)).toBeGreaterThanOrEqual(AA);
      });

      // hierarchy stays intact: primary > secondary > tertiary contrast
      it('keeps the text > dim > faint contrast order on surface', () => {
        expect(contrast(text, surface)).toBeGreaterThan(contrast(dim, surface));
        expect(contrast(dim, surface)).toBeGreaterThan(contrast(faint, surface));
      });
    });
  }
});
