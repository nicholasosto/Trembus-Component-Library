import { useMemo } from 'react';
import { cx, vars, toneVar, VizOverlay, useControllableSelection } from '../../internal';
import type { VizTone } from '../../internal';
import './Strata.css';

/** Tone vocabulary for strata arcs — the shared @trembus/tokens ontology. */
export type StrataTone = VizTone;

export interface StrataPrinciple {
  /** REQUIRED and unique — `restsOn` references it. */
  id: string;
  /** Arc label — the drawn text + the accessible name. */
  label: string;
  /**
   * Ids of the MORE-FUNDAMENTAL principles this one is built from. Omitted or
   * empty → bedrock (the innermost ring). Referencing an id that does not exist
   * in `principles` auto-materializes a dashed GAP arc in the ring beneath —
   * an undiscovered support surfaced as an opportunity, never an error.
   */
  restsOn?: string[];
  /** Author-proposed but not yet established — rendered as a dashed arc. */
  conjecture?: boolean;
  /** Explicit tone (default: the accent, fading with distance from bedrock). */
  tone?: StrataTone;
  /** Secondary label folded into the accessible name + inspector. */
  sub?: string;
  /** Inspector detail shown when selected. */
  note?: string;
}

export interface StrataContract {
  brand?: string;
  code?: string;
  /** The scoped domain the strata decompose — drawn in the center hub. */
  title?: string;
  caption?: string;
  principles: StrataPrinciple[];
}

export interface StrataProps {
  data: StrataContract;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

// ── layout geometry (viewBox units; buttons positioned by % over it) ──
const S = 720;
const C = S / 2;
const HUB_R = 86;
const PAD = 12;
const R_MAX = C - PAD;
const RING_GAP = 6;
const T_MAX = 96;
const ARC_CAP = 72; // max angular width (deg) for derived rings — sparse rings keep open sky

type ArcKind = 'principle' | 'conjecture' | 'gap';
type Adjacency = Map<string, Set<string>>;

interface Ent {
  id: string;
  label: string;
  sub?: string;
  note?: string;
  kind: ArcKind;
  tone?: StrataTone;
  depth: number;
  inputIdx: number;
  desired?: number;
  center: number;
  width: number;
  placed: boolean;
}

interface LaidArc {
  id: string;
  label: string;
  sub?: string;
  note?: string;
  kind: ArcKind;
  tone?: StrataTone;
  depth: number;
  d: string;
  cx: number;
  cy: number;
  labelShown: boolean;
  mix: number;
}

interface LaidLink {
  /** The dependent (outer) principle. */
  from: string;
  /** The foundation (inner) principle or gap. */
  to: string;
  toGap: boolean;
  d: string;
}

interface Layout {
  arcs: LaidArc[];
  links: LaidLink[];
  /** foundation → dependents (the load). */
  fwd: Adjacency;
  /** dependent → foundations (restsOn). */
  rev: Adjacency;
  labelOf: Map<string, string>;
  maxDepth: number;
  ringRadii: number[];
  hasConjecture: boolean;
  hasGap: boolean;
}

const norm180 = (a: number): number => {
  let x = a % 360;
  if (x < -180) x += 360;
  if (x >= 180) x -= 360;
  return x;
};

/** deg is clockwise from 12 o'clock. */
function polar(r: number, deg: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: C + r * Math.cos(rad), y: C + r * Math.sin(rad) };
}

function sectorPath(r0: number, r1: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const p1 = polar(r1, a0);
  const p2 = polar(r1, a1);
  const p3 = polar(r0, a1);
  const p4 = polar(r0, a0);
  const f = (v: number): string => v.toFixed(2);
  return (
    `M${f(p1.x)},${f(p1.y)} A${f(r1)},${f(r1)} 0 ${large} 1 ${f(p2.x)},${f(p2.y)} ` +
    `L${f(p3.x)},${f(p3.y)} A${f(r0)},${f(r0)} 0 ${large} 0 ${f(p4.x)},${f(p4.y)} Z`
  );
}

/** Circular (vector) mean — safe across the 0°/360° wrap; undefined for no anchors. */
function vectorMeanDeg(angles: number[]): number | undefined {
  if (!angles.length) return undefined;
  let sx = 0;
  let sy = 0;
  for (const a of angles) {
    const rad = (a * Math.PI) / 180;
    sx += Math.cos(rad);
    sy += Math.sin(rad);
  }
  if (Math.abs(sx) < 1e-9 && Math.abs(sy) < 1e-9) return angles[0];
  return (Math.atan2(sy, sx) * 180) / Math.PI;
}

