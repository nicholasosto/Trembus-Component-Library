import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import type { FillBarTone } from '../../internal/fillbar';
import { Sparkline } from '../Sparkline/Sparkline';
import './Stat.css';

/**
 * `Stat` — a KPI card: a labeled headline value with an optional period-over-period
 * delta, a target/context line, a status badge, and an embedded trend sparkline.
 * The signature tile of the PMO dashboard. Presentational by default; pass
 * `onSelect` or `href` to turn the whole card into a drill-in affordance.
 */
export type StatTone = FillBarTone;

export interface StatDelta {
  /** Signed change versus the comparison period. */
  value: number;
  /** Preformatted text (e.g. "+1.2pp"); defaults to the signed value. */
  text?: string;
  /**
   * When true a DECREASE is good (down = success) — for latency/lag metrics where
   * lower is better (e.g. DIRT). Default false (up = success).
   */
  invert?: boolean;
}

export interface StatProps {
  /** Metric name (e.g. "DIRT — avg lag"). */
  label: string;
  /** Headline value; use "—" (the default) when the source isn't available. */
  value?: ReactNode;
  /** Small unit after the value (e.g. "days", "%"). */
  unit?: string;
  /** Eyebrow / category strap above the label (e.g. "Cat 2 · Time Entry"). */
  strap?: string;
  /** Period-over-period change, shown as a colored ▲/▼ chip. */
  delta?: StatDelta;
  /** Context line under the value (target, secondary stats). */
  target?: ReactNode;
  /** Trend series; renders an embedded sparkline strip when set. */
  trend?: ReadonlyArray<number | null | undefined>;
  /** Status pill in the top-right (e.g. a `<Badge>` "Live" / "Awaiting WSC"). */
  badge?: ReactNode;
  /** Color-coded tone for the accent rail + sparkline (default `accent`). */
  tone?: StatTone;
  /** When set, the whole card becomes a drill-in `<button>`. */
  onSelect?: () => void;
  /** When set, the card becomes a drill-in `<a>` (takes precedence over `onSelect`). */
  href?: string;
  className?: string;
}

function DeltaChip({ delta }: { delta: StatDelta }) {
  const { value, text, invert = false } = delta;
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const semantic = dir === 'flat' ? 'flat' : (dir === 'up' ? !invert : invert) ? 'good' : 'bad';
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '→';
  const txt = text ?? `${value > 0 ? '+' : ''}${value}`;
  const ariaTxt = txt.replace(/^\+/, '');
  const aria = dir === 'flat' ? `no change, ${ariaTxt}` : `${dir} by ${ariaTxt}`;
  return (
    <span className={cx('tcl-stat__delta', `tcl-stat__delta--${semantic}`)} aria-label={aria}>
      <span className="tcl-stat__delta-arrow" aria-hidden="true">
        {arrow}
      </span>
      {txt}
    </span>
  );
}

export function Stat({
  label,
  value = '—',
  unit,
  strap,
  delta,
  target,
  trend,
  badge,
  tone = 'accent',
  onSelect,
  href,
  className,
}: StatProps) {
  const interactive = href != null || onSelect != null;
  const rootClassName = cx(
    'tcl-stat',
    `tcl-stat--${tone}`,
    interactive && 'tcl-stat--interactive',
    className,
  );

  const inner = (
    <>
      <span className="tcl-stat__head">
        <span className="tcl-stat__heading">
          {strap && <span className="tcl-stat__strap">{strap}</span>}
          <span className="tcl-stat__label">{label}</span>
        </span>
        {badge && <span className="tcl-stat__badge">{badge}</span>}
      </span>

      <span className="tcl-stat__body">
        <span className="tcl-stat__value">
          {value}
          {unit && <span className="tcl-stat__unit">{unit}</span>}
        </span>
        {delta && <DeltaChip delta={delta} />}
        {target && <span className="tcl-stat__target">{target}</span>}
        {trend && trend.length > 0 && (
          <Sparkline values={trend} tone={tone} className="tcl-stat__spark" />
        )}
      </span>
    </>
  );

  if (href != null) {
    return (
      <a className={rootClassName} href={href}>
        {inner}
      </a>
    );
  }
  if (onSelect != null) {
    return (
      <button type="button" className={rootClassName} onClick={onSelect}>
        {inner}
      </button>
    );
  }
  return <div className={rootClassName}>{inner}</div>;
}
