import type { ReactNode } from 'react';
import { FillBarShell, clampPct, toneVar, vars } from '../../internal/fillbar';
import type { FillBarSize, FillBarTone } from '../../internal/fillbar';
import './Meter.css';

export interface MeterSegment {
  /** Portion of the track this segment occupies (in `max` units). */
  value: number;
  /** Segment color; defaults to the meter's `tone`. */
  tone?: FillBarTone;
  /** Text printed inside the segment (also read into `aria-valuetext`). */
  label?: string;
}

export interface MeterThreshold {
  /** Position of the marker; the fill takes `tone` once `value` crosses it. */
  value: number;
  /** Tone applied to the fill past this marker (marker tick defaults to neutral). */
  tone?: FillBarTone;
}

export interface MeterProps {
  /** The measurement (default `0`); clamped to `[min, max]` for ARIA and the fill. */
  value?: number;
  /** Lower bound of the scale (default `0`). */
  min?: number;
  /** Upper bound of the scale (default `100`). */
  max?: number;
  /** Base fill tone (default `success`). */
  tone?: FillBarTone;
  /** Track style: solid fill · stacked proportions · threshold gauge (default `solid`). */
  variant?: 'solid' | 'stacked' | 'threshold';
  /** Proportional segments for `variant="stacked"`. */
  segments?: MeterSegment[];
  /** Markers for `variant="threshold"`; the fill recolors as `value` crosses them. */
  thresholds?: MeterThreshold[];
  /** Track height (default `md`). */
  size?: FillBarSize;
  /** Opt-in HUD glow skin (default `false`). */
  glow?: boolean;
  /** Right-side % read-out (default `true`; `stacked` defaults to `false`). */
  showValue?: boolean;
  /** Decorative leading icon chip (`aria-hidden`). */
  icon?: ReactNode;
  /** Accessible name for the meter. */
  label?: string;
  className?: string;
}

/**
 * `Meter` — a static measurement (role=meter). `solid` fills to a value;
 * `stacked` shows proportions that sum across the track; `threshold` recolors
 * the fill as the value crosses configured markers (a gauge). Clean by default;
 * `glow` turns on the HUD skin.
 */
export function Meter({
  value = 0,
  min = 0,
  max = 100,
  tone = 'success',
  variant = 'solid',
  segments = [],
  thresholds = [],
  size = 'md',
  glow = false,
  showValue,
  icon,
  label,
  className,
}: MeterProps) {
  if (variant === 'stacked') {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    return (
      <FillBarShell
        role="meter"
        value={total}
        min={min}
        max={max}
        ariaLabel={label}
        valueText={segments.map((s) => `${s.label ?? 'segment'}: ${s.value}`).join(', ')}
        showValue={showValue ?? false}
        icon={icon}
        size={size}
        glow={glow}
        tone={tone}
        className={className}
        trackClassName="tcl-fillbar--stacked"
      >
        {segments.map((s, i) => (
          <span
            key={i}
            className="tcl-fillbar__seg"
            style={vars(
              { '--seg': toneVar(s.tone ?? tone) },
              { width: `${clampPct(s.value, 0, max)}%` },
            )}
          >
            {s.label}
          </span>
        ))}
      </FillBarShell>
    );
  }

  if (variant === 'threshold') {
    const sorted = [...thresholds].sort((a, b) => a.value - b.value);
    let activeTone = tone;
    for (const t of sorted) if (value >= t.value) activeTone = t.tone ?? activeTone;
    return (
      <FillBarShell
        role="meter"
        value={value}
        min={min}
        max={max}
        ariaLabel={label}
        showValue={showValue ?? true}
        icon={icon}
        size={size}
        glow={glow}
        tone={activeTone}
        className={className}
        trackClassName="tcl-fillbar--threshold"
      >
        <span className="tcl-fillbar__fill" />
        {sorted.map((t, i) => (
          <span
            key={i}
            className="tcl-fillbar__marker"
            aria-hidden="true"
            style={vars(
              { '--mk': toneVar(t.tone ?? 'neutral') },
              { left: `${clampPct(t.value, min, max)}%` },
            )}
          />
        ))}
      </FillBarShell>
    );
  }

  return (
    <FillBarShell
      role="meter"
      value={value}
      min={min}
      max={max}
      ariaLabel={label}
      showValue={showValue ?? true}
      icon={icon}
      size={size}
      glow={glow}
      tone={tone}
      className={className}
    >
      <span className="tcl-fillbar__fill" />
    </FillBarShell>
  );
}
