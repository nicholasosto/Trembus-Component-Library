import dagre from '@dagrejs/dagre';
import type { VizTone } from './tone';

/**
 * layoutNested — the shared semantic-zoom layout engine for nested node-link viz.
 *
 * Given a FLAT node list (nesting derived from `parentId`), a flat edge list, and
 * the currently-focused container (`focusId`, `undefined` = root level), it lays
 * out ONLY that level's direct children with dagre and aggregates edges the C4 way:
 * a connection between two deep components shows up as a single edge between the
 * two top-level containers they live in. Edges that cross the level boundary (one
 * endpoint outside the focus) are summarized as external in/out links for the
 * inspector — the accessible "membrane" channel — rather than drawn as dangling
 * stubs. Drilling = re-running this with a new `focusId` (a frame flip, not a zoom).
 *
 * Pure + guarded: dedups ids (first wins), breaks parent cycles to root, never
 * throws, and clamps every coord into the padded plot box.
 */

export type PortDirection = 'provided' | 'required';

export interface NestedNodeInput {
  id: string;
  label: string;
  parentId?: string | null;
  kind?: string;
  tone?: VizTone;
  color?: string;
  sub?: string;
  note?: string;
  /** Explicit glyph name (overrides the kind→glyph default). */
  icon?: string;
}

export interface NestedEdgeInput {
  from: string;
  to: string;
  label?: string;
  kind?: string;
  tone?: VizTone;
  dashed?: boolean;
}

export interface NestedPortInput {
  id: string;
  nodeId: string;
  label: string;
  direction?: PortDirection;
  tone?: VizTone;
}

export interface LaidPort {
  id: string;
  label: string;
  direction: PortDirection;
  tone?: VizTone;
}

export interface LaidNestedNode {
  id: string;
  label: string;
  sub?: string;
  note?: string;
  kind?: string;
  tone: VizTone;
  color?: string;
  /** Explicit glyph name passthrough (the consumer applies any kind default). */
  icon?: string;
  /** A container has children to drill into; a leaf does not. */
  variant: 'leaf' | 'container';
  /** Direct children count — the information-scent badge on a drill target. */
  childCount: number;
  ports: LaidPort[];
  /** True when this node has at least one connection that leaves the current level. */
  external: boolean;
  sx: number;
  sy: number;
}

export interface LaidNestedEdge {
  from: string;
  to: string;
  label?: string;
  tone?: VizTone;
  dashed?: boolean;
  d: string;
  midX: number;
  midY: number;
}

export interface NestedLayout {
  workingSet: LaidNestedNode[];
  edges: LaidNestedEdge[];
  /** root → focus chain (focus last). Empty at the root level. */
  breadcrumb: { id: string; label: string }[];
  /** Whether `focusId` names a real node (false → the focus was stale/removed). */
  focusExists: boolean;
  /** id → label for EVERY node (names external connections in the inspector). */
  labelOf: Map<string, string>;
  /** Intra-level adjacency (aggregated). */
  fwd: Map<string, Set<string>>;
  rev: Map<string, Set<string>>;
  /** Working-set node id → external node ids it links out to / in from. */
  extOut: Map<string, Set<string>>;
  extIn: Map<string, Set<string>>;
}

const W = 880;
const H = 560;
const PAD = 60;
const NODE_MIN_W = 120;
const NODE_MAX_W = 208;
const LEAF_H = 46;
const CONTAINER_H = 58;
const PORT_H = 16;
const MAX_SCALE = 1.5;
const TONE_CYCLE: VizTone[] = ['accent', 'info', 'success', 'warning', 'danger', 'neutral'];

function estWidth(label: string, sub?: string): number {
  const len = Math.max(label.length, sub ? sub.length : 0);
  return Math.min(NODE_MAX_W, Math.max(NODE_MIN_W, len * 7.4 + 36));
}

function addAdj(adj: Map<string, Set<string>>, a: string, b: string): void {
  (adj.get(a) ?? adj.set(a, new Set()).get(a)!).add(b);
}