/** Reachable closure from `start` along `adj`, EXCLUDING `start` (cycle-safe). */
function closure(start: string, adj: Adjacency): Set<string> {
  const seen = new Set<string>([start]);
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const nx of adj.get(cur) ?? []) {
      if (!seen.has(nx)) {
        seen.add(nx);
        stack.push(nx);
      }
    }
  }
  seen.delete(start);
  return seen;
}

function buildLayout(principles: StrataPrinciple[]): Layout {
  // 1. dedup (first id wins; drop unidentified — ids are REQUIRED, restsOn references them).
  const byId = new Map<string, StrataPrinciple>();
  for (const p of principles) {
    if (p.id && !byId.has(p.id)) byId.set(p.id, p);
  }
  const valid = [...byId.values()];

  const fwd: Adjacency = new Map();
  const rev: Adjacency = new Map();
  const labelOf = new Map<string, string>();
  if (!valid.length) {
    return {
      arcs: [],
      links: [],
      fwd,
      rev,
      labelOf,
      maxDepth: 0,
      ringRadii: [],
      hasConjecture: false,
      hasGap: false,
    };
  }

  // 2. sanitize restsOn (drop self-refs + dups); split real parents from missing refs.
  const realParents = new Map<string, string[]>();
  const missingRefs = new Map<string, Set<string>>(); // missing id → its referencers
  const declared = new Map<string, number>();
  for (const p of valid) {
    const seen = new Set<string>();
    const real: string[] = [];
    for (const r of p.restsOn ?? []) {
      if (!r || r === p.id || seen.has(r)) continue;
      seen.add(r);
      if (byId.has(r)) real.push(r);
      else (missingRefs.get(r) ?? missingRefs.set(r, new Set()).get(r)!).add(p.id);
    }
    realParents.set(p.id, real);
    declared.set(p.id, seen.size);
  }

  // 3. depth = dependency layering (longest support chain from bedrock). Cycle-safe:
  //    an edge back into a node still being computed is skipped (deterministic,
  //    never hangs). A principle whose every support is missing or cyclic still
  //    DECLARED `restsOn`, so it floors at depth 1 — derived-from-unknown, never
  //    mistaken for bedrock.
  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  const depthOf = (id: string): number => {
    const memo = depth.get(id);
    if (memo !== undefined) return memo;
    visiting.add(id);
    let d = 0;
    let sawParent = false;
    for (const par of realParents.get(id) ?? []) {
      if (visiting.has(par)) continue;
      sawParent = true;
      d = Math.max(d, depthOf(par) + 1);
    }
    if (!sawParent && (declared.get(id) ?? 0) > 0) d = 1;
    visiting.delete(id);
    depth.set(id, d);
    return d;
  };
  for (const p of valid) depthOf(p.id);

  // 4. entries: real principles + auto-materialized GAP arcs. A gap floats to the
  //    ring directly beneath its shallowest referencer — "the missing support is at
  //    least this fundamental" — never presumed bedrock.
  let idx = 0;
  const ents: Ent[] = valid.map((p) => ({
    id: p.id,
    label: p.label,
    sub: p.sub,
    note: p.note,
    kind: p.conjecture ? ('conjecture' as const) : ('principle' as const),
    tone: p.tone,
    depth: depth.get(p.id)!,
    inputIdx: idx++,
    center: 0,
    width: 0,
    placed: false,
  }));
  for (const [gid, refs] of missingRefs) {
    const gDepth = Math.max(0, Math.min(...[...refs].map((r) => depth.get(r)!)) - 1);
    ents.push({
      id: gid,
      label: gid,
      kind: 'gap',
      depth: gDepth,
      inputIdx: idx++,
      center: 0,
      width: 0,
      placed: false,
    });
  }
  const entOf = new Map(ents.map((e) => [e.id, e]));
  for (const e of ents) labelOf.set(e.id, e.label);

  // 5. adjacency over ALL support edges (including edges into gaps).
  const addEdge = (foundation: string, dependent: string): void => {
    (fwd.get(foundation) ?? fwd.set(foundation, new Set()).get(foundation)!).add(dependent);
    (rev.get(dependent) ?? rev.set(dependent, new Set()).get(dependent)!).add(foundation);
  };
  for (const p of valid) for (const par of realParents.get(p.id)!) addEdge(par, p.id);
  for (const [gid, refs] of missingRefs) for (const r of refs) addEdge(gid, r);

  // 6. rings. No thickness floor — a deep map compresses its rings but NEVER
  //    escapes the plot box (the forced-domains-must-clamp gotcha); labels
  //    degrade first (labelShown), geometry stays valid via the shrinking gap.
  const maxDepth = Math.max(...ents.map((e) => e.depth));
  const t = Math.min(T_MAX, (R_MAX - HUB_R) / (maxDepth + 1));
  const gap = Math.min(RING_GAP, t / 2);
  const bandR = (k: number): [number, number] => [
    HUB_R + k * t + gap / 2,
    HUB_R + (k + 1) * t - gap / 2,
  ];
  const ringRadii = Array.from({ length: maxDepth + 2 }, (_, k) => HUB_R + k * t);
  const rings: Ent[][] = Array.from({ length: maxDepth + 1 }, () => []);
  for (const e of ents) rings[e.depth].push(e);

  // 7. angular placement. Bedrock fills the circle; derived rings sort members over
  //    the barycenter of their supports (vector mean — wrap-safe) into an equal-slice
  //    grid, so arcs settle NEAR their foundations but can never overlap.
  const placeRing = (ring: Ent[], isBedrock: boolean): void => {
    const n = ring.length;
    if (!n) return;
    const slice = 360 / n;
    const padA = Math.min(3, slice * 0.18);
    const width = isBedrock ? slice - padA : Math.min(slice - padA, ARC_CAP);
    const sorted = [...ring].sort((a, b) => {
      if (a.desired === undefined && b.desired === undefined) return a.inputIdx - b.inputIdx;
      if (a.desired === undefined) return 1;
      if (b.desired === undefined) return -1;
      const na = ((a.desired % 360) + 360) % 360;
      const nb = ((b.desired % 360) + 360) % 360;
      return na - nb || a.inputIdx - b.inputIdx;
    });
    let offSum = 0;
    let offN = 0;
    sorted.forEach((m, i) => {
      if (m.desired === undefined) return;
      offSum += norm180(m.desired - (slice * i + slice / 2));
      offN++;
    });
    const offset = offN ? offSum / offN : -90;
    sorted.forEach((m, i) => {
      m.center = offset + slice * i + slice / 2;
      m.width = width;
      m.placed = true;
    });
  };

  const anchorsOf = (e: Ent): number[] => {
    const ids = e.kind === 'gap' ? fwd.get(e.id) : rev.get(e.id);
    return [...(ids ?? [])]
      .map((id) => entOf.get(id))
      .filter((a): a is Ent => a !== undefined && a.placed)
      .map((a) => a.center);
  };

  // Pass A (inside-out; a gap has no placed anchors yet), then pass B refines every
  // derived ring — gaps pull under their referencers, reals re-settle over parents.
  for (let k = 0; k <= maxDepth; k++) {
    if (k > 0) for (const e of rings[k]) e.desired = vectorMeanDeg(anchorsOf(e));
    placeRing(rings[k], k === 0);
  }
  for (let k = 1; k <= maxDepth; k++) {
    for (const e of rings[k]) e.desired = vectorMeanDeg(anchorsOf(e)) ?? e.desired;
    placeRing(rings[k], false);
  }

  // 8. arcs + centroids + labels (label only when the chord can hold it — the
  //    button + inspector always carry the full name).
  const arcs: LaidArc[] = ents.map((e) => {
    const [r0, r1] = bandR(e.depth);
    const midR = (r0 + r1) / 2;
    const pt = polar(midR, e.center);
    const chord = (e.width * Math.PI * midR) / 180;
    const text = e.kind === 'gap' ? `${e.label}?` : e.label;
    return {
      id: e.id,
      label: e.label,
      sub: e.sub,
      note: e.note,
      kind: e.kind,
      tone: e.tone,
      depth: e.depth,
      d: sectorPath(r0, r1, e.center - e.width / 2, e.center + e.width / 2),
      cx: pt.x,
      cy: pt.y,
      labelShown: r1 - r0 >= 16 && chord >= text.length * 6.6 + 12,
      mix: Math.max(12, 32 - e.depth * 5),
    };
  });

  // 9. support connectors: dependent's inner edge → foundation's outer edge
  //    (revealed on selection; the inspector is the accessible channel). A cycle
  //    inverts the layering, so pick each attach edge by relative depth — the
  //    connector spans the space BETWEEN the two bands, never crosses through one.
  const links: LaidLink[] = [];
  for (const [dep, founds] of rev) {
    const de = entOf.get(dep)!;
    for (const fid of founds) {
      const fe = entOf.get(fid)!;
      const inverted = fe.depth > de.depth;
      const from = polar(bandR(de.depth)[inverted ? 1 : 0], de.center);
      const to = polar(bandR(fe.depth)[inverted ? 0 : 1], fe.center);
      links.push({
        from: dep,
        to: fid,
        toGap: fe.kind === 'gap',
        d: `M${from.x.toFixed(2)},${from.y.toFixed(2)} L${to.x.toFixed(2)},${to.y.toFixed(2)}`,
      });
    }
  }

  return {
    arcs,
    links,
    fwd,
    rev,
    labelOf,
    maxDepth,
    ringRadii,
    hasConjecture: ents.some((e) => e.kind === 'conjecture'),
    hasGap: ents.some((e) => e.kind === 'gap'),
  };
}

