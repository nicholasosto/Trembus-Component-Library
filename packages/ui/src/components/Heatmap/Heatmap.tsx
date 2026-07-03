import { Fragment, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { clampPct, toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import './Heatmap.css';

/**
 * `Heatmap` — a value-colored cell matrix (rows × columns). It consumes a Trembus
 * Visual Grammar **heatmap contract**. Cells are real focusable buttons (the
 * Hub/BarChart spine): each is shaded by a bucketed or continuous scale and, when
 * selected, reveals its row, column, and value in a live inspector.
 *
 * Two selection modes: the default `'cell'` selects a single cell; `'row'` turns
 * each row into one focusable button that selects the whole row (a master-detail
 * target), leaving the cells decorative. Columns can carry their own tone ramp
 * (`columnTones`) so one metric reads distinctly from the rest.
 */
export type HeatTone = FillBarTone;

export interface HeatmapRow {
  /** String accessible name for the row — used in cell/row aria-labels and titles. */
  label: string;
  /**
   * Optional rich content for the row header (e.g. a styled "serial · title").
   * Falls back to `label`; `label` stays the string accessible name.
   */
  display?: ReactNode;
  /** Optional secondary label (e.g. a department) shown in the inspector. */
  sub?: string;
  /** Values aligned to `columns`; `null` is a no-data cell. */
  cells: (number | null)[];
  /** Stable row id for `selectionMode="row"` (survives reordering); falls back to the row index. */
  id?: string;
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
  /**
   * Per-column tone for the continuous scale, keyed by column index. A column
   * with no entry uses the global `tone`. Ignored when `stops` are given (those
   * define explicit bucket colors). The color domain stays shared across columns.
   */
  columnTones?: HeatTone[];
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
  /** Unit of selection (default `'cell'`). `'row'` selects a whole row for master-detail. */
  selectionMode?: 'cell' | 'row';
  /** Selected cell id (`"${rowIndex}#${colIndex}"`) — cell mode. */
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  /** Selected row id (`HeatmapRow.id`, or the row index as a string) — row mode. */
  selectedRowId?: string;
  defaultSelectedRowId?: string;
  onSelectRow?: (id: string) => void;
  /**
   * Show the built-in value inspector (default `true`). When `false`, a hidden
   * `aria-live` region still announces the selection so nothing is lost to a
   * screen reader when the consumer drives its own detail drawer.
   */
  showInspector?: boolean;
  /** Show the built-in scale legend (default `true`). */
  showScale?: boolean;
  className?: string;
}

const fmt = (v: number, unit?: string): string => `${Math.round(v * 100) / 100}${unit ?? ''}`;

export function Heatmap({
  data,
  selectionMode = 'cell',
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  selectedRowId: selRowProp,
  defaultSelectedRowId,
  onSelectRow,
  showInspector = true,
  showScale = true,
  className,
}: HeatmapProps) {
  const rowMode = selectionMode === 'row';

  const [internalCell, setInternalCell] = useState<string | undefined>(defaultSelectedId);
  const selectedId = selProp ?? internalCell;
  const selectCell = (id: string): void => {
    if (selProp === undefined) setInternalCell(id);
    onSelect?.(id);
  };

  const [internalRow, setInternalRow] = useState<string | undefined>(defaultSelectedRowId);
  const selectedRowId = selRowProp ?? internalRow;
  const selectRow = (id: string): void => {
    if (selRowProp === undefined) setInternalRow(id);
    onSelectRow?.(id);
  };

  const { columns, rows, unit, stops, tone = 'accent', columnTones } = data;

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

  // Per-column tone shades off that column's ramp; the [lo,hi] domain stays shared.
  const colorFor = (v: number, ci: number): string => {
    if (sortedStops) {
      let chosen = sortedStops[0];
      for (const s of sortedStops) if (v >= s.at) chosen = s;
      return chosen.color ?? toneVar(chosen.tone ?? 'accent');
    }
    const colTone = columnTones?.[ci] ?? tone;
    const t = clampPct(v, lo, hi); // 0..100
    const mix = 15 + (t / 100) * 85; // 15%..100% of the tone over the sunken surface
    return `color-mix(in oklab, ${toneVar(colTone)} ${mix.toFixed(1)}%, var(--tcl-surface-sunken))`;
  };

  const rowIdAt = (row: HeatmapRow, i: number): string => row.id ?? String(i);

  // Cell-inspector target (cell mode).
  const selectedCell = useMemo(() => {
    if (rowMode || !selectedId) return undefined;
    const [ri, ci] = selectedId.split('#').map(Number);
    if (!Number.isInteger(ri) || !Number.isInteger(ci)) return undefined;
    const row = rows[ri];
    const value = row?.cells[ci];
    if (!row || ci < 0 || ci >= columns.length || value == null || !Number.isFinite(value)) {
      return undefined;
    }
    return { row, col: columns[ci], value, ri, ci };
  }, [rowMode, selectedId, rows, columns]);

  // Row-inspector target (row mode).
  const selectedRow = useMemo(() => {
    if (!rowMode || selectedRowId == null) return undefined;
    const idx = rows.findIndex((r, i) => rowIdAt(r, i) === selectedRowId);
    return idx >= 0 ? rows[idx] : undefined;
  }, [rowMode, selectedRowId, rows]);

  // Plain-text announcement — used verbatim by the hidden live region and mirrored
  // by the visible inspector's text content.
  const announce = rowMode
    ? selectedRow
      ? `${selectedRow.label}${selectedRow.sub ? ` · ${selectedRow.sub}` : ''} selected`
      : ''
    : selectedCell
      ? `${selectedCell.row.label}, ${selectedCell.col}: ${fmt(selectedCell.value, unit)}`
      : '';

  return (
    <div className={cx('tcl-heatmap', rowMode && 'tcl-heatmap--rows', className)}>
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

        {/* data rows */}
        {rows.map((row, ri) => {
          const head = (
            <span
              className="tcl-heatmap__rowhead"
              aria-hidden="true"
              title={row.sub ? `${row.label} · ${row.sub}` : row.label}
            >
              {row.display ?? row.label}
            </span>
          );

          const cells = columns.map((col, ci) => {
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
            // Row mode: the cell is decorative (still tinted / may show values); the
            // row button below is the click target.
            if (rowMode) {
              return (
                <span
                  key={`cell-${ri}-${ci}`}
                  className="tcl-heatmap__cell tcl-heatmap__cell--static"
                  aria-hidden="true"
                  style={{ background: colorFor(v, ci) }}
                >
                  {data.showValues && (
                    <span className="tcl-heatmap__cell-value">{fmt(v, unit)}</span>
                  )}
                </span>
              );
            }
            const id = `${ri}#${ci}`;
            const isSelected = id === selectedId;
            return (
              <button
                key={`cell-${ri}-${ci}`}
                type="button"
                className={cx('tcl-heatmap__cell', isSelected && 'is-selected')}
                style={{ background: colorFor(v, ci) }}
                aria-pressed={isSelected}
                aria-label={`${row.label}, ${col}: ${fmt(v, unit)}`}
                onClick={() => selectCell(id)}
              >
                {data.showValues && <span className="tcl-heatmap__cell-value">{fmt(v, unit)}</span>}
              </button>
            );
          });

          if (rowMode) {
            const rid = rowIdAt(row, ri);
            const isSelected = rid === selectedRowId;
            return (
              <button
                key={`r-${ri}`}
                type="button"
                className={cx('tcl-heatmap__row', isSelected && 'is-selected')}
                aria-current={isSelected ? 'true' : undefined}
                aria-label={row.sub ? `${row.label} · ${row.sub}` : row.label}
                onClick={() => selectRow(rid)}
              >
                {head}
                {cells}
              </button>
            );
          }

          return (
            <Fragment key={`r-${ri}`}>
              {head}
              {cells}
            </Fragment>
          );
        })}
      </div>

      {/* scale legend */}
      {showScale && (
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
      )}

      {showInspector ? (
        <div className="tcl-heatmap__inspector" aria-live="polite">
          {rowMode ? (
            selectedRow ? (
              <p className="tcl-heatmap__inspector-title">
                {selectedRow.label}
                {selectedRow.sub && (
                  <span className="tcl-heatmap__inspector-sub"> · {selectedRow.sub}</span>
                )}
              </p>
            ) : (
              <p className="tcl-heatmap__inspector-hint">Select a row to inspect it.</p>
            )
          ) : selectedCell ? (
            <p className="tcl-heatmap__inspector-title">
              {selectedCell.row.label}
              {selectedCell.row.sub && (
                <span className="tcl-heatmap__inspector-sub"> · {selectedCell.row.sub}</span>
              )}
              <span className="tcl-heatmap__inspector-value">
                {' · '}
                {selectedCell.col} · {fmt(selectedCell.value, unit)}
              </span>
            </p>
          ) : (
            <p className="tcl-heatmap__inspector-hint">Select a cell to inspect its value.</p>
          )}
        </div>
      ) : (
        // Chrome hidden, but selection still reaches assistive tech.
        <div className="tcl-heatmap__sr-live" aria-live="polite">
          {announce}
        </div>
      )}
    </div>
  );
}
