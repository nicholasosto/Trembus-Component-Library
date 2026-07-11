import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { cx } from '../../utils/cx';
import { toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import './Swimlane.css';

/**
 * `Swimlane` — a process diagram for **human ↔ LLM workflows**. Each lane (row) is
 * an actor (human / ai / system / tool); each step is a focusable `<button>` placed
 * in its lane and ordered left-to-right by column, with decorative SVG connectors
 * tracing the **handoffs** as work crosses lanes. It consumes a Trembus Visual
 * Grammar **swimlane contract** so one authored shape draws in both the static HTML
 * kit and React.
 *
 * Layout is fully deterministic — lane row × explicit/sequential column, no layout
 * engine — which is why it lives in the Tier-1 viz spine alongside Funnel/Treemap.
 * It is the Hub/BarChart interaction spine: controlled/uncontrolled `selectedId`
 * (+ `defaultSelectedId` + `onSelect`), and selecting a step reveals its actor,
 * status, note, and handoffs in a live (`aria-live`) inspector.
 */
export type SwimlaneStatus = 'done' | 'active' | 'pending' | 'blocked' | 'skipped';
export type SwimlaneLaneKind = 'human' | 'ai' | 'system' | 'tool' | 'neutral';

export interface SwimlaneLane {
  /** Stable id; steps reference it by `id` OR `label`. Falls back to the index. */
  id?: string;
  /** Lane name — the actor (e.g. "You", "Claude", "Tools"). */
  label: string;
  /** Actor kind → the lane's accent + dot (default `neutral`). */
  kind?: SwimlaneLaneKind;
}

export interface SwimlaneStep {
  /** Stable id for selection + handoff targeting; falls back to the step index. */
  id?: string;
  /** Owning lane — matches a lane's `id` or `label`. */
  lane: string;
  /** Step name. */
  label: string;
  /** Column (0-based). Omit to flow sequentially after the previous step. */
  col?: number;
  /** Progress state → the card's accent + status dot (default `pending`). */
  status?: SwimlaneStatus;
  /** Secondary line shown in the card + inspector. */
  detail?: string;
  /** Inspector detail shown when this step is selected. */
  note?: string;
  /**
   * Successor step ids this step hands off to (draws a connector to each).
   * Omit to connect to the next step in order; pass `[]` for a terminal step.
   */
  to?: string[];
}

export interface SwimlaneContract {
  view?: 'swimlane';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  lanes: SwimlaneLane[];
  steps: SwimlaneStep[];
}

export interface SwimlaneProps {
  data: SwimlaneContract;
  /** Controlled selected step id. */
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

/** Stable, collision-proof keys: explicit id, else the index (NEVER the label). */
const laneIdOf = (l: SwimlaneLane, i: number): string => l.id ?? `l${i}`;
const stepIdOf = (s: SwimlaneStep, i: number): string => s.id ?? `s${i}`;

const KIND_TONE: Record<SwimlaneLaneKind, FillBarTone> = {
  human: 'info',
  ai: 'accent',
  system: 'neutral',
  tool: 'warning',
  neutral: 'neutral',
};

const STATUS_META: Record<SwimlaneStatus, { tone: FillBarTone; word: string }> = {
  done: { tone: 'success', word: 'Done' },
  active: { tone: 'accent', word: 'Active' },
  pending: { tone: 'neutral', word: 'Pending' },
  blocked: { tone: 'danger', word: 'Blocked' },
  skipped: { tone: 'neutral', word: 'Skipped' },
};

// Deterministic geometry (px). The track SVG and the absolutely-positioned step
// buttons share this exact coordinate space, so connectors always meet their cells.
const COL_W = 168; // column pitch
const CELL_W = 140; // step card width (COL_W − CELL_W = the connector gutter)
const LANE_H = 88; // lane row pitch
const CELL_H = 60; // step card height
const PAD = 14; // track inset so focus rings never clip at the edges

interface PlacedStep {
  id: string;
  i: number;
  step: SwimlaneStep;
  laneLabel: string;
  row: number;
  col: number;
  x: number;
  y: number;
}

interface Edge {
  key: string;
  from: string;
  to: string;
  /** Bezier path + the right-pointing arrowhead anchor. */
  d: string;
  ax: number;
  ay: number;
}

interface Layout {
  lanes: ReadonlyArray<{ id: string; lane: SwimlaneLane; row: number }>;
  steps: PlacedStep[];
  edges: Edge[];
  width: number;
  height: number;
}

function buildLayout(data: SwimlaneContract): Layout {
  const laneList = data.lanes ?? [];
  const stepList = data.steps ?? [];

  const lanes = laneList.map((lane, row) => ({ id: laneIdOf(lane, row), lane, row }));
  // Resolve a step's `lane` by lane id OR label (authored contracts use either).
  const rowByKey = new Map<string, number>();
  lanes.forEach(({ id, lane, row }) => {
    rowByKey.set(id, row);
    rowByKey.set(lane.label, row);
  });

  // Column assignment: honor explicit `col`, otherwise flow to the next free
  // column. Explicit cols still advance the cursor so later steps don't overlap.
  let cursor = 0;
  const steps: PlacedStep[] = [];
  stepList.forEach((step, i) => {
    const row = rowByKey.get(step.lane);
    if (row === undefined) return; // step targets an unknown lane → skip it
    const col = Math.max(0, Number.isFinite(step.col) ? (step.col as number) : cursor);
    cursor = Math.max(cursor, col + 1);
    steps.push({
      id: stepIdOf(step, i),
      i,
      step,
      laneLabel: lanes[row].lane.label,
      row,
      col,
      x: PAD + col * COL_W,
      y: row * LANE_H + (LANE_H - CELL_H) / 2,
    });
  });

  const byId = new Map(steps.map((p) => [p.id, p]));

  // Connectors: explicit `to`, else the next step in document order.
  const edges: Edge[] = [];
  steps.forEach((src, idx) => {
    const next = steps[idx + 1];
    const targets = src.step.to ?? (next ? [next.id] : []);
    // Dedupe targets so a repeated/self id can't draw a connector twice or
    // collide on the React key (`from->to`).
    const seen = new Set<string>();
    targets.forEach((tid) => {
      if (tid === src.id || seen.has(tid)) return;
      seen.add(tid);
      const tgt = byId.get(tid);
      if (!tgt) return;
      const sx = src.x + CELL_W;
      const sy = src.y + CELL_H / 2;
      const tx = tgt.x;
      const ty = tgt.y + CELL_H / 2;
      const dx = Math.max(24, Math.abs(tx - sx) * 0.5);
      edges.push({
        key: `${src.id}->${tgt.id}`,
        from: src.id,
        to: tgt.id,
        d: `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`,
        ax: tx,
        ay: ty,
      });
    });
  });

  const maxCol = steps.reduce((m, p) => Math.max(m, p.col), 0);
  return {
    lanes,
    steps,
    edges,
    width: PAD + maxCol * COL_W + CELL_W + PAD,
    height: Math.max(1, lanes.length) * LANE_H,
  };
}

export function Swimlane({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: SwimlaneProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultSelectedId);
  const selectedId = selProp ?? internal;
  const select = (id: string): void => {
    if (selProp === undefined) setInternal(id);
    onSelect?.(id);
  };

  const layout = useMemo(() => buildLayout(data), [data]);
  const { lanes, steps, edges, width, height } = layout;
  const firstStepId = steps[0]?.id;
  const selectedStepId = steps.some(({ id }) => id === selectedId) ? selectedId : undefined;
  const [rovingId, setRovingId] = useState<string | undefined>(selectedStepId ?? firstStepId);
  const resolvedRovingId = steps.some(({ id }) => id === rovingId)
    ? rovingId
    : (selectedStepId ?? firstStepId);
  const stepRefs = useRef(new Map<string, HTMLButtonElement>());
  const stepGroupRef = useRef<HTMLDivElement>(null);
  const previousControlledId = useRef(selProp);

  useEffect(() => {
    if (resolvedRovingId !== rovingId) setRovingId(resolvedRovingId);
  }, [resolvedRovingId, rovingId]);

  useLayoutEffect(() => {
    if (selProp === previousControlledId.current) return;
    previousControlledId.current = selProp;

    const nextId = steps.some(({ id }) => id === selProp) ? selProp : firstStepId;
    const focusWasInside = stepGroupRef.current?.contains(document.activeElement) ?? false;
    setRovingId(nextId);
    if (focusWasInside && nextId) stepRefs.current.get(nextId)?.focus();
  }, [firstStepId, selProp, steps]);

  const moveFocus = (event: ReactKeyboardEvent<HTMLButtonElement>, currentId: string): void => {
    const currentIndex = steps.findIndex(({ id }) => id === currentId);
    if (currentIndex < 0 || steps.length === 0) return;

    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % steps.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + steps.length) % steps.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = steps.length - 1;
    }

    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextId = steps[nextIndex].id;
    setRovingId(nextId);
    select(nextId);
    stepRefs.current.get(nextId)?.focus();
  };

  const selected = steps.find((p) => p.id === selectedId);
  const successors = selected
    ? edges.filter((e) => e.from === selected.id).map((e) => steps.find((p) => p.id === e.to))
    : [];
  const hasContent = steps.length > 0;

  return (
    <div className={cx('tcl-swimlane', className)}>
      {(data.code || data.title || data.caption || data.brand) && (
        <header className="tcl-swimlane__header">
          {data.brand && <p className="tcl-swimlane__brand">{data.brand}</p>}
          {data.code && <p className="tcl-swimlane__code">{data.code}</p>}
          {data.title && <p className="tcl-swimlane__title">{data.title}</p>}
          {data.caption && <p className="tcl-swimlane__caption">{data.caption}</p>}
        </header>
      )}

      {hasContent ? (
        <div className="tcl-swimlane__board">
          {/* sticky actor column */}
          <div className="tcl-swimlane__lanes" aria-hidden="true">
            {lanes.map(({ id, lane }) => {
              const tone = KIND_TONE[lane.kind ?? 'neutral'];
              return (
                <div
                  key={id}
                  className="tcl-swimlane__lane-head"
                  style={vars({ '--lane-tone': toneVar(tone), height: `${LANE_H}px` })}
                >
                  <span className="tcl-swimlane__lane-dot" />
                  <span className="tcl-swimlane__lane-label">{lane.label}</span>
                  {lane.kind && lane.kind !== 'neutral' && (
                    <span className="tcl-swimlane__lane-kind">{lane.kind}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* the track: lane stripes + connector SVG + step buttons, one coord space */}
          <div
            className="tcl-swimlane__track"
            style={vars({ width: `${width}px`, height: `${height}px` })}
          >
            {lanes.map(({ id, row }) => (
              <div
                key={id}
                className={cx('tcl-swimlane__stripe', row % 2 === 1 && 'is-alt')}
                style={vars({ top: `${row * LANE_H}px`, height: `${LANE_H}px` })}
                aria-hidden="true"
              />
            ))}

            <svg
              className="tcl-swimlane__edges"
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              aria-hidden="true"
            >
              {edges.map((e) => {
                const active = selectedId != null && (e.from === selectedId || e.to === selectedId);
                return (
                  <g key={e.key} className={cx('tcl-swimlane__edge', active && 'is-active')}>
                    <path className="tcl-swimlane__edge-line" d={e.d} />
                    <path
                      className="tcl-swimlane__edge-arrow"
                      d={`M ${e.ax} ${e.ay} L ${e.ax - 7} ${e.ay - 4} L ${e.ax - 7} ${e.ay + 4} Z`}
                    />
                  </g>
                );
              })}
            </svg>

            <div
              ref={stepGroupRef}
              className="tcl-swimlane__steps"
              role="group"
              aria-label={data.title ?? 'Swimlane'}
            >
              {steps.map((p) => {
                const status = p.step.status ?? 'pending';
                const meta = STATUS_META[status];
                const isSelected = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={cx(
                      'tcl-swimlane__step',
                      `is-${status}`,
                      isSelected && 'is-selected',
                    )}
                    style={vars({
                      '--step-tone': toneVar(meta.tone),
                      left: `${p.x}px`,
                      top: `${p.y}px`,
                      width: `${CELL_W}px`,
                      height: `${CELL_H}px`,
                    })}
                    aria-pressed={isSelected}
                    tabIndex={p.id === resolvedRovingId ? 0 : -1}
                    aria-label={`${p.laneLabel}: ${p.step.label} — ${meta.word}`}
                    ref={(node) => {
                      if (node) stepRefs.current.set(p.id, node);
                      else stepRefs.current.delete(p.id);
                    }}
                    onClick={() => {
                      setRovingId(p.id);
                      select(p.id);
                    }}
                    onKeyDown={(event) => moveFocus(event, p.id)}
                  >
                    <span className="tcl-swimlane__step-top">
                      <span className="tcl-swimlane__step-dot" aria-hidden="true" />
                      <span className="tcl-swimlane__step-label" title={p.step.label}>
                        {p.step.label}
                      </span>
                    </span>
                    {p.step.detail && (
                      <span className="tcl-swimlane__step-detail">{p.step.detail}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="tcl-swimlane__empty">No steps to lay out</p>
      )}

      <div className="tcl-swimlane__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-swimlane__inspector-title">
              <span className="tcl-swimlane__inspector-lane">{selected.laneLabel}</span>
              {' · '}
              {selected.step.label}
              <span className="tcl-swimlane__inspector-status">
                {' · '}
                {STATUS_META[selected.step.status ?? 'pending'].word}
              </span>
            </p>
            {selected.step.note && (
              <p className="tcl-swimlane__inspector-note">{selected.step.note}</p>
            )}
            {successors.length > 0 && (
              <p className="tcl-swimlane__inspector-handoff">
                Hands off to{' '}
                {successors
                  .filter((s): s is PlacedStep => s != null)
                  .map((s) => `${s.laneLabel} · ${s.step.label}`)
                  .join(', ')}
              </p>
            )}
          </>
        ) : (
          <p className="tcl-swimlane__inspector-hint">Select a step to inspect its handoff.</p>
        )}
      </div>
    </div>
  );
}
