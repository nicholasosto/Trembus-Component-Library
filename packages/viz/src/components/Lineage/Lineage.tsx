import { useMemo } from 'react';
import dagre from '@dagrejs/dagre';
import { cx, vars, toneVar, VizOverlay, useControllableSelection } from '../../internal';
import type { VizTone } from '../../internal';
import './Lineage.css';

/** Tone vocabulary for lineage nodes/edges — the shared @trembus/tokens ontology. */
export type LineageTone = VizTone;

export interface GraphNode {
  /** REQUIRED and unique — edges reference it. */
  id: string;
  /** Node label — the box text + the accessible name. */
  label: string;
  /** Node category → defaults its tone (e.g. 'source' | 'transform' | 'sink'). */
  kind?: string;
  /** Explicit tone (overrides the kind default). */
  tone?: LineageTone;
  /** Explicit node color (hex) — overrides tone. */
  color?: string;
  /** Secondary label shown in the box + inspector. */
  sub?: string;
  /** Inspector detail shown when selected. */
  note?: string;
}

export interface GraphEdge {
  /** Source GraphNode.id. */
  from: string;
  /** Target GraphNode.id. */
  to: string;
  /** Optional edge label (rendered at the edge midpoint). */
  label?: string;
  /** Explicit edge tone (stroke + arrow color). */
  tone?: LineageTone;
  /** Render as a dashed (e.g. weak / inferred) dependency. */
  dashed?: boolean;
}

export interface GraphContract {
  view?: 'lineage' | 'graph';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Layered flow direction (Dagre rankdir). Default `TB` (top→bottom). */
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
}

export interface LineageProps {
  data: GraphContract;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

// ── layout geometry (viewBox units; nodes positioned by % over it) ──
const W = 820;
const H = 560;
const PAD = 48;
const NODE_MIN_W = 96;
const NODE_MAX_W = 200;
const NODE_H = 38;
const NODE_H_SUB = 48;
const MAX_SCALE = 1.5;
const TONE_CYCLE: LineageTone[] = ['accent', 'info', 'success', 'warning', 'danger', 'neutral'];

type Adjacency = Map<string, Set<string>>;

interface LaidNode {
  id: string;
  label: string;
  sub?: string;
  note?: string;
  kind?: string;
  tone: LineageTone;
  color?: string;
  sx: number;
  sy: number;
}

interface LaidEdge {
  from: string;
  to: string;
  label?: string;
  tone?: LineageTone;
  dashed?: boolean;
  d: string;
  midX: number;
  midY: number;
}

interface Layout {
  laid: LaidNode[];
  laidEdges: LaidEdge[];
  fwd: Adjacency;
  rev: Adjacency;
  /** id → label (for naming connections in the inspector). */
  labelOf: Map<string, string>;
  /** `${from}->${to}` → edge metadata (for annotating connections). */
  edgeMeta: Map<string, { dashed?: boolean; label?: string }>;
}

function estWidth(label: string, sub?: string): number {
  const len = Math.max(label.length, sub ? sub.length : 0);
  return Math.min(NODE_MAX_W, Math.max(NODE_MIN_W, len * 7.2 + 28));
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

function buildLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: 'TB' | 'LR' | 'BT' | 'RL',
): Layout {
  // 1. dedup nodes (first id wins; drop unidentified).
  const byId = new Map<string, GraphNode>();
  for (const n of nodes) {
    if (n.id && !byId.has(n.id)) byId.set(n.id, n);
  }
  const valid = [...byId.values()];
  const labelOf = new Map<string, string>(valid.map((n) => [n.id, n.label]));

  // 2. valid edges — endpoints must exist, no self-loops, dedup; build adjacency.
  const fwd: Adjacency = new Map();
  const rev: Adjacency = new Map();
  const edgeMeta = new Map<string, { dashed?: boolean; label?: string }>();
  if (!valid.length) return { laid: [], laidEdges: [], fwd, rev, labelOf, edgeMeta };

  const seenEdge = new Set<string>();
  const validEdges: GraphEdge[] = [];
  for (const e of edges) {
    if (!byId.has(e.from) || !byId.has(e.to) || e.from === e.to) continue;
    const key = `${e.from}->${e.to}`;
    if (seenEdge.has(key)) continue;
    seenEdge.add(key);
    validEdges.push(e);
    edgeMeta.set(key, { dashed: e.dashed, label: e.label });
    (fwd.get(e.from) ?? fwd.set(e.from, new Set()).get(e.from)!).add(e.to);
    (rev.get(e.to) ?? rev.set(e.to, new Set()).get(e.to)!).add(e.from);
  }

  // 3. kind → tone (stable by first-seen order) for nodes without an explicit tone.
  const kindTone = new Map<string, LineageTone>();
  let ki = 0;
  for (const n of valid) {
    if (n.kind && !kindTone.has(n.kind)) kindTone.set(n.kind, TONE_CYCLE[ki++ % TONE_CYCLE.length]);
  }

  // 4. layered layout via dagre (handles cycles internally; guarded — degrade, never throw).
  try {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: direction, nodesep: 26, ranksep: 54, marginx: 8, marginy: 8 });
    g.setDefaultEdgeLabel(() => ({}));
    for (const n of valid) {
      g.setNode(n.id, { width: estWidth(n.label, n.sub), height: n.sub ? NODE_H_SUB : NODE_H });
    }
    for (const e of validEdges) g.setEdge(e.from, e.to);
    dagre.layout(g);

