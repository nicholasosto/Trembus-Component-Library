import { useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import { toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import './DonutChart.css';

/**
 * `DonutChart` — a proportion ring with a center readout and an interactive
 * legend. It consumes a Trembus Visual Grammar **donut contract**. The ring is
 * drawn in SVG (decorative); the legend rows are the affordance — selecting one
 * (the Hub/BarChart spine) emphasizes its segment, swaps the center readout, and
 * reveals its share in a live inspector.
 */
export type DonutTone = FillBarTone;

export interface DonutSegment {
  /** Stable id for selection; falls back to the segment index. */
  id?: string;
  label: string;
  /** Magnitude (non-negative). */
  value: number;
  tone?: DonutTone;
  /** Explicit segment color (hex) — overrides `tone`. */
  color?: string;
  /** Inspector detail shown when this segment is selected. */
  note?: string;
}

export interface DonutContract {
  view?: 'donut';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  /** Unit appended to segment values (e.g. `h`, `%`). */
  unit?: string;
  /** Big text in the ring center (defaults to the total). */
  centerValue?: string;
  /** Small label under the center value. */
  centerLabel?: string;
  segments: DonutSegment[];
}

export interface DonutChartProps {
  /** The authored donut contract (segments + optional header/center readout). */
  data: DonutContract;
  /** Controlled selected segment id. */
  selectedId?: string;
  /** Uncontrolled initial selection. */
  defaultSelectedId?: string;
  /** Called with the segment id on every selection. */
  onSelect?: (id: string) => void;
  /** Ring diameter in px (default 160). */
  size?: number;
  className?: string;
}

const TONE_CYCLE: DonutTone[] = ['accent', 'info', 'success', 'warning', 'danger', 'neutral'];

const idOf = (s: DonutSegment, i: number): string => s.id ?? `s${i}`;
const colorOf = (s: DonutSegment, i: number): string =>
  s.color ?? toneVar(s.tone ?? TONE_CYCLE[i % TONE_CYCLE.length]);
const fmt = (v: number, unit?: string): string => `${Math.round(v * 100) / 100}${unit ?? ''}`;

const R = 54;
const C = 2 * Math.PI * R;

export function DonutChart({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  size = 160,
  className,
}: DonutChartProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultSelectedId);
  const selectedId = selProp ?? internal;
  const select = (id: string): void => {
    if (selProp === undefined) setInternal(id);
    onSelect?.(id);
  };

  const { segments, unit } = data;
  const total = useMemo(
    () => segments.reduce((sum, s) => sum + Math.max(0, s.value), 0),
    [segments],
  );
  const selectedIndex = segments.findIndex((s, i) => idOf(s, i) === selectedId);
  const selected = selectedIndex >= 0 ? segments[selectedIndex] : undefined;
  // share of the total; negative magnitudes are floored at 0 to match the ring
  const pct = (v: number): number => (total > 0 ? Math.round((100 * Math.max(0, v)) / total) : 0);

  // cumulative arc offsets
  let acc = 0;
  const arcs = segments.map((s, i) => {
    const frac = total > 0 ? Math.max(0, s.value) / total : 0;
    const len = C * frac;
    const arc = { id: idOf(s, i), len, offset: -acc, color: colorOf(s, i) };
    acc += len;
    return arc;
  });

  const centerBig = selected
    ? fmt(Math.max(0, selected.value), unit)
    : (data.centerValue ?? fmt(total, unit));
  const centerSmall = selected ? `${pct(selected.value)}%` : (data.centerLabel ?? 'total');

  return (
    <div className={cx('tcl-donut', className)}>
      {(data.code || data.title || data.caption || data.brand) && (
        <header className="tcl-donut__header">
          {data.brand && <p className="tcl-donut__brand">{data.brand}</p>}
          {data.code && <p className="tcl-donut__code">{data.code}</p>}
          {data.title && <p className="tcl-donut__title">{data.title}</p>}
          {data.caption && <p className="tcl-donut__caption">{data.caption}</p>}
        </header>
      )}

      <div className="tcl-donut__body">
        <div className="tcl-donut__ring" style={{ width: size, height: size }}>
          <svg viewBox="0 0 160 160" aria-hidden="true">
            <g transform="rotate(-90 80 80)">
              {arcs.map((a, i) => (
                <circle
                  key={i}
                  className={cx(
                    'tcl-donut__seg',
                    selected && a.id !== selectedId && 'is-dim',
                    a.id === selectedId && 'is-selected',
                  )}
                  cx={80}
                  cy={80}
                  r={R}
                  strokeDasharray={`${a.len.toFixed(2)} ${(C - a.len).toFixed(2)}`}
                  strokeDashoffset={a.offset.toFixed(2)}
                  style={{ stroke: a.color }}
                />
              ))}
            </g>
          </svg>
          <div className="tcl-donut__center">
            <span className="tcl-donut__center-value">{centerBig}</span>
            <span className="tcl-donut__center-label">{centerSmall}</span>
          </div>
        </div>

        <div className="tcl-donut__legend" role="group" aria-label={data.title ?? 'Segments'}>
          {segments.map((s, i) => {
            const id = idOf(s, i);
            const isSelected = id === selectedId;
            return (
              <button
                key={i}
                type="button"
                className={cx('tcl-donut__legend-item', isSelected && 'is-selected')}
                aria-pressed={isSelected}
                aria-label={`${s.label}: ${fmt(Math.max(0, s.value), unit)}, ${pct(s.value)}%`}
                onClick={() => select(id)}
              >
                <span
                  className="tcl-donut__swatch"
                  style={vars({ '--seg': colorOf(s, i) })}
                  aria-hidden="true"
                />
                <span className="tcl-donut__legend-label">{s.label}</span>
                <span className="tcl-donut__legend-pct">{pct(s.value)}%</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="tcl-donut__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-donut__inspector-title">
              {selected.label}
              <span className="tcl-donut__inspector-value">
                {' · '}
                {fmt(Math.max(0, selected.value), unit)} · {pct(selected.value)}%
              </span>
            </p>
            {selected.note && <p className="tcl-donut__inspector-note">{selected.note}</p>}
          </>
        ) : (
          <p className="tcl-donut__inspector-hint">Select a segment to inspect its share.</p>
        )}
      </div>
    </div>
  );
}
