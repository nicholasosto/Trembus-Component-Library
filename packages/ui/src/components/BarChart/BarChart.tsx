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
 *
 * Two shapes are supported: a single series (`bars`) and clustered multi-series
 * (`series` + `categories`), which groups one bar per series under each category.
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

export interface BarSeries {
  /** Stable id for selection; falls back to the series index. */
  id?: string;
  /** Series name — shown in the legend and the selected bar's accessible name. */
  name: string;
  /** Color-coded tone (defaults cycle through the ontology by series order). */
  tone?: BarTone;
  /** Explicit series color (hex) — overrides `tone`. */
  color?: string;
  /** Values aligned to `categories`; `null`/non-finite leaves an empty slot. */
  values: (number | null)[];
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
  /** Single-series data — each datum is a bar. */
  bars?: BarDatum[];
  /** Clustered multi-series data — pair with `categories` (one cluster per category). */
  series?: BarSeries[];
  /** Category (x) labels shared across all `series`. */
  categories?: string[];
}

export interface BarChartProps {
  /** The bar-chart contract: single-series `bars`, or clustered `series` + `categories`. */
  data: BarChartContract;
  /** Controlled selected bar id. */
  selectedId?: string;
  /** Uncontrolled initial selection. */
  defaultSelectedId?: string;
  /** Called with the bar id when a bar is selected. */
  onSelect?: (id: string) => void;
  /** Plot height in px (vertical orientation only; horizontal sizes intrinsically). Default `240`. */
  height?: number;
  className?: string;
}

const SERIES_CYCLE: BarTone[] = ['accent', 'info', 'success', 'warning', 'danger', 'neutral'];

/** Single-series key: explicit id, else the label (back-compat — kept stable). */
const idOf = (d: BarDatum): string => d.id ?? d.label;
/** Series key: explicit id, else the series index (never falls back to the name). */
const sidOf = (s: BarSeries, i: number): string => s.id ?? `g${i}`;
/** A grouped datum id is collision-proof: `{seriesKey}#{categoryIndex}`. */
const cellId = (s: BarSeries, si: number, ci: number): string => `${sidOf(s, si)}#${ci}`;

const fmt = (value: number, unit?: string): string => `${value}${unit ?? ''}`;

interface Inspected {
  title: string;
  valueText: string;
  sub?: string;
  note?: string;
}

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

  const { unit, markers = [] } = data;
  // Stable references so the memos below only recompute when the data changes.
  const bars = useMemo(() => data.bars ?? [], [data.bars]);
  const series = useMemo(() => data.series ?? [], [data.series]);
  const categories = useMemo(() => data.categories ?? [], [data.categories]);
  const isGrouped = series.length > 0;
  const orientation = data.orientation ?? 'vertical';
  const isVertical = orientation === 'vertical';

  // Axis max: explicit, else the largest bar/series/marker value, else 1 (avoids /0).
  const axisMax = useMemo(() => {
    if (data.max != null) return data.max;
    const values = isGrouped
      ? series.flatMap((s) => s.values.filter((v): v is number => v != null && Number.isFinite(v)))
      : bars.map((b) => b.value);
    const peak = Math.max(0, ...values, ...markers.map((m) => m.value));
    return peak > 0 ? peak : 1;
  }, [data.max, isGrouped, series, bars, markers]);

  // Tick labels mirror the canvas: categories in grouped mode, bar labels otherwise.
  const tickLabels = isGrouped ? categories : bars.map((b) => b.label);

  // Resolve the selected datum into a uniform inspector payload.
  const inspected = useMemo<Inspected | undefined>(() => {
    if (selectedId == null) return undefined;
    if (isGrouped) {
      for (let si = 0; si < series.length; si++) {
        const s = series[si];
        // Bound by categories.length so the inspector resolves exactly the cells
        // the canvas renders (a controlled selectedId can't match a phantom slot).
        for (let ci = 0; ci < categories.length; ci++) {
          const v = s.values[ci];
          if (v == null || !Number.isFinite(v)) continue;
          if (cellId(s, si, ci) === selectedId) {
            return {
              title: s.name,
              valueText: `${categories[ci] ?? `#${ci + 1}`} · ${fmt(v, unit)}`,
            };
          }
        }
      }
      return undefined;
    }
    const b = bars.find((d) => idOf(d) === selectedId);
    return b
      ? { title: b.label, valueText: fmt(b.value, unit), sub: b.sub, note: b.note }
      : undefined;
  }, [selectedId, isGrouped, series, categories, bars, unit]);

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

          {isGrouped
            ? categories.map((cat, ci) => (
                <div key={`grp-${ci}`} className="tcl-bar-chart__group">
                  {series.map((s, si) => {
                    const v = s.values[ci];
                    if (v == null || !Number.isFinite(v)) {
                      return (
                        <span
                          key={sidOf(s, si)}
                          className="tcl-bar-chart__spacer"
                          aria-hidden="true"
                        />
                      );
                    }
                    const id = cellId(s, si, ci);
                    const pct = clampPct(v, 0, axisMax);
                    const isSelected = id === selectedId;
                    const barColor =
                      s.color ?? toneVar(s.tone ?? SERIES_CYCLE[si % SERIES_CYCLE.length]);
                    return (
                      <button
                        key={sidOf(s, si)}
                        type="button"
                        className={cx('tcl-bar-chart__cell', isSelected && 'is-selected')}
                        aria-pressed={isSelected}
                        aria-label={`${s.name}, ${cat}: ${fmt(v, unit)}`}
                        onClick={() => select(id)}
                      >
                        <span
                          className="tcl-bar-chart__bar"
                          style={vars({ '--pct': `${pct}%`, '--bar-color': barColor })}
                        />
                      </button>
                    );
                  })}
                </div>
              ))
            : bars.map((b) => {
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
          {tickLabels.map((label, i) => (
            <span key={`tick-${i}`} className="tcl-bar-chart__tick" title={label}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {isGrouped && (
        <div className="tcl-bar-chart__legend">
          {series.map((s, si) => (
            <span key={sidOf(s, si)} className="tcl-bar-chart__legend-item">
              <span
                className="tcl-bar-chart__legend-swatch"
                style={vars({
                  '--sw': s.color ?? toneVar(s.tone ?? SERIES_CYCLE[si % SERIES_CYCLE.length]),
                })}
                aria-hidden="true"
              />
              {s.name}
            </span>
          ))}
        </div>
      )}

      <div className="tcl-bar-chart__inspector" aria-live="polite">
        {inspected ? (
          <>
            <p className="tcl-bar-chart__inspector-title">
              {inspected.title}
              <span className="tcl-bar-chart__inspector-value">
                {' · '}
                {inspected.valueText}
              </span>
              {inspected.sub && (
                <span className="tcl-bar-chart__inspector-sub"> {inspected.sub}</span>
              )}
            </p>
            {inspected.note && <p className="tcl-bar-chart__inspector-note">{inspected.note}</p>}
          </>
        ) : (
          <p className="tcl-bar-chart__inspector-hint">Select a bar to inspect its value.</p>
        )}
      </div>
    </div>
  );
}
