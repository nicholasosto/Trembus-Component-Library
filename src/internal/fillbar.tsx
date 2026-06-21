import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../utils/cx';
import './fillbar.css';

export type FillBarTone = 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';
export type FillBarSize = 'sm' | 'md' | 'lg';

const TONE_VARS: Record<FillBarTone, string> = {
  accent: 'var(--tcl-accent)',
  info: 'var(--tcl-status-info)',
  success: 'var(--tcl-status-success)',
  warning: 'var(--tcl-status-warning)',
  danger: 'var(--tcl-status-danger)',
  neutral: 'var(--tcl-status-neutral)',
};

/** The `var(--tcl-*)` reference for a tone (for per-segment inline overrides). */
export function toneVar(tone: FillBarTone): string {
  return TONE_VARS[tone];
}

/** Clamp a value to a 0–100 percentage of [min, max]. */
export function clampPct(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

/** Build an inline style that carries CSS custom properties safely under strict TS. */
export function vars(record: Record<string, string | number>, base?: CSSProperties): CSSProperties {
  return { ...(base ?? {}), ...record } as CSSProperties;
}

export interface FillBarShellProps {
  /** ARIA role — `progressbar` (advancing) or `meter` (a measurement). */
  role: 'progressbar' | 'meter';
  value: number;
  min?: number;
  max?: number;
  valueText?: string;
  /** Accessible name (required for a meaningful screen-reader announcement). */
  ariaLabel?: string;
  showValue?: boolean;
  /** Override the right-side label (defaults to the rounded %). */
  valueLabel?: ReactNode;
  icon?: ReactNode;
  size?: FillBarSize;
  glow?: boolean;
  tone?: FillBarTone;
  /** Row class. */
  className?: string;
  /** Extra track class — variants switch the track's layout here. */
  trackClassName?: string;
  /** Variant-specific track contents (fill / cells / segments / zones). */
  children: ReactNode;
  trackStyle?: CSSProperties;
}

/**
 * Shared chrome for fill bars: an optional icon chip, the bordered track (which
 * carries the role + ARIA value), and an optional right-side value label. The
 * track's inner content is variant-specific (passed as children). Single source
 * of truth for the geometry behind both `Progress` and `Meter`.
 */
export function FillBarShell({
  role,
  value,
  min = 0,
  max = 100,
  valueText,
  ariaLabel,
  showValue = true,
  valueLabel,
  icon,
  size = 'md',
  glow = false,
  tone = 'accent',
  className,
  trackClassName,
  children,
  trackStyle,
}: FillBarShellProps) {
  const pct = clampPct(value, min, max);
  return (
    <div className={cx('tcl-fillbar-row', className)}>
      {icon && (
        <span className="tcl-fillbar__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <div
        role={role}
        aria-valuenow={Math.round(Math.min(max, Math.max(min, value)))}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={valueText}
        aria-label={ariaLabel}
        className={cx(
          'tcl-fillbar',
          `tcl-fillbar--${size}`,
          `tcl-fillbar--${tone}`,
          glow && 'is-glow',
          trackClassName,
        )}
        style={vars({ '--value': `${pct}%` }, trackStyle)}
      >
        {children}
      </div>
      {showValue && (
        <span className="tcl-fillbar__value">{valueLabel ?? `${Math.round(pct)}%`}</span>
      )}
    </div>
  );
}
