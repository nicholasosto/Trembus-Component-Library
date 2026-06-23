import type { RadiusToken, SpaceToken, StatusTone, TypeToken, ZToken } from './tokens.types';

/**
 * Type-safe references to the design tokens. Each value is a `var(--tcl-*)`
 * string — NOT a raw color — so authoring stays theme-aware while you get
 * autocomplete and a compile error on a typo'd token.
 *
 * The single source of *values* is the token CSS (`styles/tokens.*.css`);
 * this object is the single source of type-safe *access*.
 */
export const tokens = {
  color: {
    bg: 'var(--tcl-bg)',
    surface: 'var(--tcl-surface)',
    surfaceRaised: 'var(--tcl-surface-raised)',
    surfaceSunken: 'var(--tcl-surface-sunken)',
    surfaceHover: 'var(--tcl-surface-hover)',
    overlay: 'var(--tcl-overlay)',
    border: 'var(--tcl-border)',
    borderSoft: 'var(--tcl-border-soft)',
    borderStrong: 'var(--tcl-border-strong)',
    text: 'var(--tcl-text)',
    textDim: 'var(--tcl-text-dim)',
    textFaint: 'var(--tcl-text-faint)',
    accent: 'var(--tcl-accent)',
    accentHover: 'var(--tcl-accent-hover)',
    accentActive: 'var(--tcl-accent-active)',
    accentFg: 'var(--tcl-accent-fg)',
    focusRing: 'var(--tcl-focus-ring)',
  },
  /** The color-coded ontology — each tone resolves a base / bg / fg triad. */
  status: (tone: StatusTone) =>
    ({
      base: `var(--tcl-status-${tone})`,
      bg: `var(--tcl-status-${tone}-bg)`,
      fg: `var(--tcl-status-${tone}-fg)`,
    }) as const,
  font: {
    sans: 'var(--tcl-font-sans)',
    mono: 'var(--tcl-font-mono)',
  },
  fontSize: (step: TypeToken) => `var(--tcl-text-${step})`,
  radius: (step: RadiusToken) => `var(--tcl-radius-${step})`,
  space: (step: SpaceToken) => `var(--tcl-space-${step})`,
  z: (layer: ZToken) => `var(--tcl-z-${layer})`,
  elevation: (level: 0 | 1 | 2 | 3) => `var(--tcl-elevation-${level})`,
  motion: {
    easeCalm: 'var(--tcl-ease-calm)',
    easeExit: 'var(--tcl-ease-exit)',
    durFast: 'var(--tcl-dur-fast)',
    durBase: 'var(--tcl-dur-base)',
    durSlow: 'var(--tcl-dur-slow)',
  },
} as const;

export type Tokens = typeof tokens;
