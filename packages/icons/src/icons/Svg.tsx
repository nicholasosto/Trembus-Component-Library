import type { ReactElement, SVGProps } from 'react';

export type GlyphProps = SVGProps<SVGSVGElement>;

/**
 * The shared frame for every monochrome glyph: a normalized 24×24 viewBox that
 * sizes to the font (`1em`), paints `currentColor`, is `aria-hidden` (decorative —
 * the adjacent text label carries the meaning), and stamps `data-glyph` for tests
 * and styling hooks.
 */
export function Svg({ name, children, ...rest }: GlyphProps & { name: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-glyph={name}
      {...rest}
    >
      {children}
    </svg>
  );
}