    // 5. fit the dagre output into the padded viewBox (scale to fit, capped; centered;
    //    every coord clamped — a big graph must shrink, never overflow).
    const gl = g.graph() as { width?: number; height?: number };
    const dW = gl.width || 1;
    const dH = gl.height || 1;
    const scale = Math.min((W - 2 * PAD) / dW, (H - 2 * PAD) / dH, MAX_SCALE);
    const offX = (W - dW * scale) / 2;
    const offY = (H - dH * scale) / 2;
    const sx = (x: number): number => Math.min(W - PAD, Math.max(PAD, offX + x * scale));
    const sy = (y: number): number => Math.min(H - PAD, Math.max(PAD, offY + y * scale));

    const laid: LaidNode[] = valid.map((n) => {
      const dn = g.node(n.id) as { x: number; y: number };
      const tone = n.tone ?? (n.kind ? kindTone.get(n.kind)! : 'neutral');
      return {
        id: n.id,
        label: n.label,
        sub: n.sub,
        note: n.note,
        kind: n.kind,
        tone,
        color: n.color,
        sx: sx(dn.x),
        sy: sy(dn.y),
      };
    });

    const laidEdges: LaidEdge[] = validEdges.map((e) => {
      const de = g.edge({ v: e.from, w: e.to }) as { points?: Array<{ x: number; y: number }> };
      const pts = (de?.points ?? []).map((p) => ({ x: sx(p.x), y: sy(p.y) }));
      const d = pts.length ? `M${pts.map((p) => `${p.x},${p.y}`).join(' L')}` : '';
      const mid = pts.length ? pts[Math.floor(pts.length / 2)] : { x: W / 2, y: H / 2 };
      return {
        from: e.from,
        to: e.to,
        label: e.label,
        tone: e.tone,
        dashed: e.dashed,
        d,
        midX: mid.x,
        midY: mid.y,
      };
    });

    return { laid, laidEdges, fwd, rev, labelOf, edgeMeta };
  } catch {
    return { laid: [], laidEdges: [], fwd, rev, labelOf, edgeMeta };
  }
}

/**
 * Lineage — a directed-graph (DAG) node-link visualization: pipeline flow,
 * data lineage, dependency graph, genealogy. Lead job is reveal-state: the
 * layered layout makes flow direction + dependency depth perceivable. Afford/
 * acknowledge are real — every node is a focusable button (the a11y spine) over
 * decorative SVG edges; selecting a node highlights its full upstream+downstream
 * lineage and an aria-live inspector reveals the datum + its connection counts.
 */