export function layoutNested(
  nodesIn: NestedNodeInput[],
  edgesIn: NestedEdgeInput[],
  portsIn: NestedPortInput[],
  focusId: string | undefined,
  direction: 'TB' | 'LR' | 'BT' | 'RL',
): NestedLayout {
  const empty = (focusExists: boolean): NestedLayout => ({
    workingSet: [],
    edges: [],
    breadcrumb: [],
    focusExists,
    labelOf: new Map(),
    fwd: new Map(),
    rev: new Map(),
    extOut: new Map(),
    extIn: new Map(),
  });

  // 1. dedup nodes (first id wins; drop unidentified — ids never fall back to label).
  const byId = new Map<string, NestedNodeInput>();
  for (const n of nodesIn) if (n.id && !byId.has(n.id)) byId.set(n.id, n);
  const valid = [...byId.values()];
  const labelOf = new Map<string, string>(valid.map((n) => [n.id, n.label]));
  if (!valid.length) return empty(focusId === undefined);

  // 2. sanitized parent map — unknown parent → root; break parent cycles to root.
  const parentOf = new Map<string, string | null>();
  for (const n of valid) {
    const p = n.parentId && byId.has(n.parentId) ? n.parentId : null;
    parentOf.set(n.id, p);
  }
  for (const n of valid) {
    const seen = new Set<string>([n.id]);
    let p = parentOf.get(n.id) ?? null;
    while (p) {
      if (seen.has(p)) {
        parentOf.set(n.id, null);
        break;
      }
      seen.add(p);
      p = parentOf.get(p) ?? null;
    }
  }

  const focusExists = focusId === undefined || byId.has(focusId);
  if (!focusExists) return empty(false);

  // 3. children index + the working set (direct children of focus).
  const childrenOf = new Map<string, string[]>();
  for (const n of valid) {
    const p = parentOf.get(n.id) ?? null;
    if (p !== null) (childrenOf.get(p) ?? childrenOf.set(p, []).get(p)!).push(n.id);
  }
  const roots = valid.filter((n) => (parentOf.get(n.id) ?? null) === null).map((n) => n.id);
  const workingIds = focusId === undefined ? roots : (childrenOf.get(focusId) ?? []);
  const workingSetIds = new Set(workingIds);

  // 4. resolve any node id to its ancestor that sits in the working set (or undefined).
  const resolveCache = new Map<string, string | undefined>();
  const resolve = (id: string): string | undefined => {
    if (resolveCache.has(id)) return resolveCache.get(id);
    const seen = new Set<string>();
    let cur: string | null = id;
    while (cur && !seen.has(cur)) {
      if (workingSetIds.has(cur)) {
        resolveCache.set(id, cur);
        return cur;
      }
      seen.add(cur);
      cur = parentOf.get(cur) ?? null;
    }
    resolveCache.set(id, undefined);
    return undefined;
  };

  // 5. aggregate edges to the working-set level; collect cross-boundary links.
  const fwd = new Map<string, Set<string>>();
  const rev = new Map<string, Set<string>>();
  const extOut = new Map<string, Set<string>>();
  const extIn = new Map<string, Set<string>>();
  // Many deep edges can collapse onto ONE container→container pair. Accumulate the
  // constituents and keep a style only when it's UNANIMOUS — a label/tone shown on
  // an aggregate that actually mixes several relationships would be a lie, and a
  // single async link shouldn't make a mostly-sync aggregate read as dashed.
  const agg = new Map<
    string,
    { from: string; to: string; labels: Set<string>; tones: Set<VizTone>; dashedAll: boolean }
  >();
  const edgeKindTone = new Map<string, VizTone>();
  let eki = 0;
  for (const e of edgesIn) {
    if (!byId.has(e.from) || !byId.has(e.to)) continue;
    if (e.kind && !edgeKindTone.has(e.kind))
      edgeKindTone.set(e.kind, TONE_CYCLE[eki++ % TONE_CYCLE.length]);
    const rf = resolve(e.from);
    const rt = resolve(e.to);
    if (rf && rt) {
      if (rf === rt) continue; // internal to one container — invisible at this level
      const key = `${rf}->${rt}`;
      let acc = agg.get(key);
      if (!acc) {
        acc = { from: rf, to: rt, labels: new Set(), tones: new Set(), dashedAll: true };
        agg.set(key, acc);
        addAdj(fwd, rf, rt);
        addAdj(rev, rt, rf);
      }
      const tone = e.tone ?? (e.kind ? edgeKindTone.get(e.kind) : undefined);
      if (e.label) acc.labels.add(e.label);
      if (tone) acc.tones.add(tone);
      acc.dashedAll = acc.dashedAll && e.dashed === true;
    } else if (rf && !rt) {
      addAdj(extOut, rf, e.to);
    } else if (!rf && rt) {
      addAdj(extIn, rt, e.from);
    }
  }

  if (!workingIds.length) {
    return { ...empty(true), breadcrumb: buildCrumb(focusId, parentOf, labelOf), labelOf };
  }

  // 6. kind → tone (first-seen) for nodes without an explicit tone.
  const kindTone = new Map<string, VizTone>();
  let ki = 0;
  for (const id of workingIds) {
    const k = byId.get(id)!.kind;
    if (k && !kindTone.has(k)) kindTone.set(k, TONE_CYCLE[ki++ % TONE_CYCLE.length]);
  }

  // 7. ports grouped by node (only for working-set nodes).
  const portsByNode = new Map<string, LaidPort[]>();
  for (const p of portsIn) {
    if (!workingSetIds.has(p.nodeId) || !p.id) continue;
    const list = portsByNode.get(p.nodeId) ?? portsByNode.set(p.nodeId, []).get(p.nodeId)!;
    list.push({ id: p.id, label: p.label, direction: p.direction ?? 'provided', tone: p.tone });
  }

  // 8. dagre layout of the working set + aggregated edges (guarded — degrade, never throw).
  try {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: direction, nodesep: 38, ranksep: 64, marginx: 8, marginy: 8 });
    g.setDefaultEdgeLabel(() => ({}));
    for (const id of workingIds) {
      const n = byId.get(id)!;
      const hasPorts = (portsByNode.get(id)?.length ?? 0) > 0;
      const isContainer = (childrenOf.get(id)?.length ?? 0) > 0;
      g.setNode(id, {
        width: estWidth(n.label, n.sub),
        height: (isContainer ? CONTAINER_H : LEAF_H) + (hasPorts ? PORT_H : 0),
      });
    }
    for (const a of agg.values()) g.setEdge(a.from, a.to);
    dagre.layout(g);

    const gl = g.graph() as { width?: number; height?: number };
    const dW = gl.width || 1;
    const dH = gl.height || 1;
    const scale = Math.min((W - 2 * PAD) / dW, (H - 2 * PAD) / dH, MAX_SCALE);
    const offX = (W - dW * scale) / 2;
    const offY = (H - dH * scale) / 2;
    const sx = (x: number): number => Math.min(W - PAD, Math.max(PAD, offX + x * scale));
    const sy = (y: number): number => Math.min(H - PAD, Math.max(PAD, offY + y * scale));

    const workingSet: LaidNestedNode[] = workingIds.map((id) => {
      const n = byId.get(id)!;
      const dn = g.node(id) as { x: number; y: number };
      const childCount = childrenOf.get(id)?.length ?? 0;
      const tone = n.tone ?? (n.kind ? kindTone.get(n.kind)! : 'neutral');
      return {
        id,
        label: n.label,
        sub: n.sub,
        note: n.note,
        kind: n.kind,
        tone,
        color: n.color,
        icon: n.icon,
        variant: childCount > 0 ? 'container' : 'leaf',
        childCount,
        ports: portsByNode.get(id) ?? [],
        external: extOut.has(id) || extIn.has(id),
        sx: sx(dn.x),
        sy: sy(dn.y),
      };
    });

    const edges: LaidNestedEdge[] = [...agg.values()].map((a) => {
      const de = g.edge({ v: a.from, w: a.to }) as { points?: Array<{ x: number; y: number }> };
      const pts = (de?.points ?? []).map((p) => ({ x: sx(p.x), y: sy(p.y) }));
      const d = pts.length ? `M${pts.map((p) => `${p.x},${p.y}`).join(' L')}` : '';
      const mid = pts.length ? pts[Math.floor(pts.length / 2)] : { x: W / 2, y: H / 2 };
      return {
        from: a.from,
        to: a.to,
        // unanimous-only: a mixed aggregate drops its label/tone rather than mislead
        label: a.labels.size === 1 ? [...a.labels][0] : undefined,
        tone: a.tones.size === 1 ? [...a.tones][0] : undefined,
        dashed: a.dashedAll,
        d,
        midX: mid.x,
        midY: mid.y,
      };
    });

    return {
      workingSet,
      edges,
      breadcrumb: buildCrumb(focusId, parentOf, labelOf),
      focusExists: true,
      labelOf,
      fwd,
      rev,
      extOut,
      extIn,
    };
  } catch {
    return { ...empty(true), breadcrumb: buildCrumb(focusId, parentOf, labelOf), labelOf };
  }
}

/** root → focus chain (focus last); empty at the root level. */
function buildCrumb(
  focusId: string | undefined,
  parentOf: Map<string, string | null>,
  labelOf: Map<string, string>,
): { id: string; label: string }[] {
  if (focusId === undefined) return [];
  const chain: { id: string; label: string }[] = [];
  const seen = new Set<string>();
  let cur: string | null = focusId;
  while (cur && !seen.has(cur) && labelOf.has(cur)) {
    seen.add(cur);
    chain.push({ id: cur, label: labelOf.get(cur)! });
    cur = parentOf.get(cur) ?? null;
  }
  return chain.reverse();
}

export const NESTED_VIEWBOX = { w: W, h: H } as const;
