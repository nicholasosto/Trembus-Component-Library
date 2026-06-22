import { cx } from '../../utils/cx';
import { toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import './Sparkline.css';

/**
 * `Sparkline` — a word-sized trend line. The series becomes a single path inside
 * a tiny fixed box so its trajectory reads at a glance; it mirrors the Trembus
 * Visual Grammar `spark` so one series draws the same in the static HTML kit and
 * in React. Presentational by design — pair it with a {@link Stat} value or a
 * table cell. `null`/non-finite entries are gaps the line skips over.
 */
export type SparklineTone = FillBarTone;

export interface SparklineProps {
  /** The series. `null`/`undefined`/non-finite entries are gaps the line skips. */
  values: ReadonlyArray<number | null | undefined>;
  /** Color-coded tone for the line (default `accent`). */
  tone?: SparklineTone;
  /** Explicit stroke color (hex) — overrides `tone`. */
  color?: string;
  /** Intrinsic viewBox width; CSS may stretch it (the stroke stays crisp). */
  width?: number;
  /** Intrinsic viewBox height; CSS may stretch it. */
  height?: number;
  /** Fill the area beneath the line (default `true`). */
  area?: boolean;
  /** Mark the last data point with a dot (default `true`). */
  markLast?: boolean;
  /** Force the lower bound of the y-domain so several sparklines share one scale. */
  min?: number;
  /** Force the upper bound of the y-domain. */
  max?: number;
  /**
   * Accessible name. When set, the sparkline is exposed to assistive tech as an
   * image with this label; when omitted it is decorative (`aria-hidden`).
   */
  label?: string;
  className?: string;
}

interface Pt {
  i: number;
  v: number;
}

export function Sparkline({
  values,
  tone = 'accent',
  color,
  width = 100,
  height = 30,
  area = true,
  markLast = true,
  min,
  max,
  label,
  className,
}: SparklineProps) {
  const W = width;
  const H = height;
  const inset = 2;

  const finite: Pt[] = [];
  values.forEach((v, i) => {
    if (v != null && Number.isFinite(v)) finite.push({ i, v: v as number });
  });

  // y-domain: explicit bounds win; missing bounds come from the data extent
  // padded by 15%. A forced bound on the wrong side (or min > max) must never
  // invert or flatten the domain — clamp so `hi` always sits above `lo`.
  const vs = finite.map((p) => p.v);
  let dataLo = vs.length ? Math.min(...vs) : 0;
  let dataHi = vs.length ? Math.max(...vs) : 1;
  if (dataLo === dataHi) {
    const d = Math.abs(dataLo) * 0.1 + 1;
    dataLo -= d;
    dataHi += d;
  }
  const pad = (dataHi - dataLo) * 0.15;
  const lo = min ?? dataLo - pad;
  let hi = max ?? dataHi + pad;
  if (hi <= lo) hi = lo + (Math.abs(lo) * 0.1 + 1);
  const span = hi - lo;

  const n = values.length;
  const x = (i: number): number => (n <= 1 ? W / 2 : inset + (i / (n - 1)) * (W - 2 * inset));
  const y = (v: number): number => inset + (1 - (v - lo) / span) * (H - 2 * inset);

  const stroke = color ?? toneVar(tone);
  const ariaProps = label
    ? ({ role: 'img', 'aria-label': label } as const)
    : ({ 'aria-hidden': true } as const);

  // No data → an empty, correctly-sized box (still honors min/max layout).
  if (!finite.length) {
    return (
      <svg
        className={cx('tcl-sparkline', className)}
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        {...ariaProps}
      />
    );
  }

  const linePts = finite.map((p) => `${x(p.i).toFixed(2)},${y(p.v).toFixed(2)}`).join(' ');
  const first = finite[0];
  const last = finite[finite.length - 1];
  const areaPts = `${linePts} ${x(last.i).toFixed(2)},${H} ${x(first.i).toFixed(2)},${H}`;

  return (
    <svg
      className={cx('tcl-sparkline', className)}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={vars({ '--spark-color': stroke })}
      {...ariaProps}
    >
      {label && <title>{label}</title>}
      {area && finite.length > 1 && <polygon className="tcl-sparkline__area" points={areaPts} />}
      {finite.length > 1 && (
        <polyline
          className="tcl-sparkline__line"
          points={linePts}
          vectorEffect="non-scaling-stroke"
        />
      )}
      {markLast && (
        <circle
          className="tcl-sparkline__dot"
          cx={x(last.i).toFixed(2)}
          cy={y(last.v).toFixed(2)}
          r={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
