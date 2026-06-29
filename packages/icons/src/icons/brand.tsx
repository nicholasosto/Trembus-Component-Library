import type { ReactElement } from 'react';
import type { GlyphProps } from './Svg';

/**
 * Type / brand marks — they carry their own brand color because they're only
 * recognizable that way (TS must be blue, JS must be yellow). A deliberate, narrow
 * exception to "tokens only": the marks are decorative (`aria-hidden`), so the
 * adjacent text label still does the accessible work.
 */

export const TypeScriptIcon = (p: GlyphProps): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
    data-glyph="typescript"
    {...p}
  >
    <rect width="24" height="24" rx="3" fill="#3178c6" />
    <text
      x="12.5"
      y="16.5"
      textAnchor="middle"
      fontFamily="ui-monospace, monospace"
      fontSize="9"
      fontWeight="700"
      fill="#ffffff"
    >
      TS
    </text>
  </svg>
);

export const JavaScriptIcon = (p: GlyphProps): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
    data-glyph="javascript"
    {...p}
  >
    <rect width="24" height="24" rx="3" fill="#f7df1e" />
    <text
      x="12.5"
      y="16.5"
      textAnchor="middle"
      fontFamily="ui-monospace, monospace"
      fontSize="9"
      fontWeight="700"
      fill="#11110a"
    >
      JS
    </text>
  </svg>
);

export const ReactIcon = (p: GlyphProps): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
    data-glyph="react"
    {...p}
  >
    <circle cx="12" cy="12" r="1.8" fill="#61dafb" />
    <g fill="none" stroke="#61dafb" strokeWidth="1.1">
      <ellipse cx="12" cy="12" rx="9.5" ry="3.7" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(120 12 12)" />
    </g>
  </svg>
);

export const CssIcon = (p: GlyphProps): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
    data-glyph="css"
    {...p}
  >
    <rect width="24" height="24" rx="3" fill="#2965f1" />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontFamily="ui-monospace, monospace"
      fontSize="8"
      fontWeight="700"
      fill="#ffffff"
    >
      CSS
    </text>
  </svg>
);

export const HtmlIcon = (p: GlyphProps): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
    data-glyph="html"
    {...p}
  >
    <rect width="24" height="24" rx="3" fill="#e34f26" />
    <text
      x="12"
      y="16.5"
      textAnchor="middle"
      fontFamily="ui-monospace, monospace"
      fontSize="9"
      fontWeight="700"
      fill="#ffffff"
    >
      {'</>'}
    </text>
  </svg>
);
