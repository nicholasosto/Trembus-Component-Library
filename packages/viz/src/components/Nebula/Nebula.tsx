import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { cx, vars, toneVar, VizOverlay, useControllableSelection } from '../../internal';
import type { VizTone, Point3 } from '../../internal';
import { layoutNebula, rotateYawPitch, perspectiveScale, NEBULA_CAMERA } from '../../internal';
import './Nebula.css';

/** Tone vocabulary for nebula groups/items — the shared @trembus/tokens ontology. */
export type NebulaTone = VizTone;

export interface NebulaItem {
  /** REQUIRED (Tier-2 rule — links reference it; ids never fall back to an index). */
  id: string;
  /** Item label — the accessible name + the node text. */
  label: string;
  /** Cluster key; items sharing a group contract toward each other and share a cloud. */
  group?: string;
  /** Inspector detail shown when selected. */
  summary?: string;
  /** Size emphasis 0..1 (e.g. a normalized activation count). Default 0.5. */
  weight?: number;
  /** Color-coded tone — overrides the group tone for this item. */
  tone?: NebulaTone;
  /** 3D position used when `layout: 'given'` (any scale; normalized to the unit sphere). */
  position?: readonly [number, number, number];
}

export interface NebulaLink {
  source: string;
  target: string;
  /** Relatedness 0..1 (default 0.5) — higher pulls the pair closer in space. */
  weight?: number;
  /** Relationship name revealed in the inspector (e.g. `conforms-to`). */
  kind?: string;
}

export interface NebulaGroupMeta {
  /** Display label for the legend + accessible names (defaults to the group key). */
  label?: string;
  /** Cloud/node tone (defaults to a cycle by group order of first appearance). */
  tone?: NebulaTone;
}

export interface NebulaContract {
  /** Masthead eyebrow above the title. */
  brand?: string;
  /** Mono code chip in the masthead. */
  code?: string;
  /** Diagram heading. */
  title?: string;
  /** Support line beneath the heading. */
  caption?: string;
  /** Flat item list; proximity is derived from `links` (or taken from `position`). */
  items: NebulaItem[];
  /** Weighted relatedness edges; dangling/self references are dropped silently. */
  links?: NebulaLink[];
  /** Group metadata keyed by the group value items carry. */
  groups?: Record<string, NebulaGroupMeta>;
  /** `auto` (default) embeds via deterministic MDS; `given` uses `item.position`. */
  layout?: 'auto' | 'given';
}

export interface NebulaProps {
  /** The nebula contract — items + weighted links; closeness IS relatedness. */
  data: NebulaContract;
  /** Controlled selected item id. */
  selectedId?: string;
  /** Uncontrolled initial selection. */
  defaultSelectedId?: string;
  /** Called with the item id when one is selected. */
  onSelect?: (id: string) => void;
  /** Which relation edges to draw (default `selected` — the selection reveals its threads). */
  showEdges?: 'selected' | 'all' | 'none';
  /** Slow idle orbit — suppressed under `prefers-reduced-motion`, pausable via a real button. */
  autoOrbit?: boolean;
  /** Starting view angles in radians (also the `Home`/Reset target). */
  initialRotation?: { yaw: number; pitch: number };
  className?: string;
}

// ── layout geometry (viewBox units; nodes are positioned by % over it) ──
const W = 760;
const H = 520;
const PAD = 64;
const R = (H - 2 * PAD) / 2;
const TONE_CYCLE: NebulaTone[] = ['accent', 'info', 'success', 'warning', 'danger', 'neutral'];
const DEFAULT_ROTATION = { yaw: 0.5, pitch: -0.28 };
const DRAG_SENS = 0.008; // radians per pixel
const KEY_STEP = Math.PI / 18; // 10° per arrow press
const PITCH_LIMIT = 1.35;
const ORBIT_SPEED = 0.00015; // radians per ms ≈ 0.15 rad/s
const MIN_PERSP = perspectiveScale(-1);
const MAX_PERSP = perspectiveScale(1);