const KIND_NAME: Record<ArcKind, string | undefined> = {
  principle: undefined,
  conjecture: 'conjecture',
  gap: 'undiscovered support',
};

/**
 * Strata — a concentric first-principles visualization: radial depth encodes
 * dependency layering (bedrock axioms innermost; anything that `restsOn` them
 * layers outward), so fundamentality is perceivable at a glance. Lead job is
 * reveal-state; afford/acknowledge are real — every arc is a focusable button
 * (the a11y spine) over the decorative SVG, and selecting one highlights its
 * foundations (inward cone) and its load (everything that would collapse with
 * it), with an aria-live inspector naming both. Supports referenced but never
 * articulated auto-materialize as dashed GAP arcs — discovery opportunities,
 * never errors.
 */
export function Strata({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: StrataProps) {
  const [selectedId, select] = useControllableSelection(selProp, defaultSelectedId, onSelect);

  const { arcs, links, fwd, rev, labelOf, maxDepth, ringRadii, hasConjecture, hasGap } = useMemo(
    () => buildLayout(data.principles),
    [data.principles],
  );

  // Selection cones: foundations (toward bedrock) + load (everything resting on it).
  const cones = useMemo(() => {
    if (!selectedId || !arcs.some((a) => a.id === selectedId)) {
      return { down: new Set<string>(), up: new Set<string>(), all: new Set<string>() };
    }
    const down = closure(selectedId, rev); // foundations beneath
    const up = closure(selectedId, fwd); // the load above
    return { down, up, all: new Set<string>([selectedId, ...down, ...up]) };
  }, [selectedId, arcs, fwd, rev]);

  const hasSelection = cones.all.size > 0;
  const selected = arcs.find((a) => a.id === selectedId);

  const nameIds = (ids: Set<string> | undefined): string =>
    [...(ids ?? [])].map((id) => labelOf.get(id) ?? id).join(', ');
  const restsOnText = selected ? nameIds(rev.get(selected.id)) : '';
  const supportsText = selected ? nameIds(fwd.get(selected.id)) : '';

  const arcName = (a: LaidArc): string => {
    const bits = [a.label];
    if (a.sub) bits.push(a.sub);
    bits.push(`layer ${a.depth}`);
    const kind = KIND_NAME[a.kind];
    if (kind) bits.push(kind);
    return bits.join(', ');
  };

  return (
    <div className={cx('tcl-strata', className)}>
      {(data.brand || data.code || data.title || data.caption) && (
        <div className="tcl-strata__head">
          {data.brand && <span className="tcl-strata__brand">{data.brand}</span>}
          {data.code && <span className="tcl-strata__code">{data.code}</span>}
          {data.title && <span className="tcl-strata__title">{data.title}</span>}
          {data.caption && <span className="tcl-strata__caption">{data.caption}</span>}
        </div>
      )}

      {arcs.length === 0 ? (
        <p className="tcl-strata__empty">No principles to display.</p>
      ) : (
        <VizOverlay
          className="tcl-strata__canvas"
          label={data.title ? `${data.title} — first-principles strata` : 'First-principles strata'}
          viewBox={{ w: S, h: S }}
          edges={
            <>
              {ringRadii.map((r, i) => (
                <circle key={`ring:${i}`} className="tcl-strata__guide" cx={C} cy={C} r={r} />
              ))}
              <circle className="tcl-strata__hub" cx={C} cy={C} r={HUB_R - RING_GAP} />
              {arcs.map((a) => {
                const onCone = cones.all.has(a.id);
                return (
                  <path
                    key={a.id}
                    data-arc={a.id}
                    data-kind={a.kind}
                    className={cx(
                      'tcl-strata__arc',
                      a.id === selectedId && 'is-selected',
                      onCone && a.id !== selectedId && 'is-cone',
                      hasSelection && !onCone && 'is-muted',
                    )}
                    style={vars({
                      '--arc': a.tone ? toneVar(a.tone) : 'var(--tcl-accent)',
                      '--mix': `${a.mix}%`,
                      '--mix-hi': `${Math.min(60, a.mix + 22)}%`,
                    })}
                    d={a.d}
                  />
                );
              })}
              {links.map((l) => {
                const active = hasSelection && (l.from === selectedId || l.to === selectedId);
                return (
                  <path
                    key={JSON.stringify([l.from, l.to])}
                    data-link={`${l.from}->${l.to}`}
                    className={cx('tcl-strata__link', active && 'is-active', l.toGap && 'is-gap')}
                    d={l.d}
                  />
                );
              })}
              {arcs
                .filter((a) => a.labelShown)
                .map((a) => (
                  <text
                    key={`label:${a.id}`}
                    className={cx(
                      'tcl-strata__arc-label',
                      hasSelection && !cones.all.has(a.id) && 'is-muted',
                    )}
                    data-kind={a.kind}
                    x={a.cx}
                    y={a.cy + 14}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {a.kind === 'gap' ? `${a.label}?` : a.label}
                  </text>
                ))}
            </>
          }
          nodes={
            <>
              {data.title && (
                <div className="tcl-strata__hub-label" aria-hidden="true">
                  {data.title}
                </div>
              )}
              {arcs.map((a) => {
                const isSelected = a.id === selectedId;
                const onCone = cones.all.has(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={cx(
                      'tcl-strata__node',
                      isSelected && 'is-selected',
                      onCone && !isSelected && 'is-cone',
                    )}
                    style={vars({
                      left: `${(a.cx / S) * 100}%`,
                      top: `${(a.cy / S) * 100}%`,
                      '--node': a.tone ? toneVar(a.tone) : 'var(--tcl-accent)',
                    })}
                    data-kind={a.kind}
                    data-depth={a.depth}
                    aria-pressed={isSelected}
                    aria-label={arcName(a)}
                    onClick={() => select(a.id)}
                  >
                    {a.kind === 'gap' && <span aria-hidden="true">?</span>}
                  </button>
                );
              })}
            </>
          }
        />
      )}

      {(hasConjecture || hasGap) && (
        <ul className="tcl-strata__legend">
          <li className="tcl-strata__legend-item">
            <span className="tcl-strata__swatch" data-kind="principle" aria-hidden="true" />
            Established
          </li>
          {hasConjecture && (
            <li className="tcl-strata__legend-item">
              <span className="tcl-strata__swatch" data-kind="conjecture" aria-hidden="true" />
              Conjecture
            </li>
          )}
          {hasGap && (
            <li className="tcl-strata__legend-item">
              <span className="tcl-strata__swatch" data-kind="gap" aria-hidden="true" />
              Undiscovered gap
            </li>
          )}
        </ul>
      )}

      <div className="tcl-strata__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-strata__inspector-title">
              {selected.label}
              {selected.sub && <span className="tcl-strata__inspector-sub"> · {selected.sub}</span>}
              {KIND_NAME[selected.kind] && (
                <span className="tcl-strata__inspector-kind"> · {KIND_NAME[selected.kind]}</span>
              )}
            </p>
            <p className="tcl-strata__inspector-flow">
              Layer {selected.depth} of {maxDepth}
              {selected.depth === 0 && selected.kind !== 'gap' && ' — bedrock'} · Foundations:{' '}
              {cones.down.size} · Load: {cones.up.size}
            </p>
            {restsOnText && <p className="tcl-strata__inspector-conn">Rests on: {restsOnText}</p>}
            <p className="tcl-strata__inspector-conn">
              {supportsText ? `Supports: ${supportsText}` : 'Supports: nothing yet.'}
            </p>
            {selected.kind === 'gap' && (
              <p className="tcl-strata__inspector-note">
                Referenced but never articulated — an opening for discovery.
              </p>
            )}
            {selected.kind === 'conjecture' && (
              <p className="tcl-strata__inspector-note">Proposed, not yet established.</p>
            )}
            {selected.note && <p className="tcl-strata__inspector-note">{selected.note}</p>}
          </>
        ) : (
          <p className="tcl-strata__inspector-hint">
            Select a principle to trace its foundations and its load.
          </p>
        )}
      </div>
    </div>
  );
}
