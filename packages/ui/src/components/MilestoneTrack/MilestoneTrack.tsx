import { Fragment, useMemo } from 'react';
import { Glyph } from '@trembus/icons';
import { cx } from '../../utils/cx';
import { isFillBarTone, toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import { useSelection } from '../../internal/useSelection';
import './MilestoneTrack.css';

export type MilestoneTrackTone = FillBarTone;
export type MilestoneStatus = 'done' | 'active' | 'pending';
/** Row layout — `'serpentine'` wraps the ONE pipeline into boustrophedon rows, `'wrap'` into
 *  carriage-return rows that all read left→right, joined by one return connector. */
export type MilestoneTrackLayout = 'rail' | 'serpentine' | 'wrap';
/** Capsule sizing — `'scaled'` maps an interval's share of the measured total to its height. */
export type MilestoneBubbleSizing = 'uniform' | 'scaled';
/** Capsule text — `'outside'` keeps only the value in the pillow (label above, count/meter below). */
export type MilestoneLabelPlacement = 'inside' | 'outside';

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
  /** Manual magnitude stand-in for `bubbleSizing='scaled'` when the cross-metric share is
   *  uncomputable (mixed units, or a single metric). Any positive finite number — only ratios
   *  matter (normalized against the largest weight on the track). Ignored whenever shares ARE
   *  computable; invalid values fall back to the uniform capsule height. */
  weight?: number;
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
  /** Source-system bands above the rail; boundaries between bands draw handoff dividers.
   *  In `layout='serpentine'`/`'wrap'` each group becomes one row instead. */
  groups?: MilestoneGroup[];
}

