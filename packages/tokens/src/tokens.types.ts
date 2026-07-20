/**
 * Token scale types — the vocabulary primitive/component props speak.
 * These are step *names*, not values; the values live once in the token
 * CSS and resolve per-theme at runtime.
 */
export type SpaceToken = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'full';
export type TypeToken = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl';
export type FontWeightToken = 'regular' | 'medium' | 'semibold' | 'bold';
export type ElevationToken = 0 | 1 | 2 | 3;
export type ZToken =
  | 'base'
  | 'dropdown'
  | 'sticky'
  | 'overlay'
  | 'modal'
  | 'popover'
  | 'toast'
  | 'tooltip';

/** The color-coded ontology: the five reusable status/intent hues. */
export type StatusTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

/** Text colors a `Text` mark can take. */
export type TextTone = 'default' | 'dim' | 'faint' | 'accent' | StatusTone;

/** Surface elevation intent for `Box`. */
export type SurfaceTone = 'none' | 'raised' | 'sunken' | 'overlay';

/** Material "skin" applied to a `Box` surface via [data-material]; tunable via the --tcl-mat-* knobs. */
export type MaterialTone = 'glass' | 'cyber' | 'felt' | 'relic' | 'parchment' | 'slate' | 'regal';

/** Shipped `[data-theme]` values — light is the `:root` default; dark and reliquary override it. */
export type ThemeName = 'light' | 'dark' | 'reliquary';
