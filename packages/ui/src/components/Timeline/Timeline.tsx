import { useEffect, useMemo, useRef, useState } from 'react';
import { cx } from '../../utils/cx';
import { clampPct, toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import './Timeline.css';

/**
 * `Timeline` — a horizontal **chronicle**: discrete dated events placed on a
 * time axis, alternating above/below, tone-coded by category, with era markers
 * (nodes) on the axis. The "history timeline" idiom — release histories, project
 * roadmaps, biographies, geological eras — that the lane-based `Swimlane` and the
 * execution-log `RunHistory` don't cover.
 *
 * Deterministic layout (no engine) → it lives in the Tier-1 viz spine alongside
 * Swimlane/Funnel/Treemap. It IS that interaction spine: lead job reveal-state,
 * but afford/acknowledge are real — each event is a focusable `<button>` carrying
 * its accessible name (date · title · category), driven by controlled/uncontrolled
 * `selectedId` (+ `defaultSelectedId` + `onSelect`), with prev/next stepping the
 * selection chronologically and an `aria-live` inspector revealing the selected
 * event. The axis line, nodes, stems, and scrubber are decorative (`aria-hidden`).
 */
export type TimelineTone = FillBarTone;

export interface TimelineCategory {
  /** Matches `TimelineEvent.category`. */
  key: string;
  /** Legend + accessible-name label (e.g. "Wars"). */
  label: string;
  /** Tone for this category's events (default `neutral`). */
  tone?: TimelineTone;
}

export interface TimelineEvent {
  /** Stable id for selection; falls back to the index (NEVER the label). */
  id?: string;
  /** Numeric position on the axis (year, epoch index, …). Drives ordering + the `time` scale. */
  at: number;
  /** Pretty date string shown on the card + announced (e.g. "CDLXXI A.V."). Defaults to `at`. */
  dateLabel?: string;
  /** Event title. */
  label: string;
  /** Category key → tone + legend (e.g. "war"). */
  category?: string;
  /** Explicit tone override (wins over the category tone). */
  tone?: TimelineTone;
  /** Secondary line on the card (e.g. "EPOCH · TIDES"). */
  sub?: string;
  /** Body text on the card. */
  detail?: string;
  /** Inspector detail revealed on selection. */
  note?: string;
  /** Force the card above/below the axis (default alternates by order). */
  side?: 'above' | 'below';
}

export interface TimelineContract {
  view?: 'timeline';
  brand?: string;
  /** Chapter/volume mark (e.g. "III"), shown large + decorative in the header. */
  code?: string;
  title?: string;
  caption?: string;
  /** Right-aligned header meta (e.g. "1,204 YEARS · 7 EPOCHS"). */
  meta?: string;
  events: TimelineEvent[];
  /** Legend + tone mapping. */
  categories?: TimelineCategory[];
  /** `ordinal` (even columns, default) or `time` (proportional to `at`, de-overlapped). */
  scale?: 'ordinal' | 'time';
  /** Axis domain for the `time` scale (defaults to the event min/max). */
  range?: { min?: number; max?: number };
}

export interface TimelineProps {
  data: TimelineContract;
  /** Controlled selected event id. */
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

/** Stable, collision-proof key: explicit id, else the index (NEVER the label). */
const eventIdOf = (e: TimelineEvent, i: number): string => e.id ?? `e${i}`;

/** Accent painted as TEXT fails AA on light surfaces → fall back to --tcl-text; other tones keep their hue. */
const toneInk = (tone: TimelineTone): string =>
  tone === 'accent' ? 'var(--tcl-text)' : toneVar(tone);

// Deterministic geometry (px). The axis SVG and the absolutely-positioned event
// buttons share this exact coordinate space, so stems always meet their nodes.
const COL_W = 224; // column pitch (ordinal) / de-overlap span basis (time)
const CARD_W = 196; // event card width
const CARD_H = 132; // event card height
const STEM = 26; // gap between a card and its axis node
const NODE_R = 6; // axis node radius
const PAD_X = 28; // track inset so the first/last focus ring never clips
const PAD_Y = 18; // top/bottom inset
const MIN_GAP = CARD_W * 0.58; // time scale: closest two nodes may sit (no card overlap)
const AXIS_Y = PAD_Y + CARD_H + STEM;
const TRACK_H = 2 * PAD_Y + 2 * CARD_H + 2 * STEM;

interface PlacedEvent {
  id: string;
  i: number;
  event: TimelineEvent;
  tone: TimelineTone;
  side: 'above' | 'below';
  categoryLabel?: string;
  dateText: string;
  nodeX: number;
  cardX: number;
  cardY: number;
}

interface Layout {
  events: PlacedEvent[];
  width: number;
  axisFrom: number;
  axisTo: number;
}

function buildLayout(data: TimelineContract): Layout {
  const raw = data.events ?? [];
  const catTone = new Map<string, TimelineTone>();
  const catLabel = new Map<string, string>();
  (data.categories ?? []).forEach((c) => {
    catTone.set(c.key, c.tone ?? 'neutral');
    catLabel.set(c.key, c.label);
  });

  // Chronological order drives placement, alternation, and prev/next. Stable for
  // equal dates (preserve authored order via the original index as a tiebreak).
  const ordered = raw
    .map((event, i) => ({ event, i }))
    .sort((a, b) => a.event.at - b.event.at || a.i - b.i);

  const scale = data.scale ?? 'ordinal';
  const ats = ordered.map((o) => o.event.at);
  const lo = data.range?.min ?? (ats.length ? Math.min(...ats) : 0);
  const hi = data.range?.max ?? (ats.length ? Math.max(...ats) : 0);
  // A degenerate domain (hi <= lo) can't drive a proportional axis → fall back to ordinal.
  const useTime = scale === 'time' && hi > lo;
  const span = Math.max(0, (ordered.length - 1) * COL_W);

  let prevX = -Infinity;
  const events: PlacedEvent[] = ordered.map(({ event, i }, k) => {
    const idealX = useTime
      ? PAD_X + CARD_W / 2 + (clampPct(event.at, lo, hi) / 100) * span
      : PAD_X + CARD_W / 2 + k * COL_W;
    // De-overlap (time scale only): never let a card overlap its left neighbour.
    const nodeX = useTime ? Math.max(idealX, prevX + MIN_GAP) : idealX;
    prevX = nodeX;

    const tone: TimelineTone =
      event.tone ?? (event.category ? (catTone.get(event.category) ?? 'neutral') : 'neutral');
    const side: 'above' | 'below' = event.side ?? (k % 2 === 0 ? 'above' : 'below');

    return {
      id: eventIdOf(event, i),
      i,
      event,
      tone,
      side,
      categoryLabel: event.category ? catLabel.get(event.category) : undefined,
      dateText: event.dateLabel ?? String(event.at),
      nodeX,
      cardX: nodeX - CARD_W / 2,
      cardY: side === 'above' ? PAD_Y : AXIS_Y + STEM,
    };
  });

  const axisFrom = events.length ? events[0].nodeX : PAD_X;
  const axisTo = events.length ? events[events.length - 1].nodeX : PAD_X;
  const width = events.length ? axisTo + CARD_W / 2 + PAD_X : PAD_X * 2;
  return { events, width, axisFrom, axisTo };
}

export function Timeline({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: TimelineProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultSelectedId);
  const selectedId = selProp ?? internal;
  const select = (id: string): void => {
    if (selProp === undefined) setInternal(id);
    onSelect?.(id);
  };

  const layout = useMemo(() => buildLayout(data), [data]);
  const { events, width, axisFrom, axisTo } = layout;

  const scrollerRef = useRef<HTMLDivElement>(null);
  const selectedIndex = events.findIndex((e) => e.id === selectedId);
  const selected = selectedIndex >= 0 ? events[selectedIndex] : undefined;
  const hasContent = events.length > 0;

  // Keep the selected event in view as selection moves (e.g. via prev/next).
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !selected || typeof el.scrollTo !== 'function') return;
    const left = selected.cardX - (el.clientWidth - CARD_W) / 2;
    try {
      el.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    } catch {
      /* jsdom / unsupported — keeping the selection in view is a progressive enhancement */
    }
  }, [selected]);

  const stepBy = (delta: number): void => {
    const next = selectedIndex < 0 ? (delta > 0 ? 0 : events.length - 1) : selectedIndex + delta;
    const target = events[next];
    if (target) select(target.id);
  };

  const categories = data.categories ?? [];
  const progress =
    hasContent && selectedIndex >= 0 ? ((selectedIndex + 1) / events.length) * 100 : 0;
  const hasHeader = Boolean(data.brand || data.code || data.title || data.caption || data.meta);

  return (
    <div className={cx('tcl-timeline', className)}>
      {hasHeader && (
        <header className="tcl-timeline__header">
          {data.code && (
            <span className="tcl-timeline__code" aria-hidden="true">
              {data.code}
            </span>
          )}
          <div className="tcl-timeline__heading">
            {data.brand && <p className="tcl-timeline__brand">{data.brand}</p>}
            {data.title && <p className="tcl-timeline__title">{data.title}</p>}
            {data.caption && <p className="tcl-timeline__caption">{data.caption}</p>}
          </div>
          {data.meta && <span className="tcl-timeline__meta">{data.meta}</span>}
        </header>
      )}

      {hasContent ? (
        <div className="tcl-timeline__scroller" ref={scrollerRef}>
          <div
            className="tcl-timeline__track"
            style={vars({ width: `${width}px`, height: `${TRACK_H}px` })}
          >
            {/* axis line, stems + era nodes — one decorative coordinate space */}
            <svg
              className="tcl-timeline__axis"
              width={width}
              height={TRACK_H}
              viewBox={`0 0 ${width} ${TRACK_H}`}
              aria-hidden="true"
            >
              <line
                className="tcl-timeline__rail"
                x1={axisFrom}
                y1={AXIS_Y}
                x2={axisTo}
                y2={AXIS_Y}
              />
              {events.map((p) => {
                const active = p.id === selectedId;
                const stemY1 = p.side === 'above' ? p.cardY + CARD_H : AXIS_Y;
                const stemY2 = p.side === 'above' ? AXIS_Y : p.cardY;
                return (
                  <g
                    key={p.id}
                    className={cx('tcl-timeline__mark', active && 'is-selected')}
                    style={vars({ '--event-tone': toneVar(p.tone) })}
                  >
                    <line
                      className="tcl-timeline__stem"
                      x1={p.nodeX}
                      y1={stemY1}
                      x2={p.nodeX}
                      y2={stemY2}
                    />
                    <circle
                      className="tcl-timeline__node"
                      cx={p.nodeX}
                      cy={AXIS_Y}
                      r={active ? NODE_R + 2 : NODE_R}
                    />
                  </g>
                );
              })}
            </svg>

            <div
              className="tcl-timeline__events"
              role="group"
              aria-label={data.title ?? 'Timeline'}
            >
              {events.map((p) => {
                const isSelected = p.id === selectedId;
                const name = `${p.dateText}: ${p.event.label}${p.categoryLabel ? ` — ${p.categoryLabel}` : ''}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-event-id={p.id}
                    className={cx(
                      'tcl-timeline__event',
                      `is-${p.side}`,
                      isSelected && 'is-selected',
                    )}
                    style={vars({
                      '--event-tone': toneVar(p.tone),
                      '--event-ink': toneInk(p.tone),
                      left: `${p.cardX}px`,
                      top: `${p.cardY}px`,
                      width: `${CARD_W}px`,
                      height: `${CARD_H}px`,
                    })}
                    aria-pressed={isSelected}
                    aria-label={name}
                    onClick={() => select(p.id)}
                  >
                    <span className="tcl-timeline__date">{p.dateText}</span>
                    {p.event.sub && <span className="tcl-timeline__sub">{p.event.sub}</span>}
                    <span className="tcl-timeline__label" title={p.event.label}>
                      {p.event.label}
                    </span>
                    {p.event.detail && (
                      <span className="tcl-timeline__detail">{p.event.detail}</span>
                    )}
                    {p.categoryLabel && (
                      <span className="tcl-timeline__tag">{p.categoryLabel}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="tcl-timeline__empty">No events to chronicle</p>
      )}

      {hasContent && (
        <div className="tcl-timeline__scrubber" aria-hidden="true">
          <span
            className="tcl-timeline__scrubber-fill"
            style={vars({ '--progress': `${progress}%` })}
          />
        </div>
      )}

      <div className="tcl-timeline__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-timeline__inspector-title">
              <span
                className="tcl-timeline__inspector-date"
                style={vars({ '--event-ink': toneInk(selected.tone) })}
              >
                {selected.dateText}
              </span>
              {' · '}
              {selected.event.label}
              {selected.categoryLabel && (
                <span className="tcl-timeline__inspector-cat">
                  {' · '}
                  {selected.categoryLabel}
                </span>
              )}
            </p>
            {selected.event.sub && (
              <p className="tcl-timeline__inspector-sub">{selected.event.sub}</p>
            )}
            {selected.event.note && (
              <p className="tcl-timeline__inspector-note">{selected.event.note}</p>
            )}
          </>
        ) : (
          <p className="tcl-timeline__inspector-hint">Select an event to inspect it.</p>
        )}
      </div>

      {(hasContent || categories.length > 0) && (
        <div className="tcl-timeline__footer">
          <button
            type="button"
            className="tcl-timeline__nav"
            aria-label="Previous event"
            disabled={!hasContent || selectedIndex === 0}
            onClick={() => stepBy(-1)}
          >
            <span aria-hidden="true">◀</span>
          </button>

          {categories.length > 0 && (
            <ul className="tcl-timeline__legend">
              {categories.map((c) => (
                <li key={c.key} className="tcl-timeline__legend-item">
                  <span
                    className="tcl-timeline__legend-dot"
                    style={vars({ '--event-tone': toneVar(c.tone ?? 'neutral') })}
                    aria-hidden="true"
                  />
                  {c.label}
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className="tcl-timeline__nav"
            aria-label="Next event"
            disabled={!hasContent || selectedIndex === events.length - 1}
            onClick={() => stepBy(1)}
          >
            <span aria-hidden="true">▶</span>
          </button>
        </div>
      )}
    </div>
  );
}
