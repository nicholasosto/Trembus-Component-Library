import { Fragment, useMemo } from 'react';
import { Glyph } from '@trembus/icons';
import { cx } from '../../utils/cx';
import { isFillBarTone, toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import { useSelection } from '../../internal/useSelection';
import './MilestoneTrack.css';

export type MilestoneTrackTone = FillBarTone;
export type MilestoneStatus = 'done' | 'active' | 'pending';

export interface MilestoneStation {
  /** Stable id for selection + metric/group references; falls back to the index (NEVER the label). */
  id?: string;
  /** Milestone name (e.g. "Ticket created"). */
  label: string;
  /** Micro-line under the label (e.g. "≥80%"). */
  sub?: string;
  /** Progress state — `pending` hollows the node and dashes its rail segments (default `done`). */
  status?: MilestoneStatus;
  /** Small chip under the label (e.g. "pending source"). */
  badge?: string;
  /** Inspector detail revealed on selection. */
  note?: string;
}

export interface MilestoneMetric {
  /** Stable id for selection; falls back to the index. */
  id?: string;
  /** Start station — matches a station's `id` or `label`. */
  from: string;
  /** End station — matches a station's `id` or `label`. The bubble renders in the last free gap before it. */
  to: string;
  /** Measured magnitude (non-negative) — drives the readout and the share-of-total meter. */
  value: number;
  /** Unit for this metric (defaults to the contract `unit`, then `d`). */
  unit?: string;
  /** Bubble headline (defaults to "<from label> → <to label>"). */
  label?: string;
  /** Sample-size line (e.g. "605 completed"). */
  count?: string;
  /** Color-coded tone for the bubble (default `warning`, so it swells apart from the rail accent). */
  tone?: MilestoneTrackTone;
  /** Inspector detail revealed on selection. */
  note?: string;
}

export interface MilestoneGroup {
  /** Stable key (defaults to the label). */
  id?: string;
  /** Band label (e.g. "Jira Service Desk") — folded into member stations' accessible names. */
  label: string;
  /** Glyph name from the `@trembus/icons` registry (e.g. `'cloud'`, `'zap'`, `'box'`); unknown names degrade to nothing. */
  glyph?: string;
  /** First member station — matches a station's `id` or `label`. */
  from: string;
  /** Last member station — matches a station's `id` or `label`. */
  to: string;
}

export interface MilestoneTrackContract {
  /** Visual Grammar discriminator. */
  view?: 'milestone-track';
  /** Brand line above the title. */
  brand?: string;
  /** Machine code line (e.g. "ops.lead-time"), display-set in the header. */
  code?: string;
  /** Track title — also the accessible name of the stop group. */
  title?: string;
  /** One-line caption under the title. */
  caption?: string;
  /** Right-aligned header meta. Defaults to the summed metric total (e.g. "28.9 d measured"). */
  meta?: string;
  /** Default unit for metric values (default `d`). */
  unit?: string;
  /** Milestones in flow order, left to right. */
  stations: MilestoneStation[];
  /** Interval measurements between station pairs — each swells the rail into a bubble. */
  metrics?: MilestoneMetric[];
  /** Source-system bands above the rail; boundaries between bands draw handoff dividers. */
  groups?: MilestoneGroup[];
}

export interface MilestoneTrackProps {
  /** The authored track contract (stations + metrics + groups) to lay out. */
  data: MilestoneTrackContract;
  /** Controlled selected station/metric id. */
  selectedId?: string;
  /** Initial selection for uncontrolled use. */
  defaultSelectedId?: string;
  /** Called with the station/metric id on every selection. */
  onSelect?: (id: string) => void;
  className?: string;
}

/** Accent painted as TEXT fails AA on light surfaces → fall back to --tcl-text; other tones keep their hue. */
const toneInk = (tone: MilestoneTrackTone): string =>
  tone === 'accent' ? 'var(--tcl-text)' : toneVar(tone);

const STATUS_WORD: Record<MilestoneStatus, string> = {
  done: 'Complete',
  active: 'In progress',
  pending: 'Pending',
};

/** Statuses arrive from authored JSON — an own-property miss ('constructor', a typo)
 *  must degrade to `done`, never resolve the prototype chain (the registry gotcha). */
const statusOf = (station: MilestoneStation): MilestoneStatus => {
  const raw = station.status ?? 'done';
  return Object.hasOwn(STATUS_WORD, raw) ? raw : 'done';
};

// Deterministic geometry (px). The canvas SVG and the absolutely-positioned
// stop buttons share this exact coordinate space, so tapers always meet their
// bubbles and nodes always sit on the rail.
const PAD_X = 24; // track inset before the lead-in rail
const STATION_HALF = 56; // station button half-width (labels wrap inside it)
const GAP_PLAIN = 126; // node pitch without a bubble
const GAP_METRIC = 260; // node pitch with a bubble
const ATTACH = 18; // bare rail between a node and the start of a swell
const PINCH = 40; // horizontal run of each swell taper
const NODE_R = 7; // station node radius
const BUBBLE_HALF = 46; // capsule half-height
const GROUP_H = 44; // group band zone above the rail
const RAIL_Y = GROUP_H + 10 + BUBBLE_HALF; // 100
const RAIL_HALF = 1.5; // half the rail stroke — tapers grow from this thickness
const STATION_TOP = RAIL_Y - 16; // station button top (covers the node)
const STATION_H = 104; // node zone + up to two label lines + badge
const TRACK_H = STATION_TOP + STATION_H + 8;
const LEAD_OUT = 26; // rail run past the last node, before the arrowhead
const GROUP_LINE_Y = 22; // group band hairline
const WHISKER_Y = RAIL_Y + 10; // measured-span underline hugs the rail

const fmt = (v: number, unit: string): string => `${Math.round(v * 100) / 100} ${unit}`;

/** A rounded share percentage that never claims "0%" for a real nonzero measurement. */
const pctText = (share: number): string => {
  const pct = Math.round(share * 100);
  return pct === 0 && share > 0 ? '<1' : String(pct);
};

interface PlacedStation {
  key: string;
  station: MilestoneStation;
  x: number;
  status: MilestoneStatus;
  groupLabel?: string;
}

interface PlacedBubble {
  key: string;
  metric: MilestoneMetric;
  gap: number; // bubble occupies the gap between stations `gap` and `gap+1`
  xL: number; // rail attach points (taper start/end)
  xR: number;
  label: string;
  valueText: string;
  tone: MilestoneTrackTone;
  share?: number; // 0–1 share of the measured total (uniform units + 2+ metrics only)
  spanFrom: number; // measured station span (indices) — may be wider than the gap
  spanTo: number;
}

interface PlacedGroup {
  key: string;
  group: MilestoneGroup;
  x0: number;
  x1: number;
  fromIdx: number;
  toIdx: number;
}

interface Segment {
  x1: number;
  x2: number;
  pending: boolean;
}

interface Layout {
  stations: PlacedStation[];
  bubbles: PlacedBubble[];
  groups: PlacedGroup[];
  segments: Segment[];
  dividers: number[];
  whiskers: Array<{ key: string; x1: number; x2: number; tone: MilestoneTrackTone }>;
  arrowX: number;
  arrowPending: boolean;
  width: number;
  totalText?: string; // e.g. "28.9 d measured" — only when metric units are uniform
}

function buildLayout(data: MilestoneTrackContract): Layout {
  const rawStations = data.stations ?? [];
  const trackUnit = data.unit ?? 'd';

  // ── station keys: authored id first-wins; collisions/fallbacks uniquified so
  // duplicate ids can't select two stops at once (the DecisionMap precedent).
  // Index fallbacks must never squat on an authored id (`{label:'A'}, {id:'s0'}`
  // would otherwise hand A the key `s0` while refs resolve `s0` to the other
  // station), so fallbacks skip every authored id too.
  const seen = new Set<string>();
  const authoredIds = new Set<string>();
  rawStations.forEach((s) => s.id !== undefined && authoredIds.add(s.id));
  (data.metrics ?? []).forEach((m) => m.id !== undefined && authoredIds.add(m.id));
  const uniquify = (base: string, isFallback = false): string => {
    let key = base;
    let n = 1;
    while (seen.has(key) || (isFallback && authoredIds.has(key))) key = `${base}-dup${n++}`;
    seen.add(key);
    return key;
  };

  const idIndex = new Map<string, number>();
  const labelIndex = new Map<string, number>();
  const keyed = rawStations.map((station, i) => {
    if (station.id !== undefined && !idIndex.has(station.id)) idIndex.set(station.id, i);
    if (!labelIndex.has(station.label)) labelIndex.set(station.label, i);
    return {
      station,
      key: station.id !== undefined ? uniquify(station.id) : uniquify(`s${i}`, true),
    };
  });
  const resolve = (ref: string): number | undefined => idIndex.get(ref) ?? labelIndex.get(ref);

  // ── metrics: resolve refs (id beats label, first wins), drop unresolvable or
  // degenerate spans, normalize inverted pairs (the forced-domain clamp rule).
  const resolved = (data.metrics ?? []).flatMap((metric, i) => {
    if (typeof metric.value !== 'number' || !Number.isFinite(metric.value) || metric.value < 0) {
      return [];
    }
    const a = resolve(metric.from);
    const b = resolve(metric.to);
    if (a === undefined || b === undefined || a === b) return [];
    return [{ metric, i, from: Math.min(a, b), to: Math.max(a, b) }];
  });

  // ── one bubble per gap: each metric takes the last free gap inside its span
  // (so a long-span metric sits just before its destination, like the source
  // strip). A metric whose span is fully occupied is omitted.
  const gapOwner: Array<number | undefined> = new Array(Math.max(0, rawStations.length - 1)).fill(
    undefined,
  );
  const placedMetrics = resolved.flatMap((r, order) => {
    for (let g = r.to - 1; g >= r.from; g--) {
      if (gapOwner[g] === undefined) {
        gapOwner[g] = order;
        return [{ ...r, gap: g }];
      }
    }
    return [];
  });

  // ── x positions: cumulative pitch, wide where a bubble lives.
  const xs: number[] = [];
  keyed.forEach((_, i) => {
    xs[i] =
      i === 0
        ? PAD_X + STATION_HALF
        : xs[i - 1] + (gapOwner[i - 1] !== undefined ? GAP_METRIC : GAP_PLAIN);
  });

  // ── share of measured total: only meaningful when every placed metric speaks
  // ONE unit (mixed units would sum apples and oranges). Metrics may uniformly
  // override the track unit — the total then reports in THEIR unit.
  const metricUnits = new Set(placedMetrics.map((p) => p.metric.unit ?? trackUnit));
  const uniform = metricUnits.size <= 1;
  const sharedUnit = metricUnits.size === 1 ? [...metricUnits][0] : trackUnit;
  const total = placedMetrics.reduce((sum, p) => sum + p.metric.value, 0);
  const showShare = uniform && placedMetrics.length >= 2 && total > 0;

  const bubbles: PlacedBubble[] = placedMetrics.map((p) => {
    const unit = p.metric.unit ?? trackUnit;
    return {
      key: uniquify(p.metric.id ?? `m${p.i}`),
      metric: p.metric,
      gap: p.gap,
      xL: xs[p.gap] + ATTACH,
      xR: xs[p.gap + 1] - ATTACH,
      label: p.metric.label ?? `${rawStations[p.from].label} → ${rawStations[p.to].label}`,
      valueText: fmt(p.metric.value, unit),
      // Authored junk ('constructor') must not bypass the accent→text ink remap.
      tone: p.metric.tone !== undefined && isFillBarTone(p.metric.tone) ? p.metric.tone : 'warning',
      share: showShare ? p.metric.value / total : undefined,
      spanFrom: p.from,
      spanTo: p.to,
    };
  });

  // ── groups: resolve + normalize; a station's first covering group joins its
  // accessible name (the band chrome itself is decorative).
  const groups: PlacedGroup[] = (data.groups ?? []).flatMap((group, i) => {
    const a = resolve(group.from);
    const b = resolve(group.to);
    if (a === undefined || b === undefined) return [];
    const fromIdx = Math.min(a, b);
    const toIdx = Math.max(a, b);
    return [
      {
        // Groups build after stations + bubbles, so the shared uniquify can't
        // disturb selectable keys; duplicate group ids must not collide either.
        key: group.id !== undefined ? uniquify(group.id) : uniquify(`g${i}`, true),
        group,
        fromIdx,
        toIdx,
        x0: xs[fromIdx] - 40,
        x1: xs[toIdx] + 40,
      },
    ];
  });
  groups.sort((a, b) => a.fromIdx - b.fromIdx || a.toIdx - b.toIdx);

  const stations: PlacedStation[] = keyed.map(({ station, key }, i) => ({
    key,
    station,
    x: xs[i],
    status: statusOf(station),
    groupLabel: groups.find((g) => g.fromIdx <= i && i <= g.toIdx)?.group.label,
  }));

  // ── handoff dividers between consecutive bands — skipped where a bubble
  // already separates the systems (no line through a capsule).
  const dividers: number[] = [];
  for (let i = 1; i < groups.length; i++) {
    const prev = groups[i - 1];
    const next = groups[i];
    if (prev.toIdx >= next.fromIdx) continue;
    const x = (xs[prev.toIdx] + xs[next.fromIdx]) / 2;
    const covered = bubbles.some((b) => x >= b.xL - 4 && x <= b.xR + 4);
    if (!covered) dividers.push(x);
  }

  const pendingAt = (i: number): boolean => stations[i]?.status === 'pending';
  const segments: Segment[] = [];
  if (stations.length > 0) {
    segments.push({ x1: 6, x2: xs[0], pending: pendingAt(0) });
    for (let i = 0; i < stations.length - 1; i++) {
      segments.push({ x1: xs[i], x2: xs[i + 1], pending: pendingAt(i) || pendingAt(i + 1) });
    }
  }
  const lastX = stations.length ? xs[stations.length - 1] : PAD_X;
  const arrowPending = stations.length ? pendingAt(stations.length - 1) : false;
  if (stations.length > 0) {
    segments.push({ x1: lastX, x2: lastX + LEAD_OUT, pending: arrowPending });
  }

  const whiskers = bubbles
    .filter((b) => b.spanTo - b.spanFrom > 1)
    .map((b) => ({ key: b.key, x1: xs[b.spanFrom], x2: xs[b.spanTo], tone: b.tone }));

  return {
    stations,
    bubbles,
    groups,
    segments,
    dividers,
    whiskers,
    arrowX: lastX + LEAD_OUT,
    arrowPending,
    width: stations.length ? lastX + STATION_HALF + 44 : PAD_X * 2,
    totalText:
      uniform && placedMetrics.length > 0 ? `${fmt(total, sharedUnit)} measured` : undefined,
  };
}

/** The swell taper: rail thickness at `x0`, full bubble height `PINCH` later. */
function taperPath(x0: number, dir: 1 | -1): { fill: string; top: string; bottom: string } {
  const xm = x0 + dir * PINCH * 0.55;
  const xr = x0 + dir * PINCH;
  const top = `M ${x0} ${RAIL_Y - RAIL_HALF} C ${xm} ${RAIL_Y - RAIL_HALF}, ${xm} ${RAIL_Y - BUBBLE_HALF}, ${xr} ${RAIL_Y - BUBBLE_HALF}`;
  const bottom = `M ${x0} ${RAIL_Y + RAIL_HALF} C ${xm} ${RAIL_Y + RAIL_HALF}, ${xm} ${RAIL_Y + BUBBLE_HALF}, ${xr} ${RAIL_Y + BUBBLE_HALF}`;
  const fill = `${top} L ${xr} ${RAIL_Y + BUBBLE_HALF} C ${xm} ${RAIL_Y + BUBBLE_HALF}, ${xm} ${RAIL_Y + RAIL_HALF}, ${x0} ${RAIL_Y + RAIL_HALF} Z`;
  return { fill, top, bottom };
}

export function MilestoneTrack({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: MilestoneTrackProps) {
  const [selectedId, select] = useSelection(selProp, defaultSelectedId, onSelect);
  const layout = useMemo(() => buildLayout(data), [data]);
  const { stations, bubbles, groups, segments, dividers, whiskers, width } = layout;

  const hasContent = stations.length > 0;
  const hasHeader = Boolean(
    data.brand || data.code || data.title || data.caption || data.meta || layout.totalText,
  );
  const meta = data.meta ?? layout.totalText;

  const selectedStation = stations.find((s) => s.key === selectedId);
  const selectedBubble = bubbles.find((b) => b.key === selectedId);
  const bubbleByGap = new Map(bubbles.map((b) => [b.gap, b]));

  return (
    <div className={cx('tcl-milestone-track', className)}>
      {hasHeader && (
        <header className="tcl-milestone-track__header">
          {data.code && (
            <span className="tcl-milestone-track__code" aria-hidden="true">
              {data.code}
            </span>
          )}
          <div className="tcl-milestone-track__heading">
            {data.brand && <p className="tcl-milestone-track__brand">{data.brand}</p>}
            {data.title && <p className="tcl-milestone-track__title">{data.title}</p>}
            {data.caption && <p className="tcl-milestone-track__caption">{data.caption}</p>}
          </div>
          {meta && <span className="tcl-milestone-track__meta">{meta}</span>}
        </header>
      )}

      {hasContent ? (
        <div className="tcl-milestone-track__scroller">
          <div
            className="tcl-milestone-track__track"
            style={vars({ width: `${width}px`, height: `${TRACK_H}px` })}
          >
            {/* rail, tapers, whiskers, band chrome — one decorative coordinate space */}
            <svg
              className="tcl-milestone-track__canvas"
              width={width}
              height={TRACK_H}
              viewBox={`0 0 ${width} ${TRACK_H}`}
              aria-hidden="true"
              focusable="false"
            >
              {dividers.map((x) => (
                <line
                  key={`d${x}`}
                  className="tcl-milestone-track__divider"
                  x1={x}
                  y1={12}
                  x2={x}
                  y2={TRACK_H - 20}
                />
              ))}
              {groups.map((g) => (
                <g key={g.key} className="tcl-milestone-track__band">
                  <line x1={g.x0} y1={GROUP_LINE_Y} x2={g.x1} y2={GROUP_LINE_Y} />
                  <line x1={g.x0} y1={GROUP_LINE_Y} x2={g.x0} y2={GROUP_LINE_Y + 6} />
                  <line x1={g.x1} y1={GROUP_LINE_Y} x2={g.x1} y2={GROUP_LINE_Y + 6} />
                </g>
              ))}
              {segments.map((s) => (
                <line
                  key={`s${s.x1}`}
                  className={cx('tcl-milestone-track__segment', s.pending && 'is-pending')}
                  x1={s.x1}
                  y1={RAIL_Y}
                  x2={s.x2}
                  y2={RAIL_Y}
                />
              ))}
              <path
                className={cx('tcl-milestone-track__arrow', layout.arrowPending && 'is-pending')}
                d={`M ${layout.arrowX} ${RAIL_Y - 5} L ${layout.arrowX + 7} ${RAIL_Y} L ${layout.arrowX} ${RAIL_Y + 5}`}
              />
              {whiskers.map((w) => (
                <g
                  key={`w${w.key}`}
                  className="tcl-milestone-track__whisker"
                  style={vars({ '--bubble-tone': toneVar(w.tone) })}
                >
                  <line x1={w.x1} y1={RAIL_Y + 3} x2={w.x1} y2={WHISKER_Y} />
                  <line
                    className="tcl-milestone-track__whisker-run"
                    x1={w.x1}
                    y1={WHISKER_Y}
                    x2={w.x2}
                    y2={WHISKER_Y}
                  />
                  <line x1={w.x2} y1={RAIL_Y + 3} x2={w.x2} y2={WHISKER_Y} />
                </g>
              ))}
              {bubbles.map((b) => {
                const left = taperPath(b.xL, 1);
                const right = taperPath(b.xR, -1);
                return (
                  <g
                    key={b.key}
                    className={cx(
                      'tcl-milestone-track__tapers',
                      b.key === selectedId && 'is-selected',
                    )}
                    style={vars({ '--bubble-tone': toneVar(b.tone) })}
                  >
                    <path className="tcl-milestone-track__taper-fill" d={left.fill} />
                    <path className="tcl-milestone-track__taper-fill" d={right.fill} />
                    <path className="tcl-milestone-track__taper-stroke" d={left.top} />
                    <path className="tcl-milestone-track__taper-stroke" d={left.bottom} />
                    <path className="tcl-milestone-track__taper-stroke" d={right.top} />
                    <path className="tcl-milestone-track__taper-stroke" d={right.bottom} />
                  </g>
                );
              })}
            </svg>

            {/* group labels — decorative chrome; the label is folded into member
                stations' accessible names instead */}
            <div className="tcl-milestone-track__chrome" aria-hidden="true">
              {groups.map((g) => (
                <span
                  key={g.key}
                  className="tcl-milestone-track__band-label"
                  style={vars({ left: `${(g.x0 + g.x1) / 2}px`, top: `${GROUP_LINE_Y}px` })}
                >
                  {g.group.glyph && <Glyph name={g.group.glyph} />}
                  {g.group.label}
                </span>
              ))}
            </div>

            <div
              className="tcl-milestone-track__stops"
              role="group"
              aria-label={data.title ?? 'Milestone track'}
            >
              {stations.map((p, i) => {
                const bubble = bubbleByGap.get(i);
                const isSelected = p.key === selectedId;
                const name = [
                  p.station.label,
                  p.station.sub,
                  STATUS_WORD[p.status],
                  p.station.badge,
                  p.groupLabel,
                ]
                  .filter(Boolean)
                  .join(' — ');
                return (
                  <Fragment key={p.key}>
                    <button
                      type="button"
                      className={cx('tcl-milestone-track__station', isSelected && 'is-selected')}
                      data-status={p.status}
                      style={vars({
                        left: `${p.x - STATION_HALF}px`,
                        top: `${STATION_TOP}px`,
                        width: `${STATION_HALF * 2}px`,
                        height: `${STATION_H}px`,
                      })}
                      aria-pressed={isSelected}
                      aria-label={name}
                      onClick={() => select(p.key)}
                    >
                      <svg
                        className="tcl-milestone-track__node-svg"
                        width={STATION_HALF * 2}
                        height={32}
                        viewBox={`0 0 ${STATION_HALF * 2} 32`}
                        aria-hidden="true"
                        focusable="false"
                      >
                        {p.status === 'active' && (
                          <circle
                            className="tcl-milestone-track__halo"
                            cx={STATION_HALF}
                            cy={16}
                            r={12}
                          />
                        )}
                        <circle
                          className="tcl-milestone-track__node"
                          cx={STATION_HALF}
                          cy={16}
                          r={NODE_R}
                        />
                      </svg>
                      <span className="tcl-milestone-track__station-label">{p.station.label}</span>
                      {p.station.sub && (
                        <span className="tcl-milestone-track__station-sub">{p.station.sub}</span>
                      )}
                      {p.station.badge && (
                        <span className="tcl-milestone-track__station-badge">{p.station.badge}</span>
                      )}
                    </button>

                    {bubble && (
                      <button
                        type="button"
                        className={cx(
                          'tcl-milestone-track__bubble',
                          bubble.key === selectedId && 'is-selected',
                        )}
                        style={vars({
                          '--bubble-tone': toneVar(bubble.tone),
                          '--bubble-ink': toneInk(bubble.tone),
                          left: `${bubble.xL + PINCH}px`,
                          top: `${RAIL_Y - BUBBLE_HALF}px`,
                          width: `${bubble.xR - bubble.xL - 2 * PINCH}px`,
                          height: `${BUBBLE_HALF * 2}px`,
                        })}
                        aria-pressed={bubble.key === selectedId}
                        aria-label={`${bubble.label}: ${bubble.valueText}${bubble.metric.count ? `, ${bubble.metric.count}` : ''}`}
                        onClick={() => select(bubble.key)}
                      >
                        <svg
                          className="tcl-milestone-track__bubble-svg"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <rect
                            className="tcl-milestone-track__bubble-fill"
                            x={0}
                            y={0}
                            width="100%"
                            height="100%"
                          />
                          <line
                            className="tcl-milestone-track__bubble-edge"
                            x1={0}
                            y1={0}
                            x2="100%"
                            y2={0}
                          />
                          <line
                            className="tcl-milestone-track__bubble-edge"
                            x1={0}
                            y1={BUBBLE_HALF * 2}
                            x2="100%"
                            y2={BUBBLE_HALF * 2}
                          />
                        </svg>
                        <span className="tcl-milestone-track__bubble-value">{bubble.valueText}</span>
                        <span className="tcl-milestone-track__bubble-label">{bubble.label}</span>
                        {bubble.metric.count && (
                          <span className="tcl-milestone-track__bubble-count">
                            {bubble.metric.count}
                          </span>
                        )}
                        {bubble.share !== undefined && (
                          <span className="tcl-milestone-track__bubble-meter" aria-hidden="true">
                            <span
                              className="tcl-milestone-track__bubble-meter-fill"
                              style={vars({ width: `${Math.round(bubble.share * 100)}%` })}
                            />
                          </span>
                        )}
                      </button>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="tcl-milestone-track__empty">No milestones to chart</p>
      )}

      <div className="tcl-milestone-track__inspector" aria-live="polite">
        {selectedStation ? (
          <>
            <p className="tcl-milestone-track__inspector-title">
              {selectedStation.station.label}
              <span className="tcl-milestone-track__inspector-dim">
                {' · '}
                {STATUS_WORD[selectedStation.status]}
                {selectedStation.groupLabel ? ` · ${selectedStation.groupLabel}` : ''}
              </span>
            </p>
            {(selectedStation.station.sub || selectedStation.station.badge) && (
              <p className="tcl-milestone-track__inspector-sub">
                {[selectedStation.station.sub, selectedStation.station.badge]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {selectedStation.station.note && (
              <p className="tcl-milestone-track__inspector-note">{selectedStation.station.note}</p>
            )}
          </>
        ) : selectedBubble ? (
          <>
            <p className="tcl-milestone-track__inspector-title">
              <span
                className="tcl-milestone-track__inspector-value"
                style={vars({ '--bubble-ink': toneInk(selectedBubble.tone) })}
              >
                {selectedBubble.valueText}
              </span>
              {' · '}
              {selectedBubble.label}
            </p>
            {(selectedBubble.metric.count || selectedBubble.share !== undefined) && (
              <p className="tcl-milestone-track__inspector-sub">
                {[
                  selectedBubble.metric.count,
                  selectedBubble.share !== undefined
                    ? `${pctText(selectedBubble.share)}% of measured lead time`
                    : undefined,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {selectedBubble.metric.note && (
              <p className="tcl-milestone-track__inspector-note">{selectedBubble.metric.note}</p>
            )}
          </>
        ) : (
          <p className="tcl-milestone-track__inspector-hint">
            Select a milestone or interval to inspect it.
          </p>
        )}
      </div>
    </div>
  );
}
