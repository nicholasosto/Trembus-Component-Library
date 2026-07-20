import { useId, useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import { toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import './LineChart.css';

/**
 * `LineChart` — a multi-series trend chart with an optional target line and
 * tolerance band. It consumes a Trembus Visual Grammar **line-chart contract**
 * (the same authored shape the static HTML kit renders) so one contract draws in
 * both places. Lines, grid, band, and target are drawn in a proportionally-scaled
 * SVG; each data point is a real focusable button (the Hub/BarChart interaction
 * spine) whose selection is revealed in a live inspector.
 */
export type LineTone = FillBarTone;

export interface LinePoint {
  /** Category / x-axis label (e.g. a week). */
  x: string;
  /** Value; `null` (or non-finite) is a gap the line skips. */
  y: number | null;
  /** Inspector detail shown when this point is selected. */
  note?: string;
}

export interface LineSeries {
  /** Stable id for selection; falls back to the series index. */
  id?: string;
  name: string;
  /** Explicit line color (hex) — overrides `tone`. */
  color?: string;
  /** Color-coded tone (defaults cycle through the ontology by series order). */
  tone?: LineTone;
  /** Render the line dashed (e.g. a comparison/forecast series). */
  dashed?: boolean;
  /** Fill the area beneath the line. */
  fill?: boolean;
  points: LinePoint[];
}

export interface LineBand {
  lo: number;
  hi: number;
  label?: string;
  tone?: LineTone;
}

export interface LineTarget {
  value: number;
  label?: string;
  tone?: LineTone;
}

export interface LineChartContract {
  view?: 'line-chart';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  /** Unit suffix appended to every value label (e.g. `%`, `d`, `k`). */
  unit?: string;
  /** Force the y-axis minimum; otherwise derived from data (and band/target). */
  yMin?: number;
  /** Force the y-axis maximum. */
  yMax?: number;
  /** Shaded tolerance zone between two values. */
  band?: LineBand;
  /** Reference line drawn across the plot (a target / threshold). */
  target?: LineTarget;
  series: LineSeries[];
}

export interface LineChartProps {
  /** The authored line-chart contract (series + optional band/target/header). */
  data: LineChartContract;
  /** Controlled selected point id (`"{seriesId}#{index}"`). */
  selectedId?: string;
  /** Uncontrolled initial selection. */
  defaultSelectedId?: string;
  /** Called with the point id (`"{seriesId}#{index}"`) on every selection. */
  onSelect?: (id: string) => void;
  /** Plot viewBox height; sets the chart aspect ratio (default 220). */
  height?: number;
  className?: string;
}

const W = 600;
const PAD_L = 46;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 26;

const TONE_CYCLE: LineTone[] = ['accent', 'info', 'success', 'warning', 'danger'];

/** Stable, collision-proof series key: explicit id, else the series index. */
const sidOf = (s: LineSeries, i: number): string => s.id ?? `s${i}`;
const seriesColor = (s: LineSeries, i: number): string =>
  s.color ?? toneVar(s.tone ?? TONE_CYCLE[i % TONE_CYCLE.length]);

/** Round axis/value labels to 2dp, trimming trailing-zero noise. */
const num = (v: number): string => String(Math.round(v * 100) / 100);

export function LineChart({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  height = 220,
  className,
}: LineChartProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultSelectedId);
  const selectedId = selProp ?? internal;
  const select = (id: string): void => {
    if (selProp === undefined) setInternal(id);
    onSelect?.(id);
  };

  const { series, unit, band, target } = data;
  const H = height;
  const fmtVal = (v: number): string => `${num(v)}${unit ?? ''}`;

  const count = Math.max(1, ...series.map((s) => s.points.length));

  // y-domain: data extent (expanded to enclose band + target), padded, with
  // explicit yMin/yMax overrides — clamped so the domain can never invert.
  const { lo, hi } = useMemo(() => {
    const ys = series
      .flatMap((s) => s.points.map((p) => p.y))
      .filter((v): v is number => v != null && Number.isFinite(v));
    let dataLo = ys.length ? Math.min(...ys) : 0;
    let dataHi = ys.length ? Math.max(...ys) : 1;
    if (band) {
      dataLo = Math.min(dataLo, band.lo);
      dataHi = Math.max(dataHi, band.hi);
    }
    if (target) {
      dataLo = Math.min(dataLo, target.value);
      dataHi = Math.max(dataHi, target.value);
    }
    if (dataLo === dataHi) {
      const d = Math.abs(dataLo) * 0.1 + 1;
      dataLo -= d;
      dataHi += d;
    }
    const pad = (dataHi - dataLo) * 0.08;
    let loR = data.yMin ?? dataLo - pad;
    let hiR = data.yMax ?? dataHi + pad;
    // Preserve the caller's bounds: swap an inverted pair rather than discard one.
    if (hiR < loR) [loR, hiR] = [hiR, loR];
    if (hiR === loR) hiR = loR + (Math.abs(loR) * 0.1 + 1);
    return { lo: loR, hi: hiR };
  }, [series, band, target, data.yMin, data.yMax]);

  const x = (i: number): number =>
    count <= 1 ? PAD_L + (W - PAD_L - PAD_R) / 2 : PAD_L + (i / (count - 1)) * (W - PAD_L - PAD_R);
  const y = (v: number): number => PAD_T + (1 - (v - lo) / (hi - lo)) * (H - PAD_T - PAD_B);

  // x labels come from the longest series (assumes left-aligned, shared ticks).
  const axisSeries = series.reduce(
    (a, b) => (b.points.length > a.points.length ? b : a),
    series[0] ?? { points: [] as LinePoint[] },
  );
  const xLabels = axisSeries.points.map((p) => p.x);
  const xStep = Math.max(1, Math.ceil(count / 8));

  const ticks = [0, 1, 2, 3, 4].map((k) => lo + ((hi - lo) * k) / 4);

  const finiteOf = (s: LineSeries): { i: number; p: LinePoint; v: number }[] =>
    s.points
      .map((p, i) => ({ i, p, v: p.y as number }))
      .filter((o) => o.p.y != null && Number.isFinite(o.p.y));

  const clipId = `lc-clip-${useId().replace(/:/g, '')}`;

  const selected = useMemo(() => {
    for (let si = 0; si < series.length; si++) {
      const s = series[si];
      for (const { i, p } of finiteOf(s)) {
        if (`${sidOf(s, si)}#${i}` === selectedId) return { s, i, p };
      }
    }
    return undefined;
  }, [series, selectedId]);

  const groupLabel =
    (data.title ?? data.code ?? 'Line chart') +
    (target ? `, target ${fmtVal(target.value)}` : '') +
    (band ? `, tolerance band ${fmtVal(band.lo)} to ${fmtVal(band.hi)}` : '');

  return (
    <div className={cx('tcl-line-chart', className)}>
      {(data.code || data.title || data.caption || data.brand) && (
        <header className="tcl-line-chart__header">
          {data.brand && <p className="tcl-line-chart__brand">{data.brand}</p>}
          {data.code && <p className="tcl-line-chart__code">{data.code}</p>}
          {data.title && <p className="tcl-line-chart__title">{data.title}</p>}
          {data.caption && <p className="tcl-line-chart__caption">{data.caption}</p>}
        </header>
      )}

      <div className="tcl-line-chart__plot">
        <div className="tcl-line-chart__canvas" role="group" aria-label={groupLabel}>
          <svg
            className="tcl-line-chart__svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <defs>
              <clipPath id={clipId}>
                <rect x={PAD_L} y={PAD_T} width={W - PAD_L - PAD_R} height={H - PAD_T - PAD_B} />
              </clipPath>
            </defs>

            {/* gridlines + y ticks */}
            {ticks.map((v, k) => (
              <g key={`t-${k}`}>
                <line
                  className="tcl-line-chart__grid"
                  x1={PAD_L}
                  y1={y(v)}
                  x2={W - PAD_R}
                  y2={y(v)}
                />
                <text
                  className="tcl-line-chart__axis-text"
                  x={PAD_L - 6}
                  y={y(v) + 3}
                  textAnchor="end"
                >
                  {num(v)}
                </text>
              </g>
            ))}

            {/* tolerance band */}
            {band && (
              <g style={vars({ '--bnd': toneVar(band.tone ?? 'success') })}>
                <rect
                  className="tcl-line-chart__band"
                  x={PAD_L}
                  y={y(band.hi)}
                  width={W - PAD_L - PAD_R}
                  height={Math.abs(y(band.lo) - y(band.hi))}
                />
                <line
                  className="tcl-line-chart__band-edge"
                  x1={PAD_L}
                  y1={y(band.hi)}
                  x2={W - PAD_R}
                  y2={y(band.hi)}
                />
                <line
                  className="tcl-line-chart__band-edge"
                  x1={PAD_L}
                  y1={y(band.lo)}
                  x2={W - PAD_R}
                  y2={y(band.lo)}
                />
                {band.label && (
                  <text
                    className="tcl-line-chart__band-label"
                    x={W - PAD_R}
                    y={y(band.hi) - 3}
                    textAnchor="end"
                  >
                    {band.label}
                  </text>
                )}
              </g>
            )}

            {/* target line */}
            {target && (
              <g style={vars({ '--tgt': toneVar(target.tone ?? 'warning') })}>
                <line
                  className="tcl-line-chart__target"
                  x1={PAD_L}
                  y1={y(target.value)}
                  x2={W - PAD_R}
                  y2={y(target.value)}
                />
                {target.label && (
                  <text
                    className="tcl-line-chart__target-label"
                    x={W - PAD_R}
                    y={y(target.value) - 4}
                    textAnchor="end"
                  >
                    {target.label}
                  </text>
                )}
              </g>
            )}

            {/* x ticks */}
            {xLabels.map((lb, i) =>
              i % xStep === 0 || i === count - 1 ? (
                <text
                  key={`x-${i}`}
                  className="tcl-line-chart__axis-text"
                  x={x(i)}
                  y={H - 8}
                  textAnchor="middle"
                >
                  {lb}
                </text>
              ) : null,
            )}

            {/* series: area fill, then line — clipped to the plot rect so a
                forced yMin/yMax that crops the data can't draw outside the axes */}
            <g clipPath={`url(#${clipId})`}>
              {series.map((s, si) => {
                const fin = finiteOf(s);
                if (!fin.length) return null;
                const color = seriesColor(s, si);
                const linePts = fin
                  .map((o) => `${x(o.i).toFixed(2)},${y(o.v).toFixed(2)}`)
                  .join(' ');
                const areaPts = `${linePts} ${x(fin[fin.length - 1].i).toFixed(2)},${H - PAD_B} ${x(
                  fin[0].i,
                ).toFixed(2)},${H - PAD_B}`;
                return (
                  <g key={`s-${si}`}>
                    {s.fill && fin.length > 1 && (
                      <polygon
                        className="tcl-line-chart__area"
                        points={areaPts}
                        style={{ fill: color }}
                      />
                    )}
                    {fin.length > 1 && (
                      <polyline
                        className={cx('tcl-line-chart__line', s.dashed && 'is-dashed')}
                        points={linePts}
                        style={{ stroke: color }}
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* interactive points — real buttons overlaid on the plot (the a11y spine) */}
          <div className="tcl-line-chart__points">
            {series.map((s, si) => {
              const color = seriesColor(s, si);
              return finiteOf(s).map(({ i, p, v }) => {
                // skip points cropped out by a forced yMin/yMax (no phantom buttons)
                if (v < lo || v > hi) return null;
                const id = `${sidOf(s, si)}#${i}`;
                const isSelected = id === selectedId;
                return (
                  <button
                    key={`${si}#${i}`}
                    type="button"
                    className={cx('tcl-line-chart__dot', isSelected && 'is-selected')}
                    style={vars({
                      '--dot': color,
                      left: `${(x(i) / W) * 100}%`,
                      top: `${(y(v) / H) * 100}%`,
                    })}
                    aria-pressed={isSelected}
                    aria-label={`${s.name}, ${p.x}: ${fmtVal(v)}`}
                    onClick={() => select(id)}
                  />
                );
              });
            })}
          </div>
        </div>

        {series.length > 0 && (
          <div className="tcl-line-chart__legend">
            {series.map((s, si) => (
              <span key={sidOf(s, si)} className="tcl-line-chart__legend-item">
                <span
                  className={cx('tcl-line-chart__legend-swatch', s.dashed && 'is-dashed')}
                  style={vars({ '--dot': seriesColor(s, si) })}
                  aria-hidden="true"
                />
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="tcl-line-chart__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-line-chart__inspector-title">
              {selected.s.name}
              <span className="tcl-line-chart__inspector-value">
                {' · '}
                {selected.p.x} · {fmtVal(selected.p.y as number)}
              </span>
            </p>
            {selected.p.note && <p className="tcl-line-chart__inspector-note">{selected.p.note}</p>}
          </>
        ) : (
          <p className="tcl-line-chart__inspector-hint">Select a point to inspect its value.</p>
        )}
      </div>
    </div>
  );
}
