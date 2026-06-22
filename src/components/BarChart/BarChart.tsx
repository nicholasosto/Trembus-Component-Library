import { useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import { clampPct, toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import './BarChart.css';

/**
 * `BarChart` — a categorical magnitude chart (vertical columns or horizontal bars).
 *
 * It consumes a Trembus Visual Grammar **bar-chart contract** — the same authored
 * JSON shape the static HTML kit renders — so one contract draws in both places.
 * Each bar is color-coded by tone against a shared axis; selecting a bar inspects
 * its detail in a live panel. Values are assumed non-negative.
 */
export type BarTone = FillBarTone;

export interface BarDatum {
  /** Stable id for selection; falls back to `label`. */
  id?: string;
  /** Category label — the axis tick. */
  label: string;
  /** Magnitude (non-negative). */
  value: number;
  /** Color-coded tone for the bar (default `accent`). */
  tone?: BarTone;
  /** Explicit bar color (hex) — overrides `tone`. */
  color?: string;
  /** Small caption shown beside the value in the inspector. */
  sub?: string;
  /** Inspector detail shown when this bar is selected. */
  note?: string;
}

export interface BarChartMarker {
  /** Axis position of the reference line. */
  value: number;
  label?: string;
  tone?: BarTone;
}

export interface BarChartContract {
  view?: 'bar-chart';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  /** Unit suffix appended to every value label (e.g. `%`, `ms`, `k`). */
  unit?: string;
  orientation?: 'vertical' | 'horizontal';
  /** Force the axis maximum; otherwise derived from the data (and markers). */
  max?: number;
  /** Reference lines drawn across the plot (a target / threshold). */
  markers?: BarChartMarker[];
  bars: BarDatum[];
}

export interface BarChartProps {
  data: BarChartContract;
  /** Controlled selected bar id. */
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  /** Plot height in px (vertical orientation only; horizontal sizes intrinsically). */
  height?: number;
  className?: string;
}

const idOf = (d: BarDatum): string => d.id ?? d.label;

const fmt = (value: number, unit?: string): string => `${value}${unit ?? ''}`;

export function BarChart({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  height = 240,
  className,
}: BarChartProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultSelectedId);
  const selectedId = selProp ?? internal;
  const select = (id: string): void => {
    if (selProp === undefined) setInternal(id);
    onSelect?.(id);
  };

  const { bars, unit, markers = [] } = data;
  const orientation = data.orientation ?? 'vertical';
  const isVertical = orientation === 'vertical';

  // Axis max: explicit, else the largest bar/marker value, else 1 (avoids /0).
  const axisMax = useMemo(() => {
    if (data.max != null) return data.max;
    const peak = Math.max(0, ...bars.map((b) => b.value), ...markers.map((m) => m.value));
    return peak > 0 ? peak : 1;
  }, [data.max, bars, markers]);

  const selected = bars.find((b) => idOf(b) === selectedId);

  return (
    <div className={cx('tcl-bar-chart', `tcl-bar-chart--${orientation}`, className)}>
      {(data.code || data.title || data.caption || data.brand) && (
        <header className="tcl-bar-chart__header">
          {data.brand && <p className="tcl-bar-chart__brand">{data.brand}</p>}
          {data.code && <p className="tcl-bar-chart__code">{data.code}</p>}
          {data.title && <p className="tcl-bar-chart__title">{data.title}</p>}
          {data.caption && <p className="tcl-bar-chart__caption">{data.caption}</p>}
        </header>
      )}

      <div className="tcl-bar-chart__plot" style={isVertical ? { height } : undefined}>
        {/* Bars and markers share one coordinate box so they read on the same scale. */}
        <div
          className="tcl-bar-chart__canvas"
          role="group"
          aria-label={data.title ?? data.code ?? 'Bar chart'}
        >
          {markers.map((m, i) => {
            const pct = clampPct(m.value, 0, axisMax);
            return (
              <span
                key={`mk-${i}`}
                className="tcl-bar-chart__marker"
                aria-hidden="true"
                style={vars({ '--mk': toneVar(m.tone ?? 'neutral'), '--at': `${pct}%` })}
              >
                {m.label && (
                  <span className="tcl-bar-chart__marker-label">{`${m.label} · ${fmt(m.value, unit)}`}</span>
                )}
              </span>
            );
          })}

          {bars.map((b) => {
            const id = idOf(b);
            const pct = clampPct(b.value, 0, axisMax);
            const isSelected = id === selectedId;
            const barColor = b.color ?? toneVar(b.tone ?? 'accent');
            return (
              <button
                key={id}
                type="button"
                className={cx('tcl-bar-chart__cell', isSelected && 'is-selected')}
                aria-pressed={isSelected}
                aria-label={`${b.label}: ${fmt(b.value, unit)}`}
                onClick={() => select(id)}
              >
                <span
                  className="tcl-bar-chart__bar"
                  style={vars({ '--pct': `${pct}%`, '--bar-color': barColor })}
                >
                  <span className="tcl-bar-chart__value">{fmt(b.value, unit)}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Category ticks, laid out to mirror the canvas cells (buttons carry the SR names). */}
        <div className="tcl-bar-chart__axis" aria-hidden="true">
          {bars.map((b) => (
            <span key={idOf(b)} className="tcl-bar-chart__tick" title={b.label}>
              {b.label}
            </span>
          ))}
        </div>
      </div>

      <div className="tcl-bar-chart__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-bar-chart__inspector-title">
              {selected.label}
              <span className="tcl-bar-chart__inspector-value">
                {' · '}
                {fmt(selected.value, unit)}
              </span>
              {selected.sub && (
                <span className="tcl-bar-chart__inspector-sub"> {selected.sub}</span>
              )}
            </p>
            {selected.note && <p className="tcl-bar-chart__inspector-note">{selected.note}</p>}
          </>
        ) : (
          <p className="tcl-bar-chart__inspector-hint">Select a bar to inspect its value.</p>
        )}
      </div>
    </div>
  );
}