const clamp = (lo: number, hi: number, v: number): number => Math.min(hi, Math.max(lo, v));
const clamp01 = (v: number, fallback: number): number =>
  Number.isFinite(v) ? clamp(0, 1, v) : fallback;

interface CleanItem {
  id: string;
  label: string;
  summary?: string;
  weight: number;
  tone: NebulaTone;
  /** -1 = ungrouped. */
  groupIdx: number;
  position: Point3 | undefined;
}

interface CleanLink {
  a: number;
  b: number;
  weight: number;
  kind?: string;
}

interface CleanGroup {
  key: string;
  label: string;
  tone: NebulaTone;
}

interface Sanitized {
  items: CleanItem[];
  links: CleanLink[];
  groups: CleanGroup[];
}

// Single sanitize pass — pure and total, never throws (the sanitizeTree rule):
// dedup first-wins, ids required, weights clamped, dangling/self links dropped,
// `given` positions laundered finite and normalized into the unit sphere.
function sanitizeNebula(data: NebulaContract): Sanitized {
  const groupIdxByKey = new Map<string, number>();
  const groups: CleanGroup[] = [];
  const indexById = new Map<string, number>();
  const items: CleanItem[] = [];

  for (const raw of data.items ?? []) {
    if (!raw || typeof raw.id !== 'string' || !raw.id || indexById.has(raw.id)) continue;
    let groupIdx = -1;
    if (typeof raw.group === 'string' && raw.group) {
      const existing = groupIdxByKey.get(raw.group);
      if (existing !== undefined) {
        groupIdx = existing;
      } else {
        groupIdx = groups.length;
        groupIdxByKey.set(raw.group, groupIdx);
        const meta = data.groups?.[raw.group];
        groups.push({
          key: raw.group,
          label: meta?.label ?? raw.group,
          tone: meta?.tone ?? TONE_CYCLE[groupIdx % TONE_CYCLE.length],
        });
      }
    }
    let position: Point3 | undefined;
    if (Array.isArray(raw.position) && raw.position.length === 3) {
      position = [
        Number.isFinite(raw.position[0]) ? raw.position[0] : 0,
        Number.isFinite(raw.position[1]) ? raw.position[1] : 0,
        Number.isFinite(raw.position[2]) ? raw.position[2] : 0,
      ];
    }
    indexById.set(raw.id, items.length);
    items.push({
      id: raw.id,
      label: typeof raw.label === 'string' && raw.label ? raw.label : raw.id,
      summary: raw.summary,
      weight: clamp01(raw.weight ?? 0.5, 0.5),
      tone: raw.tone ?? (groupIdx >= 0 ? groups[groupIdx].tone : 'neutral'),
      groupIdx,
      position,
    });
  }

  // Normalize `given` positions into the unit sphere so any consumer scale works.
  let maxNorm = 0;
  for (const it of items) {
    if (!it.position) continue;
    const [x, y, z] = it.position;
    maxNorm = Math.max(maxNorm, Math.sqrt(x * x + y * y + z * z));
  }
  if (maxNorm > 1e-9) {
    for (const it of items) {
      if (!it.position) continue;
      it.position = [it.position[0] / maxNorm, it.position[1] / maxNorm, it.position[2] / maxNorm];
    }
  }

  const links: CleanLink[] = [];
  const seenPairs = new Set<string>();
  for (const raw of data.links ?? []) {
    if (!raw) continue;
    const a = indexById.get(raw.source);
    const b = indexById.get(raw.target);
    if (a === undefined || b === undefined || a === b) continue;
    const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seenPairs.has(pair)) continue;
    seenPairs.add(pair);
    links.push({ a, b, weight: clamp01(raw.weight ?? 0.5, 0.5), kind: raw.kind });
  }

  return { items, links, groups };
}

