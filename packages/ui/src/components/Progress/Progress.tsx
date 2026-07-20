import type { ReactNode } from 'react';
import { FillBarShell, clampPct } from '../../internal/fillbar';
import type { FillBarSize, FillBarTone } from '../../internal/fillbar';
import { cx } from '../../utils/cx';
import './Progress.css';

export interface ProgressProps {
  /** Current progress toward `max`; the fill clamps to 0–100%. */
  value: number;
  /** Completion bound (default `100`). */
  max?: number;
  /** Fill tone (default `accent`). */
  tone?: FillBarTone;
  /** Continuous fill or discrete cells (default `solid`). */
  variant?: 'solid' | 'segments';
  /** Number of cells when `variant="segments"`. */
  segments?: number;
  /** Track height (default `md`). */
  size?: FillBarSize;
  /** Opt-in neon HUD treatment. */
  glow?: boolean;
  /** Right-side % read-out (default `true`). */
  showValue?: boolean;
  /** Decorative leading icon chip (`aria-hidden`). */
  icon?: ReactNode;
  /** Accessible name for the progressbar. */
  label?: string;
  className?: string;
}

/**
 * `Progress` — a determinate progress bar (role=progressbar) that fills a track
 * proportional to `value / max`. Clean by default; `glow` turns on the HUD skin.
 * `variant="segments"` renders discrete cells instead of a continuous fill.
 */
export function Progress({
  value,
  max = 100,
  tone = 'accent',
  variant = 'solid',
  segments = 10,
  size = 'md',
  glow = false,
  showValue = true,
  icon,
  label,
  className,
}: ProgressProps) {
  const pct = clampPct(value, 0, max);

  let inner: ReactNode;
  if (variant === 'segments') {
    const on = Math.round((pct / 100) * segments);
    inner = Array.from({ length: segments }).map((_, i) => (
      <span key={i} className={cx('tcl-fillbar__cell', i < on && 'is-on')} />
    ));
  } else {
    inner = <span className="tcl-fillbar__fill" />;
  }

  return (
    <FillBarShell
      role="progressbar"
      value={value}
      max={max}
      ariaLabel={label}
      showValue={showValue}
      icon={icon}
      size={size}
      glow={glow}
      tone={tone}
      className={className}
      trackClassName={variant === 'segments' ? 'tcl-fillbar--segmented' : undefined}
    >
      {inner}
    </FillBarShell>
  );
}