export interface MilestoneTrackProps {
  /** The authored track contract (stations + metrics + groups) to lay out. */
  data: MilestoneTrackContract;
  /** Row layout (default `'rail'` — one line). Both wrapping modes cut rows from `data.groups`
   *  (and/or `rowLength`), keeping ONE pipeline: `'serpentine'` alternates row direction and
   *  joins rows with U-turns; `'wrap'` keeps every row left→right and returns to the left margin
   *  along a single carriage-return connector — the mode to pick when the track must READ like
   *  text. With no groups and no `rowLength` the track stays a single row. */
  layout?: MilestoneTrackLayout;
  /** Max stations per row when wrapping (`'serpentine'`/`'wrap'`). Applied WITHIN each group run,
   *  so groups still start their own row; the only way to wrap an ungrouped track. Values below 1
   *  or non-integers are ignored. */
  rowLength?: number;
  /** Capsule sizing — `'scaled'` grows each bubble's height with its share of the measured
   *  total (the worst bottleneck reaches the max height), falling back to per-metric `weight`
   *  ratios when shares are uncomputable, then to the uniform height (default `'uniform'`). */
  bubbleSizing?: MilestoneBubbleSizing;
  /** Capsule text — `'outside'` leaves only the measured value inside the pillow and lifts the
   *  interval label above it, dropping the sample count and share meter below (the value-stream
   *  reading, and the one that keeps small capsules legible). Default `'inside'`. */
  labelPlacement?: MilestoneLabelPlacement;
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
// bubbles and nodes always sit on the rail. Vertical values are per ROW — a
// row's rail y derives from its tallest bubble, and the single-row rail layout
// is literally the one-row case of the same formulas.
const PAD_X = 24; // track inset before the lead-in rail
const STATION_HALF = 56; // station button half-width (labels wrap inside it)
const GAP_PLAIN = 126; // node pitch without a bubble
const GAP_METRIC = 260; // node pitch with a bubble
const ATTACH = 18; // bare rail between a node (or turn) and the start of a swell
const PINCH = 40; // horizontal run of each swell taper
const NODE_R = 7; // station node radius
const BUBBLE_HALF = 46; // uniform capsule half-height (and the scaled-mode fallback)
const MIN_HALF = 30; // scaled-mode floor — keeps value + one label line legible
const MAX_HALF = 64; // scaled-mode ceiling — the worst bottleneck's half-height
const COMPACT_HALF = 40; // below this half, bubbles hide count + meter (data-size="compact")
const GROUP_H = 44; // group band / row header zone above each rail
const LABEL_OUT_HEAD = 24; // extra headroom so an outside label clears the band chrome
const RAIL_HALF = 1.5; // half the rail stroke — tapers grow from this thickness
const STATION_H = 104; // node zone + up to two label lines + badge
const ROW_BELOW_RAIL = STATION_H - 16 + 8; // 96 — rail y to row bottom (station zone)
const LEAD_OUT = 26; // rail run past the last node, before the arrowhead
const GROUP_LINE_Y = 22; // group band hairline / row header line (below a row's top)
const TURN_R = 24; // serpentine U-turn corner radius
const TURN_MARGIN = 12; // U-turn vertical run inset from the track edge
const ROW_TAIL = 44; // per-row end allowance past the last station
const RETURN_LANE = 34; // wrap: vertical band between rows that hosts the return run
const RETURN_CUE_PITCH = 260; // wrap: spacing between the return run's left-chevrons
// Start inset of a row whose incoming inter-row gap hosts a bubble: turn corner,
// attach run, full capsule, attach run — the handoff-wait bubble lives on the lead-in.
const CROSS_START = TURN_MARGIN + TURN_R + ATTACH + (GAP_METRIC - 2 * ATTACH) + ATTACH; // 296

/** `v * 100` overflows to Infinity above ~1.8e306 — print the raw value rather
 *  than the word "Infinity" in a readout and an accessible name. */
const fmt = (v: number, unit: string): string => {
  const rounded = Math.round(v * 100) / 100;
  return `${Number.isFinite(rounded) ? rounded : v} ${unit}`;
};

/** A rounded share percentage that never claims "0%" for a real nonzero measurement. */
const pctText = (share: number): string => {
  const pct = Math.round(share * 100);
  return pct === 0 && share > 0 ? '<1' : String(pct);
};

interface PlacedRow {
  index: number;
  start: number; // first station index (inclusive)
  end: number; // last station index (inclusive)
  dir: 1 | -1; // flow direction — 'wrap' rows are all 1; serpentine alternates
  group?: { key: string; group: MilestoneGroup };
  top: number;
  railY: number;
  stationTop: number;
  height: number;
}

interface PlacedStation {
  key: string;
  station: MilestoneStation;
  x: number;
  top: number;
  status: MilestoneStatus;
  groupLabel?: string;
}

interface PlacedBubble {
  key: string;
  metric: MilestoneMetric;
  gap: number; // bubble occupies the gap between stations `gap` and `gap+1`
  xL: number; // rail attach points (taper start/end)
  xR: number;
  railY: number; // home row's rail (the `gap+1` row for a cross-row handoff bubble)
  half: number; // capsule half-height (BUBBLE_HALF unless bubbleSizing='scaled')
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
  key: string;
  x1: number;
  x2: number;
  y: number;
  pending: boolean;
}

interface Whisker {
  key: string;
  tone: MilestoneTrackTone;
  caps: Array<{ x: number; railY: number }>; // verticals at the true span ends
  runs: Array<{ x1: number; x2: number; y: number }>; // one dotted run per covered row
}

interface Connector {
  key: string;
  d: string;
  pending: boolean;
  /** Direction chevrons along the turn — one on a U-turn's vertical run, several
   *  down a wrap return run (a full-width line needs more than one to read). */
  cues: FlowCue[];
}

interface RowHeader {
  key: string;
  x: number;
  y: number;
  end: boolean; // anchored to the right edge (right→left rows)
  glyph?: string;
  label: string;
}

interface FlowCue {
  key: string;
  x: number;
  y: number;
  pending: boolean;
  /** Chevron heading: 1 → right, -1 → left, 0 → down. */
  dir: 1 | -1 | 0;
}

interface Layout {
  rows: PlacedRow[];
  stations: PlacedStation[];
  bubbles: PlacedBubble[];
  groups: PlacedGroup[];
  segments: Segment[];
  dividers: number[];
  whiskers: Whisker[];
  connectors: Connector[];
  rowHeaders: RowHeader[];
  flowCues: FlowCue[];
  arrow?: { x: number; y: number; dir: 1 | -1; pending: boolean };
  width: number;
  height: number;
  totalText?: string; // e.g. "28.9 d measured" — only when metric units are uniform
}

function buildLayout(
  data: MilestoneTrackContract,
  layout: MilestoneTrackLayout,
  bubbleSizing: MilestoneBubbleSizing,
  labelPlacement: MilestoneLabelPlacement,
  rowLength: number | undefined,
): Layout {
  const rawStations = data.stations ?? [];
  const trackUnit = data.unit ?? 'd';
  const wraps = layout === 'serpentine' || layout === 'wrap';
  const chunk =
    typeof rowLength === 'number' && Number.isInteger(rowLength) && rowLength >= 1 && wraps
      ? rowLength
      : undefined;

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
  // strip). A metric whose span is fully occupied is omitted. In serpentine the
  // inter-row gap is an ordinary gap — its bubble becomes the handoff-wait
  // capsule on the next row's lead-in.
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

  // ── share of measured total: only meaningful when every placed metric speaks
  // ONE unit (mixed units would sum apples and oranges). Metrics may uniformly
  // override the track unit — the total then reports in THEIR unit.
  const metricUnits = new Set(placedMetrics.map((p) => p.metric.unit ?? trackUnit));
  const uniform = metricUnits.size <= 1;
  const sharedUnit = metricUnits.size === 1 ? [...metricUnits][0] : trackUnit;
  const total = placedMetrics.reduce((sum, p) => sum + p.metric.value, 0);
  const showShare = uniform && placedMetrics.length >= 2 && total > 0;

  // Pre-geometry bubble records — keys uniquified here, BEFORE groups, so the
  // shared uniquify keeps its station → metric → group call order.
  const modelBubbles = placedMetrics.map((p) => {
    const unit = p.metric.unit ?? trackUnit;
    return {
      key: p.metric.id !== undefined ? uniquify(p.metric.id) : uniquify(`m${p.i}`, true),
      metric: p.metric,
      gap: p.gap,
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
  const modelGroups = (data.groups ?? []).flatMap((group, i) => {
    const a = resolve(group.from);
    const b = resolve(group.to);
    if (a === undefined || b === undefined) return [];
    return [
      {
        // Groups build after stations + bubbles, so the shared uniquify can't
        // disturb selectable keys; duplicate group ids must not collide either.
        key: group.id !== undefined ? uniquify(group.id) : uniquify(`g${i}`, true),
        group,
        fromIdx: Math.min(a, b),
        toIdx: Math.max(a, b),
      },
    ];
  });
  modelGroups.sort((a, b) => a.fromIdx - b.fromIdx || a.toIdx - b.toIdx);

  // ── rows: rail = one row; serpentine partitions stations by a greedy sweep of
  // the sorted groups. Overlapping/interleaved groups are skipped as row-makers
  // (first-sorted wins — they still feed accessible names); stations outside any
  // accepted group form unlabeled orphan rows. No groups → one row (no wrap).
  const rows: PlacedRow[] = [];
  if (rawStations.length > 0) {
    const runs: Array<{ start: number; end: number; group?: (typeof modelGroups)[number] }> = [];
    if (wraps) {
      const accepted: typeof modelGroups = [];
      let cursor = -1;
      for (const g of modelGroups) {
        if (g.fromIdx > cursor) {
          accepted.push(g);
          cursor = g.toIdx;
        }
      }
      let idx = 0;
      for (const g of accepted) {
        if (idx < g.fromIdx) runs.push({ start: idx, end: g.fromIdx - 1 });
        runs.push({ start: g.fromIdx, end: g.toIdx, group: g });
        idx = g.toIdx + 1;
      }
      if (idx <= rawStations.length - 1) runs.push({ start: idx, end: rawStations.length - 1 });
    } else {
      runs.push({ start: 0, end: rawStations.length - 1 });
    }
    // `rowLength` subdivides each run — a group still starts its own row, and only
    // the run's FIRST chunk wears the group header (a repeated chip reads as a
    // second group). It is the only way to wrap a track that has no groups.
    const chunked = chunk
      ? runs.flatMap((run) => {
          const out: typeof runs = [];
          for (let s2 = run.start; s2 <= run.end; s2 += chunk) {
            out.push({
              start: s2,
              end: Math.min(s2 + chunk - 1, run.end),
              group: s2 === run.start ? run.group : undefined,
            });
          }
          return out;
        })
      : runs;
    chunked.forEach((run, index) => {
      rows.push({
        index,
        start: run.start,
        end: run.end,
        dir: layout === 'wrap' ? 1 : index % 2 === 0 ? 1 : -1,
        group: run.group,
        top: 0,
        railY: 0,
        stationTop: 0,
        height: 0,
      });
    });
  }
  const rowOf: number[] = [];
  rows.forEach((r) => {
    for (let i = r.start; i <= r.end; i++) rowOf[i] = r.index;
  });

  // ── capsule halves: shares when computable (all-or-nothing across the track),
  // else authored weights, else the uniform half. Normalized to the max basis so
  // the worst bottleneck always reaches MAX_HALF.
  const halves = new Map<string, number>();
  if (bubbleSizing === 'scaled' && modelBubbles.length > 0) {
    const sharesOn = modelBubbles.every((b) => b.share !== undefined);
    const basisOf = (b: (typeof modelBubbles)[number]): number | undefined => {
      if (sharesOn) return b.share;
      const w = b.metric.weight;
      return typeof w === 'number' && Number.isFinite(w) && w > 0 ? w : undefined;
    };
    const defined = modelBubbles.map(basisOf).filter((v): v is number => v !== undefined && v > 0);
    const maxBasis = defined.length > 0 ? Math.max(...defined) : 0;
    modelBubbles.forEach((b) => {
      const basis = basisOf(b);
      halves.set(
        b.key,
        basis !== undefined && maxBasis > 0
          ? Math.round(MIN_HALF + (basis / maxBasis) * (MAX_HALF - MIN_HALF))
          : BUBBLE_HALF,
      );
    });
  } else {
    modelBubbles.forEach((b) => halves.set(b.key, BUBBLE_HALF));
  }

  // ── vertical anatomy: a row's rail sits below its header zone by its tallest
  // bubble, so capsules never invade the header; the row bottom leaves the full
  // station zone. Outside labels ride above their capsule, so the whole rail
  // drops by one label line to clear the band chrome. One uniform inside-label
  // row reduces to the 0.11.0 constants (railY 100, stationTop 84, height 196).
  const headroom = labelPlacement === 'outside' ? LABEL_OUT_HEAD : 0;
  const maxHalfByRow = rows.map(() => BUBBLE_HALF);
  modelBubbles.forEach((b) => {
    const r = rowOf[b.gap + 1];
    maxHalfByRow[r] = Math.max(maxHalfByRow[r], halves.get(b.key) ?? BUBBLE_HALF);
  });
  let nextTop = 0;
  rows.forEach((r) => {
    r.top = nextTop;
    r.railY = r.top + GROUP_H + 10 + headroom + maxHalfByRow[r.index];
    r.stationTop = r.railY - 16;
    r.height = r.railY - r.top + ROW_BELOW_RAIL;
    // 'wrap' reserves a band under each row (bar the last) for the return run.
    nextTop += r.height + (layout === 'wrap' && r.index < rows.length - 1 ? RETURN_LANE : 0);
  });
  const height = rows.length > 0 ? nextTop : GROUP_H + 10 + BUBBLE_HALF + ROW_BELOW_RAIL;

  // ── x positions: cumulative pitch per row, wide where a bubble lives; a row
  // whose incoming inter-row gap hosts a bubble starts at CROSS_START instead.
  // Right→left rows mirror their local coordinates against the track width.
  const localXs: number[] = [];
  rows.forEach((r) => {
    const incoming = r.index > 0 && r.start > 0 && gapOwner[r.start - 1] !== undefined;
    for (let i = r.start; i <= r.end; i++) {
      localXs[i] =
        i === r.start
          ? incoming
            ? CROSS_START
            : PAD_X + STATION_HALF
          : localXs[i - 1] + (gapOwner[i - 1] !== undefined ? GAP_METRIC : GAP_PLAIN);
    }
  });
  const width =
    rows.length > 0
      ? Math.max(...rows.map((r) => localXs[r.end] + STATION_HALF + ROW_TAIL))
      : PAD_X * 2;
  const xs: number[] = [];
  rows.forEach((r) => {
    for (let i = r.start; i <= r.end; i++) xs[i] = r.dir === 1 ? localXs[i] : width - localXs[i];
  });

  const bubbles: PlacedBubble[] = modelBubbles.map((b) => {
    const homeRow = rows[rowOf[b.gap + 1]];
    const half = halves.get(b.key) ?? BUBBLE_HALF;
    let xL: number;
    let xR: number;
    if (rowOf[b.gap] === rowOf[b.gap + 1]) {
      xL = Math.min(xs[b.gap], xs[b.gap + 1]) + ATTACH;
      xR = Math.max(xs[b.gap], xs[b.gap + 1]) - ATTACH;
    } else {
      // Handoff-wait capsule on the lead-in: anchored between the turn corner
      // exit and the row's first station (which starts at CROSS_START).
      const nearTurn = TURN_MARGIN + TURN_R + ATTACH;
      const nearStation = CROSS_START - ATTACH;
      const a = homeRow.dir === 1 ? nearTurn : width - nearTurn;
      const b2 = homeRow.dir === 1 ? nearStation : width - nearStation;
      xL = Math.min(a, b2);
      xR = Math.max(a, b2);
    }
    return { ...b, xL, xR, railY: homeRow.railY, half };
  });

  const groups: PlacedGroup[] = modelGroups.map((g) => ({
    ...g,
    x0: Math.min(xs[g.fromIdx], xs[g.toIdx]) - 40,
    x1: Math.max(xs[g.fromIdx], xs[g.toIdx]) + 40,
  }));

  const stations: PlacedStation[] = keyed.map(({ station, key }, i) => ({
    key,
    station,
    x: xs[i],
    top: rows[rowOf[i]].stationTop,
    status: statusOf(station),
    groupLabel: modelGroups.find((g) => g.fromIdx <= i && i <= g.toIdx)?.group.label,
  }));

  // ── handoff dividers between consecutive bands (rail only — the row break IS
  // the handoff in serpentine) — skipped where a bubble already separates the
  // systems (no line through a capsule).
  const dividers: number[] = [];
  if (layout === 'rail') {
    for (let i = 1; i < groups.length; i++) {
      const prev = groups[i - 1];
      const next = groups[i];
      if (prev.toIdx >= next.fromIdx) continue;
      const x = (xs[prev.toIdx] + xs[next.fromIdx]) / 2;
      const covered = bubbles.some((b) => x >= b.xL - 4 && x <= b.xR + 4);
      if (!covered) dividers.push(x);
    }
  }

  const pendingAt = (i: number): boolean => stations[i]?.status === 'pending';
  const segments: Segment[] = [];
  rows.forEach((r) => {
    if (r.index === 0) {
      segments.push({
        key: 's0-lead',
        x1: 6,
        x2: xs[r.start],
        y: r.railY,
        pending: pendingAt(r.start),
      });
    }
    for (let i = r.start; i < r.end; i++) {
      segments.push({
        key: `s${r.index}-${i}`,
        x1: xs[i],
        x2: xs[i + 1],
        y: r.railY,
        pending: pendingAt(i) || pendingAt(i + 1),
      });
    }
  });

  let arrow: Layout['arrow'];
  if (rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    const arrowPending = pendingAt(lastRow.end);
    const ax = xs[lastRow.end] + lastRow.dir * LEAD_OUT;
    segments.push({
      key: `s${lastRow.index}-out`,
      x1: xs[lastRow.end],
      x2: ax,
      y: lastRow.railY,
      pending: arrowPending,
    });
    arrow = { x: ax, y: lastRow.railY, dir: lastRow.dir, pending: arrowPending };
  }

  // ── row-break connectors: rail thickness carried across the break, dashed when
  // either boundary station is pending (the segment rule). 'serpentine' turns a
  // U at the track edge; 'wrap' performs a CARRIAGE RETURN — out to the right
  // margin, down into the return band, one straight run all the way back to the
  // left margin, then down into the next row's lead-in, so every row reads L→R.
  const connectors: Connector[] = [];
  for (let r = 0; r + 1 < rows.length; r++) {
    const row = rows[r];
    const next = rows[r + 1];
    const pending = pendingAt(row.end) || pendingAt(next.start);
    const y1 = row.railY;
    const y2 = next.railY;
    let d: string;
    let cues: FlowCue[];
    if (layout === 'wrap') {
      const rx = width - TURN_MARGIN;
      const lx = TURN_MARGIN;
      const ry = row.top + row.height + RETURN_LANE / 2;
      const R = TURN_R;
      d =
        `M ${xs[row.end]} ${y1} H ${rx - R} A ${R} ${R} 0 0 1 ${rx} ${y1 + R} V ${ry - R}` +
        ` A ${R} ${R} 0 0 1 ${rx - R} ${ry} H ${lx + R} A ${R} ${R} 0 0 0 ${lx} ${ry + R}` +
        ` V ${y2 - R} A ${R} ${R} 0 0 0 ${lx + R} ${y2} H ${xs[next.start]}`;
      // A full-width return needs more than one chevron to read as a return.
      const runLen = Math.max(0, rx - R - (lx + R));
      const count = Math.max(1, Math.round(runLen / RETURN_CUE_PITCH));
      cues = Array.from({ length: count }, (_, k) => ({
        key: `c${r}-cue${k}`,
        x: lx + R + (runLen * (k + 0.5)) / count,
        y: ry,
        pending,
        dir: -1 as const,
      }));
    } else if (row.dir === 1) {
      const tx = width - TURN_MARGIN;
      d = `M ${xs[row.end]} ${y1} H ${tx - TURN_R} A ${TURN_R} ${TURN_R} 0 0 1 ${tx} ${y1 + TURN_R} V ${y2 - TURN_R} A ${TURN_R} ${TURN_R} 0 0 1 ${tx - TURN_R} ${y2} H ${xs[next.start]}`;
      cues = [{ key: `c${r}-cue0`, x: tx, y: (y1 + y2) / 2, pending, dir: 0 }];
    } else {
      const tm = TURN_MARGIN;
      d = `M ${xs[row.end]} ${y1} H ${tm + TURN_R} A ${TURN_R} ${TURN_R} 0 0 0 ${tm} ${y1 + TURN_R} V ${y2 - TURN_R} A ${TURN_R} ${TURN_R} 0 0 0 ${tm + TURN_R} ${y2} H ${xs[next.start]}`;
      cues = [{ key: `c${r}-cue0`, x: tm, y: (y1 + y2) / 2, pending, dir: 0 }];
    }
    connectors.push({ key: `c${r}`, d, pending, cues });
  }

  // ── direction cues on right→left rows: one left-chevron per bubble-less
  // segment, so a mirrored row can't be misread as flowing rightward.
  const flowCues: FlowCue[] = [];
  rows.forEach((r) => {
    if (r.dir !== -1) return;
    for (let i = r.start; i < r.end; i++) {
      if (gapOwner[i] !== undefined) continue;
      flowCues.push({
        key: `fc${r.index}-${i}`,
        x: (xs[i] + xs[i + 1]) / 2,
        y: r.railY,
        pending: pendingAt(i) || pendingAt(i + 1),
        dir: -1,
      });
    }
  });

  const rowHeaders: RowHeader[] = wraps
    ? rows.flatMap((r) =>
        r.group
          ? [
              {
                key: `h-${r.group.key}`,
                x: r.dir === 1 ? PAD_X : width - PAD_X,
                y: r.top + GROUP_LINE_Y,
                end: r.dir === -1,
                glyph: r.group.group.glyph,
                label: r.group.group.label,
              },
            ]
          : [],
      )
    : [];

  // ── whiskers: caps at the true span ends; one dotted run per row the span
  // covers with 2+ stations — the run never traverses a turn.
  const whiskers: Whisker[] = bubbles
    .filter((b) => b.spanTo - b.spanFrom > 1)
    .map((b) => {
      const caps = [b.spanFrom, b.spanTo].map((i) => ({ x: xs[i], railY: rows[rowOf[i]].railY }));
      const runs: Whisker['runs'] = [];
      for (let ri = rowOf[b.spanFrom]; ri <= rowOf[b.spanTo]; ri++) {
        const r = rows[ri];
        const a = Math.max(r.start, b.spanFrom);
        const z = Math.min(r.end, b.spanTo);
        if (z > a) {
          runs.push({
            x1: Math.min(xs[a], xs[z]),
            x2: Math.max(xs[a], xs[z]),
            y: r.railY + 10,
          });
        }
      }
      return { key: b.key, tone: b.tone, caps, runs };
    });

  return {
    rows,
    stations,
    bubbles,
    groups,
    segments,
    dividers,
    whiskers,
    connectors,
    rowHeaders,
    flowCues,
    arrow,
    width,
    height,
    totalText:
      uniform && placedMetrics.length > 0 ? `${fmt(total, sharedUnit)} measured` : undefined,
  };
}

/** A direction chevron: `dir` 0 points down (U-turns), ±1 along the flow. */
const chevron = (c: FlowCue): string =>
  c.dir === 0
    ? `M ${c.x - 5} ${c.y - 3.5} L ${c.x} ${c.y + 3.5} L ${c.x + 5} ${c.y - 3.5}`
    : `M ${c.x - 3.5 * c.dir} ${c.y - 5} L ${c.x + 3.5 * c.dir} ${c.y} L ${c.x - 3.5 * c.dir} ${c.y + 5}`;

/** The swell taper: rail thickness at `x0`, full bubble height `PINCH` later. */
function taperPath(
  x0: number,
  dir: 1 | -1,
  railY: number,
  half: number,
): { fill: string; top: string; bottom: string } {
  const xm = x0 + dir * PINCH * 0.55;
  const xr = x0 + dir * PINCH;
  const top = `M ${x0} ${railY - RAIL_HALF} C ${xm} ${railY - RAIL_HALF}, ${xm} ${railY - half}, ${xr} ${railY - half}`;
  const bottom = `M ${x0} ${railY + RAIL_HALF} C ${xm} ${railY + RAIL_HALF}, ${xm} ${railY + half}, ${xr} ${railY + half}`;
  const fill = `${top} L ${xr} ${railY + half} C ${xm} ${railY + half}, ${xm} ${railY + RAIL_HALF}, ${x0} ${railY + RAIL_HALF} Z`;
  return { fill, top, bottom };
}

export function MilestoneTrack({
  data,
  layout = 'rail',
  bubbleSizing = 'uniform',
  labelPlacement = 'inside',
  rowLength,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: MilestoneTrackProps) {
  const [selectedId, select] = useSelection(selProp, defaultSelectedId, onSelect);
  const geometry = useMemo(
    () => buildLayout(data, layout, bubbleSizing, labelPlacement, rowLength),
    [data, layout, bubbleSizing, labelPlacement, rowLength],
  );
  const { stations, bubbles, groups, segments, dividers, whiskers, width, height } = geometry;

  const hasContent = stations.length > 0;
  const hasHeader = Boolean(
    data.brand || data.code || data.title || data.caption || data.meta || geometry.totalText,
  );
  const meta = data.meta ?? geometry.totalText;

  const selectedStation = stations.find((s) => s.key === selectedId);
  const selectedBubble = bubbles.find((b) => b.key === selectedId);
  const bubbleByGap = new Map(bubbles.map((b) => [b.gap, b]));

  return (
    <div
      className={cx('tcl-milestone-track', className)}
      data-layout={layout}
      data-labels={labelPlacement}
    >
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
            style={vars({ width: `${width}px`, height: `${height}px` })}
          >
            {/* rail, turns, tapers, whiskers, band chrome — one decorative coordinate space */}
            <svg
              className="tcl-milestone-track__canvas"
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
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
                  y2={height - 20}
                />
              ))}
              {layout === 'rail' &&
                groups.map((g) => (
                  <g key={g.key} className="tcl-milestone-track__band">
                    <line x1={g.x0} y1={GROUP_LINE_Y} x2={g.x1} y2={GROUP_LINE_Y} />
                    <line x1={g.x0} y1={GROUP_LINE_Y} x2={g.x0} y2={GROUP_LINE_Y + 6} />
                    <line x1={g.x1} y1={GROUP_LINE_Y} x2={g.x1} y2={GROUP_LINE_Y + 6} />
                  </g>
                ))}
              {segments.map((s) => (
                <line
                  key={s.key}
                  className={cx('tcl-milestone-track__segment', s.pending && 'is-pending')}
                  x1={s.x1}
                  y1={s.y}
                  x2={s.x2}
                  y2={s.y}
                />
              ))}
              {geometry.connectors.map((c) => (
                <g key={c.key}>
                  <path
                    className={cx('tcl-milestone-track__connector', c.pending && 'is-pending')}
                    d={c.d}
                  />
                  {c.cues.map((cue) => (
                    <path
                      key={cue.key}
                      className={cx('tcl-milestone-track__flow-cue', cue.pending && 'is-pending')}
                      d={chevron(cue)}
                    />
                  ))}
                </g>
              ))}
              {geometry.flowCues.map((c) => (
                <path
                  key={c.key}
                  className={cx('tcl-milestone-track__flow-cue', c.pending && 'is-pending')}
                  d={chevron(c)}
                />
              ))}
              {geometry.arrow && (
                <path
                  className={cx(
                    'tcl-milestone-track__arrow',
                    geometry.arrow.pending && 'is-pending',
                  )}
                  d={`M ${geometry.arrow.x} ${geometry.arrow.y - 5} L ${geometry.arrow.x + 7 * geometry.arrow.dir} ${geometry.arrow.y} L ${geometry.arrow.x} ${geometry.arrow.y + 5}`}
                />
              )}
              {whiskers.map((w) => (
                <g
                  key={`w${w.key}`}
                  className="tcl-milestone-track__whisker"
                  style={vars({ '--bubble-tone': toneVar(w.tone) })}
                >
                  {w.caps.map((c, i) => (
                    <line key={`c${i}`} x1={c.x} y1={c.railY + 3} x2={c.x} y2={c.railY + 10} />
                  ))}
                  {w.runs.map((run, i) => (
                    <line
                      key={`r${i}`}
                      className="tcl-milestone-track__whisker-run"
                      x1={run.x1}
                      y1={run.y}
                      x2={run.x2}
                      y2={run.y}
                    />
                  ))}
                </g>
              ))}
              {bubbles.map((b) => {
                const left = taperPath(b.xL, 1, b.railY, b.half);
                const right = taperPath(b.xR, -1, b.railY, b.half);
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

            {/* group labels / row headers — decorative chrome; the label is folded
                into member stations' accessible names instead */}
            <div className="tcl-milestone-track__chrome" aria-hidden="true">
              {layout === 'rail'
                ? groups.map((g) => (
                    <span
                      key={g.key}
                      className="tcl-milestone-track__band-label"
                      style={vars({ left: `${(g.x0 + g.x1) / 2}px`, top: `${GROUP_LINE_Y}px` })}
                    >
                      {g.group.glyph && <Glyph name={g.group.glyph} />}
                      {g.group.label}
                    </span>
                  ))
                : geometry.rowHeaders.map((h) => (
                    <span
                      key={h.key}
                      className={cx(
                        'tcl-milestone-track__band-label',
                        'tcl-milestone-track__row-label',
                        h.end && 'is-end',
                      )}
                      style={vars({ left: `${h.x}px`, top: `${h.y}px` })}
                    >
                      {h.glyph && <Glyph name={h.glyph} />}
                      {h.label}
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
                        top: `${p.top}px`,
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
                        <span className="tcl-milestone-track__station-badge">
                          {p.station.badge}
                        </span>
                      )}
                    </button>

                    {bubble && (
                      <button
                        type="button"
                        className={cx(
                          'tcl-milestone-track__bubble',
                          bubble.key === selectedId && 'is-selected',
                        )}
                        data-size={bubble.half < COMPACT_HALF ? 'compact' : undefined}
                        style={vars({
                          '--bubble-tone': toneVar(bubble.tone),
                          '--bubble-ink': toneInk(bubble.tone),
                          left: `${bubble.xL + PINCH}px`,
                          top: `${bubble.railY - bubble.half}px`,
                          width: `${bubble.xR - bubble.xL - 2 * PINCH}px`,
                          height: `${bubble.half * 2}px`,
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
                            y1={bubble.half * 2}
                            x2="100%"
                            y2={bubble.half * 2}
                          />
                        </svg>
                        <span className="tcl-milestone-track__bubble-value">
                          {bubble.valueText}
                        </span>
                        <span className="tcl-milestone-track__bubble-label">{bubble.label}</span>
                        {(bubble.metric.count || bubble.share !== undefined) && (
                          // display:contents inside the capsule — the wrapper only
                          // becomes a box when the foot moves below it.
                          <span className="tcl-milestone-track__bubble-foot">
                            {bubble.metric.count && (
                              <span className="tcl-milestone-track__bubble-count">
                                {bubble.metric.count}
                              </span>
                            )}
                            {bubble.share !== undefined && (
                              <span
                                className="tcl-milestone-track__bubble-meter"
                                aria-hidden="true"
                              >
                                <span
                                  className="tcl-milestone-track__bubble-meter-fill"
                                  style={vars({ width: `${Math.round(bubble.share * 100)}%` })}
                                />
                              </span>
                            )}
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