export function Lineage({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: LineageProps) {
  const direction = data.direction ?? 'TB';
  const [selectedId, select] = useControllableSelection(selProp, defaultSelectedId, onSelect);

  const { laid, laidEdges, fwd, rev, labelOf, edgeMeta } = useMemo(
    () => buildLayout(data.nodes, data.edges, direction),
    [data.nodes, data.edges, direction],
  );

  // Selection lineage: upstream (can reach sel) + downstream (sel can reach).
  const lineage = useMemo(() => {
    if (!selectedId || !laid.some((n) => n.id === selectedId)) {
      return { up: new Set<string>(), down: new Set<string>(), nodes: new Set<string>() };
    }
    const up = closure(selectedId, rev);
    const down = closure(selectedId, fwd);
    const nodesSet = new Set<string>([selectedId, ...up, ...down]);
    return { up, down, nodes: nodesSet };
  }, [selectedId, laid, fwd, rev]);

  const hasSelection = lineage.nodes.size > 0;
  // An edge is on the trace when BOTH its endpoints are on the lineage — this also
  // lights "bypass" edges that skip the selected node but connect two trace nodes.
  const isLineageEdge = (e: LaidEdge): boolean =>
    lineage.nodes.has(e.from) && lineage.nodes.has(e.to);

  const selected = laid.find((n) => n.id === selectedId);

  // Direct (1-hop) neighbors of the selected node, named + annotated (dashed/labeled),
  // surfaced in the inspector — the accessible channel for edge/connection info, since
  // the edge layer itself is decorative (aria-hidden).
  const fmtNeighbors = (ids: Set<string> | undefined, dir: 'in' | 'out'): string =>
    [...(ids ?? [])]
      .map((id) => {
        const key = dir === 'in' ? `${id}->${selectedId}` : `${selectedId}->${id}`;
        const meta = edgeMeta.get(key);
        const ann = meta?.label ? ` (${meta.label})` : meta?.dashed ? ' (weak)' : '';
        return `${labelOf.get(id) ?? id}${ann}`;
      })
      .join(', ');
  const fromText = selected ? fmtNeighbors(rev.get(selected.id), 'in') : '';
  const toText = selected ? fmtNeighbors(fwd.get(selected.id), 'out') : '';

  return (
    <div className={cx('tcl-lineage', className)}>
      {(data.brand || data.code || data.title || data.caption) && (
        <div className="tcl-lineage__head">
          {data.brand && <span className="tcl-lineage__brand">{data.brand}</span>}
          {data.code && <span className="tcl-lineage__code">{data.code}</span>}
          {data.title && <span className="tcl-lineage__title">{data.title}</span>}
          {data.caption && <span className="tcl-lineage__caption">{data.caption}</span>}
        </div>
      )}

      {laid.length === 0 ? (
        <p className="tcl-lineage__empty">No nodes to display.</p>
      ) : (
        <VizOverlay
          label={data.title ? `${data.title} — lineage graph` : 'Lineage graph'}
          viewBox={{ w: W, h: H }}
          edges={
            <>
              <defs>
                <marker
                  id="tcl-lineage-arrow"
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M0,0 L8,4 L0,8 z" fill="context-stroke" />
                </marker>
              </defs>
              {laidEdges.map((e) => {
                const lit = isLineageEdge(e);
                return (
                  <path
                    key={`${e.from}->${e.to}`}
                    data-edge={`${e.from}->${e.to}`}
                    className={cx(
                      'tcl-lineage__edge',
                      lit && 'is-lineage',
                      hasSelection && !lit && 'is-muted',
                      e.dashed && 'is-dashed',
                    )}
                    style={e.tone ? vars({ '--edge': toneVar(e.tone) }) : undefined}
                    d={e.d}
                    markerEnd="url(#tcl-lineage-arrow)"
                  />
                );
              })}
              {laidEdges
                .filter((e) => e.label)
                .map((e) => (
                  <text
                    key={`label:${e.from}->${e.to}`}
                    className="tcl-lineage__edge-label"
                    x={e.midX}
                    y={e.midY}
                    textAnchor="middle"
                  >
                    {e.label}
                  </text>
                ))}
            </>
          }
          nodes={laid.map((n) => {
            const isSelected = n.id === selectedId;
            const onLineage = lineage.nodes.has(n.id);
            return (
              <div
                key={n.id}
                className="tcl-lineage__node-wrap"
                style={vars({ left: `${(n.sx / W) * 100}%`, top: `${(n.sy / H) * 100}%` })}
              >
                <button
                  type="button"
                  className={cx(
                    'tcl-lineage__node',
                    isSelected && 'is-selected',
                    onLineage && 'is-lineage',
                  )}
                  style={vars({ '--node': n.color ?? toneVar(n.tone) })}
                  aria-pressed={isSelected}
                  aria-label={`${n.label}${n.sub ? `, ${n.sub}` : ''}${n.kind ? `, ${n.kind}` : ''}`}
                  onClick={() => select(n.id)}
                >
                  <span className="tcl-lineage__node-label">{n.label}</span>
                  {n.sub && <span className="tcl-lineage__node-sub">{n.sub}</span>}
                </button>
              </div>
            );
          })}
        />
      )}

      <div className="tcl-lineage__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-lineage__inspector-title">
              {selected.label}
              {selected.sub && (
                <span className="tcl-lineage__inspector-sub"> · {selected.sub}</span>
              )}
              {selected.kind && (
                <span className="tcl-lineage__inspector-kind"> · {selected.kind}</span>
              )}
            </p>
            <p className="tcl-lineage__inspector-flow">
              ↑ {lineage.up.size} upstream · ↓ {lineage.down.size} downstream
            </p>
            {fromText && <p className="tcl-lineage__inspector-conn">From: {fromText}</p>}
            {toText && <p className="tcl-lineage__inspector-conn">To: {toText}</p>}
            {selected.note && <p className="tcl-lineage__inspector-note">{selected.note}</p>}
          </>
        ) : (
          <p className="tcl-lineage__inspector-hint">Select a node to trace its lineage.</p>
        )}
      </div>
    </div>
  );
}
