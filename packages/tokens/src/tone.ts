/**
 * The color-coded tone ontology shared across the Trembus viz tiers — the same
 * six hues @trembus/ui's fill bars use, exposed React-free so @trembus/viz can
 * consume them WITHOUT depending on @trembus/ui. `toneVar`/`toneFg` resolve a
 * tone to its `var(--tcl-*)` base / foreground reference (theme-aware at runtime).
 */
export type Tone = 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const TONE_VARS: Record<Tone, string> = {
  accent: 'var(--tcl-accent)',
  info: 'var(--tcl-status-info)',
  success: 'var(--tcl-status-success)',
  warning: 'var(--tcl-status-warning)',
  danger: 'var(--tcl-status-danger)',
  neutral: 'var(--tcl-status-neutral)',
};

const TONE_FGS: Record<Tone, string> = {
  accent: 'var(--tcl-accent-fg)',
  info: 'var(--tcl-status-info-fg)',
  success: 'var(--tcl-status-success-fg)',
  warning: 'var(--tcl-status-warning-fg)',
  danger: 'var(--tcl-status-danger-fg)',
  neutral: 'var(--tcl-status-neutral-fg)',
};

/** The `var(--tcl-*)` base reference for a tone (a solid fill / stroke). */
export function toneVar(tone: Tone): string {
  return TONE_VARS[tone];
}

/** The `var(--tcl-*-fg)` reference — the AA-tuned text color for a solid tone fill. */
export function toneFg(tone: Tone): string {
  return TONE_FGS[tone];
}
