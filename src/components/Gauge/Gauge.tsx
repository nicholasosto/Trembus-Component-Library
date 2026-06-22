import { cx } from '../../utils/cx';
import { clampPct, toneVar } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import './Gauge.css';

/**
 * `Gauge` — a 180° dial: a value drawn as a needle against optional colored
 * quality zones (e.g. green/amber/red) and a target tick. Presentational like
 * `Sparkline`/`Meter` — it reports a single measurement and exposes it to
 * assistive tech via `role=meter` + `aria-valuetext`.
 */
export type GaugeTone = FillBarTone;

export interface GaugeZone {
  /** Upper bound of this band, in value units (bands run from the prior bound). */
  upTo: number;
  tone?: GaugeTone;
  color?: string;
  /** Short name announced when the value falls in this band (e.g. "on target"). */
  label?: string;
}

export interface GaugeProps {
  value: number;
  min?: number;
  max: number;
  /** Unit appended to the value readout (e.g. `d`, `%`). */
  unit?: string;
  /** Colored quality bands along the arc; without them the arc fills to `value`. */
  zones?: GaugeZone[];
  /** A threshold tick drawn on the arc. */
  target?: { value: number; label?: string };
  /** Metric name shown under the value. */
  label?: string;
  /** Accessible name for the meter (defaults to `label`). */
  ariaLabel?: string;
  /** Base tone for the value arc when no `zones` are given (default `accent`). */
  tone?: GaugeTone;
  className?: string;
}

const VB_W = 240;
const VB_H = 176;
const CX = 120;
const CY = 120;
const R = 88;

const fmt = (v: number, unit?: string): string => `${Math.round(v * 100) / 100}${unit ?? ''}`;

/** Value → arc angle in degrees (180° = min at left, 0° = max at right). */
const angleOf = (v: number, min: number, max: number): number =>
  180 - (clampPct(v, min, max) / 100) * 180;

const polar = (deg: number, r = R): { x: number; y: number } => {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY - r * Math.sin(rad) };
};

const arcPath = (a0: number, a1: number, r = R): string => {
  const s = polar(a0, r);
  const e = polar(a1, r);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 < a0 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
};

export function Gauge({
  value,
  min = 0,
  max,
  unit,
  zones,
  target,
  label,
  ariaLabel,
  tone = 'accent',
  className,
}: GaugeProps) {
  // Clamp once (and coerce non-finite) so the needle, readout, aria-valuenow,
  // and aria-valuetext all report the SAME bounded value.
  const v = Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
  const valueAngle = angleOf(v, min, max);
  const needle = polar(valueAngle, R - 12);

  // The band the value sits in (only when a band actually covers it).
  const sortedZones = zones ? [...zones].sort((a, b) => a.upTo - b.upTo) : [];
  const activeZone = sortedZones.find((z) => v <= z.upTo);
  const valueText = `${fmt(v, unit)}${activeZone?.label ? `, ${activeZone.label}` : ''}`;

  return (
    <div
      className={cx('tcl-gauge', className)}
      role="meter"
      aria-valuenow={Math.round(v * 100) / 100}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={valueText}
      aria-label={ariaLabel ?? label}
    >
      <div className="tcl-gauge__dial">
        <svg className="tcl-gauge__svg" viewBox={`0 0 ${VB_W} ${VB_H}`} aria-hidden="true">
          {/* track */}
          <path
            className="tcl-gauge__track"
            d={arcPath(angleOf(min, min, max), angleOf(max, min, max))}
          />

          {/* colored zones, else a single value arc */}
          {sortedZones.length > 0 ? (
            sortedZones.map((z, i) => {
              const from = Math.min(i === 0 ? min : sortedZones[i - 1].upTo, max);
              return (
                <path
                  key={i}
                  className="tcl-gauge__zone"
                  d={arcPath(angleOf(from, min, max), angleOf(Math.min(z.upTo, max), min, max))}
                  style={{ stroke: z.color ?? toneVar(z.tone ?? 'neutral') }}
                />
              );
            })
          ) : (
            <path
              className="tcl-gauge__zone"
              d={arcPath(angleOf(min, min, max), valueAngle)}
              style={{ stroke: toneVar(tone) }}
            />
          )}

          {/* target tick */}
          {target && (
            <line
              className="tcl-gauge__target"
              x1={polar(angleOf(target.value, min, max), R + 9).x}
              y1={polar(angleOf(target.value, min, max), R + 9).y}
              x2={polar(angleOf(target.value, min, max), R - 17).x}
              y2={polar(angleOf(target.value, min, max), R - 17).y}
            />
          )}

          {/* needle */}
          <g className="tcl-gauge__needle">
            <line x1={CX} y1={CY} x2={needle.x} y2={needle.y} vectorEffect="non-scaling-stroke" />
            <circle cx={CX} cy={CY} r={5} />
          </g>
        </svg>

        <div className="tcl-gauge__readout">
          <span className="tcl-gauge__value">
            {Math.round(v * 100) / 100}
            {unit && <span className="tcl-gauge__unit">{unit}</span>}
          </span>
          {label && <span className="tcl-gauge__label">{label}</span>}
        </div>
      </div>

      {target && (
        <p className="tcl-gauge__target-label">target {target.label ?? fmt(target.value, unit)}</p>
      )}

      {/* min / max scale ends */}
      <div className="tcl-gauge__scale" aria-hidden="true">
        <span>{fmt(min, unit)}</span>
        <span>{fmt(max, unit)}</span>
      </div>
    </div>
  );
}