interface Neighbor {
  idx: number;
  closeness: number;
  kind?: string;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (): void => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

/**
 * Nebula — a 3D concept map where DISTANCE is the message: items embed in 3D
 * space by relatedness (deterministic classical MDS over weighted links, or
 * consumer-given coordinates), project to 2D with depth cues, and rotate under
 * drag / arrow keys / an opt-in paused-by-default-under-reduced-motion orbit.
 * Lead job is reveal-state; afford/acknowledge are real — every item is a
 * focusable HTML button over the decorative scene, and the aria-live inspector
 * names the selected item's nearest neighbors with weights (the textual
 * equivalent of proximity).
 */
export function Nebula({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  showEdges = 'selected',
  autoOrbit = false,
  initialRotation,
  className,
}: NebulaProps) {
  // Raw useId() contains ':' on some React 19.x versions, which breaks SVG
  // url(#…) refs in Firefox (the AudioWaveform/LineChart scar) — sanitize it.
  const rawGradientId = useId();
  const gradientId = `neb-${rawGradientId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [selectedId, select] = useControllableSelection(selProp, defaultSelectedId, onSelect);
  const [rovingId, setRovingId] = useState<string | undefined>(() => selProp ?? defaultSelectedId);
  const previousSelectedIdProp = useRef(selProp);
  const nodeEls = useRef(new Map<string, HTMLButtonElement>());

  // Re-seed roving focus only when the external selectedId value actually changes, so a
  // controlled parent that hasn't accepted onSelect can't yank the tab stop (Strata rule).
  useLayoutEffect(() => {
    if (previousSelectedIdProp.current === selProp) return;
    previousSelectedIdProp.current = selProp;
    setRovingId(selProp);
  }, [selProp]);

  const S = useMemo(() => sanitizeNebula(data), [data]);
  const layoutMode = data.layout ?? 'auto';

  const positions: Point3[] = useMemo(() => {
    if (layoutMode === 'given') return S.items.map((it) => it.position ?? [0, 0, 0]);
    return layoutNebula(
      S.items.length,
      S.links.map((l) => ({ a: l.a, b: l.b, w: l.weight })),
      S.items.map((it) => it.groupIdx),
    );
  }, [S, layoutMode]);

  // Nearest neighbors in the UNROTATED 3D space — rotation-invariant, so the
  // live inspector never re-announces while the view spins.
  const neighbors = useMemo(() => {
    const linkAt = new Map<string, CleanLink>();
    for (const l of S.links) linkAt.set(l.a < l.b ? `${l.a}|${l.b}` : `${l.b}|${l.a}`, l);
    const out: Neighbor[][] = S.items.map(() => []);
    for (let i = 0; i < S.items.length; i++) {
      const ranked: { idx: number; d: number }[] = [];
      for (let j = 0; j < S.items.length; j++) {
        if (i === j) continue;
        const dx = positions[i][0] - positions[j][0];
        const dy = positions[i][1] - positions[j][1];
        const dz = positions[i][2] - positions[j][2];
        ranked.push({ idx: j, d: Math.sqrt(dx * dx + dy * dy + dz * dz) });
      }
      ranked.sort((a, b) => a.d - b.d || a.idx - b.idx);
      out[i] = ranked.slice(0, 3).map(({ idx, d }) => {
        const link = linkAt.get(i < idx ? `${i}|${idx}` : `${idx}|${i}`);
        return {
          idx,
          closeness: link ? link.weight : clamp(0, 1, 1 - d / 2),
          kind: link?.kind,
        };
      });
    }
    return out;
  }, [S, positions]);

  const resetRotation = initialRotation ?? DEFAULT_ROTATION;
  const [rot, setRot] = useState(() => resetRotation);
  const [dragging, setDragging] = useState(false);
  const [orbitPaused, setOrbitPaused] = useState(false);
  const dragRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  const orbiting = autoOrbit && !reducedMotion && !orbitPaused && !dragging;
  useEffect(() => {
    if (!orbiting) return;
    let raf = 0;
    let last: number | undefined;
    const tick = (t: number): void => {
      if (last !== undefined) {
        // Cap dt so a background tab (rAF starved) can't snap the view on return.
        const dt = Math.min(t - last, 100);
        setRot((r) => ({ yaw: r.yaw + dt * ORBIT_SPEED, pitch: r.pitch }));
      }
      last = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [orbiting]);

  // ── drag-to-rotate (pointer capture; node presses pass through untouched) ──
  const onStagePointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return;
    // A press that lands on any interactive child belongs to that child — capturing
    // it here would retarget the click and break node selection.
    if ((event.target as Element).closest('button')) return;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
  };
  const onStagePointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const d = dragRef.current;
    if (!d || d.pointerId !== event.pointerId) return;
    const dx = event.clientX - d.x;
    const dy = event.clientY - d.y;
    dragRef.current = { pointerId: d.pointerId, x: event.clientX, y: event.clientY };
    setRot((r) => ({
      yaw: r.yaw + dx * DRAG_SENS,
      pitch: clamp(-PITCH_LIMIT, PITCH_LIMIT, r.pitch + dy * DRAG_SENS),
    }));
  };
  const onStagePointerEnd = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDragging(false);
  };

  // ── keyboard parity: the Reset-view control rotates with arrows, Home/click resets ──
  const onOrbitKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
    const { key } = event;
    let next: { yaw: number; pitch: number } | undefined;
    if (key === 'ArrowLeft') next = { yaw: rot.yaw - KEY_STEP, pitch: rot.pitch };
    else if (key === 'ArrowRight') next = { yaw: rot.yaw + KEY_STEP, pitch: rot.pitch };
    else if (key === 'ArrowUp')
      next = { yaw: rot.yaw, pitch: clamp(-PITCH_LIMIT, PITCH_LIMIT, rot.pitch - KEY_STEP) };
    else if (key === 'ArrowDown')
      next = { yaw: rot.yaw, pitch: clamp(-PITCH_LIMIT, PITCH_LIMIT, rot.pitch + KEY_STEP) };
    else if (key === 'Home') next = resetRotation;
    if (next) {
      event.preventDefault();
      setRot(next);
    }
  };

  // ── roving tabindex over the nodes (TalentTree model) ──
  const moveFocus = (id: string): void => {
    setRovingId(id);
    select(id);
    nodeEls.current.get(id)?.focus();
  };

  const navTarget = (idx: number, key: string): string | undefined => {
    const n = S.items.length;
    if (key === 'ArrowLeft') return idx > 0 ? S.items[idx - 1].id : undefined;
    if (key === 'ArrowRight') return idx < n - 1 ? S.items[idx + 1].id : undefined;
    if (key === 'Home') return S.items[0]?.id;
    if (key === 'End') return S.items[n - 1]?.id;
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      // Jump to the adjacent group RUN's first member (in item order).
      const dir = key === 'ArrowDown' ? 1 : -1;
      const from = S.items[idx].groupIdx;
      for (let j = idx + dir; j >= 0 && j < n; j += dir) {
        if (S.items[j].groupIdx !== from) {
          const target = S.items[j].groupIdx;
          let first = j;
          while (first + dir >= 0 && first + dir < n && S.items[first + dir].groupIdx === target)
            first += dir;
          return S.items[dir === 1 ? j : first].id;
        }
      }
      return undefined;
    }
    return undefined;
  };

  const onNodeKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, idx: number): void => {
    const { key } = event;
    if (
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === 'Home' ||
      key === 'End'
    ) {
      const target = navTarget(idx, key);
      if (target !== undefined) {
        event.preventDefault();
        event.stopPropagation();
        moveFocus(target);
      }
    }
  };

  // ── projection (per render — rotation is plain state) ──
  const projected = useMemo(
    () =>
      positions.map((p) => {
        const r = rotateYawPitch(p, rot.yaw, rot.pitch);
        const persp = perspectiveScale(r[2], NEBULA_CAMERA);
        return {
          sx: clamp(PAD, W - PAD, W / 2 + r[0] * R * persp),
          sy: clamp(PAD, H - PAD, H / 2 - r[1] * R * persp),
          depth: clamp(0, 1, (persp - MIN_PERSP) / (MAX_PERSP - MIN_PERSP)),
        };
      }),
    [positions, rot],
  );

  const selectedIdx = S.items.findIndex((it) => it.id === selectedId);
  const selected = selectedIdx >= 0 ? S.items[selectedIdx] : undefined;

  const drawnLinks =
    showEdges === 'none'
      ? []
      : showEdges === 'all'
        ? S.links
        : S.links.filter((l) => l.a === selectedIdx || l.b === selectedIdx);

  // Group clouds: projected centroid + spread of members (decorative tinted glow).
  const clouds = S.groups
    .map((g, gi) => {
      const members = S.items.map((it, i) => (it.groupIdx === gi ? i : -1)).filter((i) => i >= 0);
      if (!members.length) return undefined;
      const cxm = members.reduce((a, i) => a + projected[i].sx, 0) / members.length;
      const cym = members.reduce((a, i) => a + projected[i].sy, 0) / members.length;
      const spread = Math.max(
        ...members.map((i) => Math.hypot(projected[i].sx - cxm, projected[i].sy - cym)),
      );
      return { gi, tone: g.tone, cx: cxm, cy: cym, r: clamp(56, 190, spread + 48) };
    })
    .filter((c): c is NonNullable<typeof c> => c !== undefined);

  const tabbableId = S.items.some((it) => it.id === rovingId)
    ? rovingId
    : (selected?.id ?? S.items[0]?.id);

  const groupLabelOf = (it: CleanItem): string | undefined =>
    it.groupIdx >= 0 ? S.groups[it.groupIdx].label : undefined;

  return (
    <div className={cx('tcl-nebula', className)}>
      {(data.brand || data.code || data.title || data.caption) && (
        <div className="tcl-nebula__head">
          {data.brand && <span className="tcl-nebula__brand">{data.brand}</span>}
          {data.code && <span className="tcl-nebula__code">{data.code}</span>}
          {data.title && <span className="tcl-nebula__title">{data.title}</span>}
          {data.caption && <span className="tcl-nebula__caption">{data.caption}</span>}
        </div>
      )}

      {S.items.length === 0 ? (
        <p className="tcl-nebula__empty">No concepts to display.</p>
      ) : (
        <>
          <div
            className={cx('tcl-nebula__stage', dragging && 'is-dragging')}
            onPointerDown={onStagePointerDown}
            onPointerMove={onStagePointerMove}
            onPointerUp={onStagePointerEnd}
            onPointerCancel={onStagePointerEnd}
          >
            <VizOverlay
              label={data.title ? `${data.title} — concept map` : 'Concept map'}
              viewBox={{ w: W, h: H }}
              edges={
                <>
                  <defs>
                    {clouds.map((c) => (
                      <radialGradient key={c.gi} id={`${gradientId}-cloud-${c.gi}`}>
                        <stop
                          offset="0%"
                          style={{ stopColor: toneVar(c.tone) }}
                          stopOpacity="0.16"
                        />
                        <stop
                          offset="72%"
                          style={{ stopColor: toneVar(c.tone) }}
                          stopOpacity="0.06"
                        />
                        <stop
                          offset="100%"
                          style={{ stopColor: toneVar(c.tone) }}
                          stopOpacity="0"
                        />
                      </radialGradient>
                    ))}
                  </defs>
                  {clouds.map((c) => (
                    <circle
                      key={c.gi}
                      cx={c.cx}
                      cy={c.cy}
                      r={c.r}
                      fill={`url(#${gradientId}-cloud-${c.gi})`}
                    />
                  ))}
                  {drawnLinks.map((l) => {
                    const pa = projected[l.a];
                    const pb = projected[l.b];
                    const nearness = (pa.depth + pb.depth) / 2;
                    return (
                      <line
                        // index-pair key — unique by sanitize's pair dedup; item ids may contain '->'
                        key={`${l.a}|${l.b}`}
                        className={cx(
                          'tcl-nebula__edge',
                          (l.a === selectedIdx || l.b === selectedIdx) && 'is-selected',
                        )}
                        x1={pa.sx}
                        y1={pa.sy}
                        x2={pb.sx}
                        y2={pb.sy}
                        style={{ opacity: 0.3 + 0.55 * nearness }}
                      />
                    );
                  })}
                </>
              }
              nodes={S.items.map((it, i) => {
                const p = projected[i];
                const isSelected = it.id === selectedId;
                const groupLabel = groupLabelOf(it);
                return (
                  <button
                    key={it.id}
                    ref={(el) => {
                      if (el) nodeEls.current.set(it.id, el);
                      else nodeEls.current.delete(it.id);
                    }}
                    type="button"
                    className={cx('tcl-nebula__node', isSelected && 'is-selected')}
                    style={vars(
                      {
                        left: `${(p.sx / W) * 100}%`,
                        top: `${(p.sy / H) * 100}%`,
                        '--nebula-depth': p.depth.toFixed(3),
                        '--nebula-size': (0.85 + it.weight * 0.4).toFixed(3),
                        '--node': toneVar(it.tone),
                      },
                      // selection lifts above nearer nodes so the ring is never buried
                      { zIndex: 100 + Math.round(p.depth * 100) + (isSelected ? 200 : 0) },
                    )}
                    tabIndex={it.id === tabbableId ? 0 : -1}
                    aria-pressed={isSelected}
                    aria-label={groupLabel ? `${it.label}, ${groupLabel}` : it.label}
                    onClick={() => {
                      setRovingId(it.id);
                      select(it.id);
                    }}
                    onKeyDown={(event) => onNodeKeyDown(event, i)}
                  >
                    <span className="tcl-nebula__node-dot" aria-hidden="true" />
                    <span className="tcl-nebula__node-label">{it.label}</span>
                  </button>
                );
              })}
            />
          </div>

          <div className="tcl-nebula__controls">
            <button
              type="button"
              className="tcl-nebula__control"
              onClick={() => setRot(resetRotation)}
              onKeyDown={onOrbitKeyDown}
              aria-label="Reset view; arrow keys rotate while focused, Home resets"
            >
              Reset view
            </button>
            {autoOrbit && !reducedMotion && (
              <button
                type="button"
                className="tcl-nebula__control"
                aria-pressed={orbitPaused}
                onClick={() => setOrbitPaused((p) => !p)}
              >
                Pause orbit
              </button>
            )}
            <p className="tcl-nebula__hint">Drag the space to rotate · closeness = relatedness</p>
          </div>

          {S.groups.length > 0 && (
            <div className="tcl-nebula__legend">
              {S.groups.map((g) => (
                <span key={g.key} className="tcl-nebula__legend-item">
                  <span
                    className="tcl-nebula__legend-dot"
                    style={vars({ '--node': toneVar(g.tone) })}
                    aria-hidden="true"
                  />
                  {g.label}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <div className="tcl-nebula__inspector">
        <div className="tcl-nebula__inspector-live" aria-live="polite" aria-atomic="true">
          {selected ? (
            <>
              <p className="tcl-nebula__inspector-title">
                {selected.label}
                {groupLabelOf(selected) && (
                  <span className="tcl-nebula__inspector-sub"> · {groupLabelOf(selected)}</span>
                )}
              </p>
              {selected.summary && <p className="tcl-nebula__inspector-note">{selected.summary}</p>}
              {neighbors[selectedIdx]?.length > 0 && (
                <p className="tcl-nebula__inspector-neighbors">
                  Closest:{' '}
                  {neighbors[selectedIdx]
                    .map(
                      (nb) =>
                        `${S.items[nb.idx].label} (${nb.closeness.toFixed(2)}${
                          nb.kind ? `, ${nb.kind}` : ''
                        })`,
                    )
                    .join(' · ')}
                </p>
              )}
            </>
          ) : (
            <p className="tcl-nebula__inspector-hint">Select a concept to inspect it.</p>
          )}
        </div>
      </div>
    </div>
  );
}
