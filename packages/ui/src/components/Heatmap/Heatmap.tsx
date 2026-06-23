import { Fragment, useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import { clampPct, toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import './Heatmap.css';

/**
 * `Heatmap` — a value-colored cell matrix (rows × columns). It consumes a Trembus
 * Visual Grammar **heatmap contract**. Cells are real focusable buttons (the
 * Hub/BarChart spine): each is shaded by a bucketed or continuous scale and, when
 * selected, reveals its row, column, and value in a live inspector.
 */
export type HeatTone = FillBarTone;

export interface HeatmapRow {
  label: string;
  /** Optional secondary label (e.g. a department) shown in the inspector. */
  sub?: string;
  /** Values aligned to `columns`; `null` is a no-data cell. */
  cells: (number | null)[];
}

export interface HeatmapStop {
  /** Lower bound this bucket applies from. */
  at: number;
  tone?: HeatTone;
  color?: string;
  label?: string;
}

export interface HeatmapContract {
  view?: 'heatmap';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  /** Unit appended to cell values (e.g. `%`, `d`). */
  unit?: string;
  /** Column (x) labels along the top. */
  columns: string[];
  rows: HeatmapRow[];
  /** Bucketed color scale; when omitted, a continuous intensity of `tone` is used. */
  stops?: HeatmapStop[];
  /** Base tone for the continuous scale (default `accent`). */
  tone?: HeatTone;
  /** Domain for the continuous scale; defaults to the data extent. */
  min?: number;
  max?: number;
  /** Print the value inside each cell (good for small grids). */
  showValues?: boolean;
}

export interface HeatmapProps {
  data: HeatmapContract;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

const fmt = (v: number, unit?: string): string => `${Math.round(v * 100) / 100}${unit ?? ''}`;

export function Heatmap({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: HeatmapProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultSelectedId);
  const selectedId = selProp ?? internal;
  const select = (id: string): void => {
    if (selProp === undefined) setInternal(id);
    onSelect?.(id);
  };

  const { columns, rows, unit, stops, tone = 'accent' } = data;

  const [lo, hi] = useMemo(() => {
    const vs = rows
      .flatMap((r) => r.cells)
      .filter((v): v is number => v != null && Number.isFinite(v));
    const dataLo = vs.length ? Math.min(...vs) : 0;
    const dataHi = vs.length ? Math.max(...vs) : 1;
    return [data.min ?? dataLo, data.max ?? dataHi];
  }, [rows, data.min, data.max]);

  const sortedStops = useMemo(
    () => (stops ? [...stops].sort((a, b) => a.at - b.at) : null),
    [stops],
  );

  const colorFor = (v: number): string => {
    if (sortedStops) {
      let chosen = sortedStops[0];
      for (const s of sortedStops) if (v >= s.at) chosen = s;
      return chosen.color ?? toneVar(chosen.tone ?? 'accent');
    }
    const t = clampPct(v, lo, hi); // 0..100
    const mix = 15 + (t / 100) * 85; // 15%..100% of the tone over the sunken surface
    return `color-mix(in oklab, ${toneVar(tone)} ${mix.toFixed(1)}%, var(--tcl-surface-sunken))`;
  };

  const selected = useMemo(() => {
    if (!selectedId) return undefined;
    const [ri, ci] = selectedId.split('#').map(Number);
    if (!Number.isInteger(ri) || !Number.isInteger(ci)) return undefined;
    const row = rows[ri];
    const value = row?.cells[ci];
    if (!row || ci < 0 || ci >= columns.length || value == null || !Number.isFinite(value)) {
      return undefined;
    }
    return { row, col: columns[ci], value, ri, ci };
  }, [selectedId, rows, columns]);

  return (
    <div className={cx('tcl-heatmap', className)}>
      {(data.code || data.title || data.caption || data.brand) && (
        <header className="tcl-heatmap__header">
          {data.brand && <p className="tcl-heatmap__brand">{data.brand}</p>}
          {data.code && <p className="tcl-heatmap__code">{data.code}</p>}
          {data.title && <p className="tcl-heatmap__title">{data.title}</p>}
          {data.caption && <p className="tcl-heatmap__caption">{data.caption}</p>}
        </header>
      )}

      <div
        className="tcl-heatmap__grid"
        role="group"
        aria-label={data.title ?? 'Heatmap'}
        style={{ gridTemplateColumns: `auto repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {/* header row: corner + column labels */}
        <span className="tcl-heatmap__corner" aria-hidden="true" />
        {columns.map((c, ci) => (
          <span key={`c-${ci}`} className="tcl-heatmap__colhead" aria-hidden="true" title={c}>
            {c}
          </span>
        ))}

        {/* data rows — flattened into the same grid (corner-aligned) */}
        {rows.map((row, ri) => (
          <Fragment key={`r-${ri}`}>
            <span
              className="tcl-heatmap__rowhead"
              aria-hidden="true"
              title={row.sub ? `${row.label} · ${row.sub}` : row.label}
            >
              {row.label}
            </span>
            {columns.map((col, ci) => {
              const v = row.cells[ci];
              if (v == null || !Number.isFinite(v)) {
                return (
                  <span
                    key={`cell-${ri}-${ci}`}
                    className="tcl-heatmap__cell tcl-heatmap__cell--empty"
                    aria-hidden="true"
                    title={`${row.label}, ${col}: no data`}
                  />
                );
              }
              const id = `${ri}#${ci}`;
              const isSelected = id === selectedId;
              return (
                <button
                  key={`cell-${ri}-${ci}`}
                  type="button"
                  className={cx('tcl-heatmap__cell', isSelected && 'is-selected')}
                  style={{ background: colorFor(v) }}
                  aria-pressed={isSelected}
                  aria-label={`${row.label}, ${col}: ${fmt(v, unit)}`}
                  onClick={() => select(id)}
                >
                  {data.showValues && (
                    <span className="tcl-heatmap__cell-value">{fmt(v, unit)}</span>
                  )}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>

      {/* scale legend */}
      <div className="tcl-heatmap__scale" aria-hidden="true">
        {sortedStops ? (
          sortedStops.map((s, i) => (
            <span key={i} className="tcl-heatmap__scale-stop">
              <span
                className="tcl-heatmap__scale-swatch"
                style={vars({ '--sw': s.color ?? toneVar(s.tone ?? 'accent') })}
              />
              {s.label ?? `≥ ${fmt(s.at, unit)}`}
            </span>
          ))
        ) : (
          <>
            <span>{fmt(lo, unit)}</span>
            <span
              className="tcl-heatmap__scale-gradient"
              style={vars({
                '--g0': `color-mix(in oklab, ${toneVar(tone)} 15%, var(--tcl-surface-sunken))`,
                '--g1': toneVar(tone),
              })}
            />
            <span>{fmt(hi, unit)}</span>
          </>
        )}
      </div>

      <div className="tcl-heatmap__inspector" aria-live="polite">
        {selected ? (
          <p className="tcl-heatmap__inspector-title">
            {selected.row.label}
            {selected.row.sub && (
              <span className="tcl-heatmap__inspector-sub"> · {selected.row.sub}</span>
            )}
            <span className="tcl-heatmap__inspector-value">
              {' · '}
              {selected.col} · {fmt(selected.value, unit)}
            </span>
          </p>
        ) : (
          <p className="tcl-heatmap__inspector-hint">Select a cell to inspect its value.</p>
        )}
      </div>
    </div>
  );
}
