import { useMemo } from 'react';
import dagre from '@dagrejs/dagre';
import { cx, vars, toneVar, VizOverlay, NodeCard, useControllableSelection } from '../../internal';
import type { VizTone, NodeCardSection } from '../../internal';
import './ClassDiagram.css';

/** Tone vocabulary for class nodes/relations — the shared @trembus/tokens ontology. */
export type ClassTone = VizTone;

export type Visibility = 'public' | 'private' | 'protected' | 'package';

export interface ClassMember {
  /** Member signature text, e.g. `id: string` or `save(): void`. */
  name: string;
  /** UML visibility → `+ - # ~`. Omit for no marker. */
  visibility?: Visibility;
}

export interface ClassNode {
  /** REQUIRED and unique — relations reference it. */
  id: string;
  /** Class name. */
  name: string;
  /** UML stereotype shown above the name, e.g. `«interface»` | `«abstract»` | `«enum»`. */
  stereotype?: string;
  /** Attribute compartment rows. */
  attributes?: ClassMember[];
  /** Method compartment rows. */
  methods?: ClassMember[];
  /** Color-coded tone (accent bar). */
  tone?: ClassTone;
  /** Explicit color (hex) — overrides tone. */
  color?: string;
  /** Inspector detail shown when selected. */
  note?: string;
}

/**
 * UML relationship kinds → arrowhead semantics:
 * - `inheritance` (generalization): hollow triangle at the parent (`to`), solid line.
 * - `realization` (implements): hollow triangle at the interface (`to`), dashed line.
 * - `composition`: filled diamond at the whole (`from`).
 * - `aggregation`: hollow diamond at the whole (`from`).
 * - `association`: open arrow at the `to`.
 * - `dependency`: open arrow at the `to`, dashed line.
 */
export type RelationKind =
  | 'inheritance'
  | 'realization'
  | 'composition'
  | 'aggregation'
  | 'association'
  | 'dependency';

export interface ClassRelation {
  from: string;
  to: string;
  /** Relationship kind (default `association`). */
  kind?: RelationKind;
  /** Edge label rendered at the midpoint. */
  label?: string;
  /** Multiplicity / role at the `from` end (e.g. `1`, `*`). */
  fromLabel?: string;
  /** Multiplicity / role at the `to` end. */
  toLabel?: string;
  tone?: ClassTone;
}

export interface ClassDiagramContract {
  view?: 'class';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  nodes: ClassNode[];
  edges: ClassRelation[];
  /** Layout direction (Dagre rankdir). Default `BT` so superclasses sit above subclasses. */
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
}

export interface ClassDiagramProps {
  /** The diagram contract — class nodes + typed relations. */
  data: ClassDiagramContract;
  /** Controlled selected class id. */
  selectedId?: string;
  /** Uncontrolled initial selection. */
  defaultSelectedId?: string;
  /** Called with the class id when one is selected. */
  onSelect?: (id: string) => void;
  className?: string;
}

// ── layout geometry (viewBox units; nodes positioned by % over it) ──
const W = 900;
const H = 620;
const PAD = 60;
const NODE_MIN_W = 132;
const NODE_MAX_W = 240;
const LINE_H = 14;
const MAX_SCALE = 1.4;

const VIS: Record<Visibility, string> = {
  public: '+',
  private: '-',
  protected: '#',
  package: '~',
};

interface RelStyle {
  dashed?: boolean;
  /** marker id at the `from` end. */
  start?: string;
  /** marker id at the `to` end. */
  end?: string;
  /** verb when the selected node is the `from` of this relation. */
  outVerb: string;
  /** verb when the selected node is the `to`. */
  inVerb: string;
}

const REL: Record<RelationKind, RelStyle> = {
  inheritance: { end: 'tcl-class-tri', outVerb: 'extends', inVerb: 'extended by' },
  realization: {
    end: 'tcl-class-tri',
    dashed: true,
    outVerb: 'implements',
    inVerb: 'implemented by',
  },
  composition: { start: 'tcl-class-diamond-filled', outVerb: 'owns', inVerb: 'part of' },
  aggregation: {
    start: 'tcl-class-diamond-hollow',
    outVerb: 'aggregates',
    inVerb: 'aggregated by',
  },
  association: { end: 'tcl-class-arrow', outVerb: 'associated with', inVerb: 'associated with' },
  dependency: { end: 'tcl-class-arrow', dashed: true, outVerb: 'depends on', inVerb: 'used by' },
};

function memberLine(m: ClassMember): string {
  return `${m.visibility ? `${VIS[m.visibility]} ` : ''}${m.name}`;
}

interface LaidClass {
  id: string;
  name: string;
  stereotype?: string;
  note?: string;
  tone: ClassTone;
  color?: string;
  attrLines: string[];
  methodLines: string[];
  sx: number;
  sy: number;
}

interface LaidRel {
  from: string;
  to: string;
  kind: RelationKind;
  dashed?: boolean;
  start?: string;
  end?: string;
  tone?: ClassTone;
  label?: string;
  fromLabel?: string;
  toLabel?: string;
  d: string;
  midX: number;
  midY: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

function estSize(
  n: ClassNode,
  attrLines: string[],
  methodLines: string[],
): { w: number; h: number } {
  const headChars = Math.max(n.name.length, n.stereotype ? n.stereotype.length : 0);
  const memberChars = Math.max(
    0,
    ...attrLines.map((l) => l.length),
    ...methodLines.map((l) => l.length),
  );
  // Slightly OVER-estimate so dagre never packs two real boxes into an overlap.
  const w = Math.min(
    NODE_MAX_W,
    Math.max(NODE_MIN_W, Math.max(headChars * 7.9, memberChars * 7.2) + 34),
  );
  let h = 16 + 19; // vertical padding + name line
  if (n.stereotype) h += 14;
  h += 10 + Math.max(1, attrLines.length) * LINE_H; // attributes compartment
  h += 10 + Math.max(1, methodLines.length) * LINE_H; // methods compartment
  return { w, h };
}

function buildLayout(
  nodes: ClassNode[],
  edges: ClassRelation[],
  direction: 'TB' | 'LR' | 'BT' | 'RL',
): { laid: LaidClass[]; rels: LaidRel[]; byId: Map<string, LaidClass> } {
  // 1. dedup (first id wins; drop unidentified — ids never fall back to name).
  const seen = new Map<string, ClassNode>();
  for (const n of nodes) if (n.id && !seen.has(n.id)) seen.set(n.id, n);
  const valid = [...seen.values()];
  if (!valid.length) return { laid: [], rels: [], byId: new Map() };

  const lines = new Map<string, { attr: string[]; method: string[] }>();
  for (const n of valid) {
    lines.set(n.id, {
      attr: (n.attributes ?? []).map(memberLine),
      method: (n.methods ?? []).map(memberLine),
    });
  }

  // 2. valid relations — endpoints exist, no self-loop, dedup by (from,to,kind).
  const relSeen = new Set<string>();
  const validRels: ClassRelation[] = [];
  for (const e of edges) {
    if (!seen.has(e.from) || !seen.has(e.to) || e.from === e.to) continue;
    const kind = e.kind ?? 'association';
    const key = `${e.from}->${e.to}:${kind}`;
    if (relSeen.has(key)) continue;
    relSeen.add(key);
    validRels.push({ ...e, kind });
  }

  try {
    // multigraph: two classes can carry more than one relationship (named edges).
    const g = new dagre.graphlib.Graph({ multigraph: true });
    g.setGraph({ rankdir: direction, nodesep: 54, ranksep: 72, marginx: 8, marginy: 8 });
    g.setDefaultEdgeLabel(() => ({}));
    for (const n of valid) {
      const l = lines.get(n.id)!;
      const { w, h } = estSize(n, l.attr, l.method);
      g.setNode(n.id, { width: w, height: h });
    }
    for (const e of validRels) g.setEdge(e.from, e.to, {}, `${e.from}->${e.to}:${e.kind}`);
    dagre.layout(g);

    const gl = g.graph() as { width?: number; height?: number };
    const dW = gl.width || 1;
    const dH = gl.height || 1;
    const scale = Math.min((W - 2 * PAD) / dW, (H - 2 * PAD) / dH, MAX_SCALE);
    const offX = (W - dW * scale) / 2;
    const offY = (H - dH * scale) / 2;
    const sx = (x: number): number => Math.min(W - PAD, Math.max(PAD, offX + x * scale));
    const sy = (y: number): number => Math.min(H - PAD, Math.max(PAD, offY + y * scale));

    const laid: LaidClass[] = valid.map((n) => {
      const dn = g.node(n.id) as { x: number; y: number };
      const l = lines.get(n.id)!;
      return {
        id: n.id,
        name: n.name,
        stereotype: n.stereotype,
        note: n.note,
        tone: n.tone ?? 'neutral',
        color: n.color,
        attrLines: l.attr,
        methodLines: l.method,
        sx: sx(dn.x),
        sy: sy(dn.y),
      };
    });
    const byId = new Map(laid.map((n) => [n.id, n]));

    const rels: LaidRel[] = validRels.map((e) => {
      const de = g.edge({ v: e.from, w: e.to, name: `${e.from}->${e.to}:${e.kind}` }) as {
        points?: Array<{ x: number; y: number }>;
      };
      const pts = (de?.points ?? []).map((p) => ({ x: sx(p.x), y: sy(p.y) }));
      const d = pts.length ? `M${pts.map((p) => `${p.x},${p.y}`).join(' L')}` : '';
      const mid = pts.length ? pts[Math.floor(pts.length / 2)] : { x: W / 2, y: H / 2 };
      const first = pts[0] ?? mid;
      const last = pts[pts.length - 1] ?? mid;
      const style = REL[e.kind!];
      return {
        from: e.from,
        to: e.to,
        kind: e.kind!,
        dashed: style.dashed,
        start: style.start,
        end: style.end,
        tone: e.tone,
        label: e.label,
        fromLabel: e.fromLabel,
        toLabel: e.toLabel,
        d,
        midX: mid.x,
        midY: mid.y,
        fromX: first.x,
        fromY: first.y,
        toX: last.x,
        toY: last.y,
      };
    });

    return { laid, rels, byId };
  } catch {
    return { laid: [], rels: [], byId: new Map() };
  }
}

function tri(id: string) {
  return (
    <marker
      id={id}
      viewBox="0 0 16 14"
      refX="15"
      refY="7"
      markerWidth="15"
      markerHeight="13"
      orient="auto-start-reverse"
    >
      <path d="M1 1 L15 7 L1 13 Z" fill="var(--tcl-bg)" stroke="context-stroke" strokeWidth="1.2" />
    </marker>
  );
}

/**
 * ClassDiagram — a UML class diagram. Lead job is reveal-state: classes render as
 * compartmented boxes (name · attributes · methods) connected by typed relationships
 * whose arrowheads encode the kind (inheritance ▷, realization ▷ dashed, composition
 * ◆, aggregation ◇, association →, dependency ⇢ dashed). Afford/acknowledge are real
 * — every class is a focusable button (the a11y spine) over decorative SVG edges, and
 * selecting one rings it, emphasizes its related classes, and reveals its members and
 * relationships in an aria-live inspector.
 */
export function ClassDiagram({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: ClassDiagramProps) {
  const direction = data.direction ?? 'BT';
  const [selectedId, select] = useControllableSelection(selProp, defaultSelectedId, onSelect);

  const { laid, rels, byId } = useMemo(
    () => buildLayout(data.nodes, data.edges, direction),
    [data.nodes, data.edges, direction],
  );

  // Direct relationships of the selected class (for emphasis + inspector).
  const selRels = useMemo(
    () => (selectedId ? rels.filter((r) => r.from === selectedId || r.to === selectedId) : []),
    [selectedId, rels],
  );
  const related = useMemo(() => {
    const set = new Set<string>();
    if (!selectedId) return set;
    set.add(selectedId);
    for (const r of selRels) set.add(r.from === selectedId ? r.to : r.from);
    return set;
  }, [selectedId, selRels]);

  const hasSelection = related.size > 0;
  const selected = byId.get(selectedId ?? '');
  const isRelatedEdge = (r: LaidRel): boolean => related.has(r.from) && related.has(r.to);

  return (
    <div className={cx('tcl-classdiagram', className)}>
      {(data.brand || data.code || data.title || data.caption) && (
        <div className="tcl-classdiagram__head">
          {data.brand && <span className="tcl-classdiagram__brand">{data.brand}</span>}
          {data.code && <span className="tcl-classdiagram__code">{data.code}</span>}
          {data.title && <span className="tcl-classdiagram__title">{data.title}</span>}
          {data.caption && <span className="tcl-classdiagram__caption">{data.caption}</span>}
        </div>
      )}

      {laid.length === 0 ? (
        <p className="tcl-classdiagram__empty">No classes to display.</p>
      ) : (
        <VizOverlay
          label={data.title ? `${data.title} — class diagram` : 'Class diagram'}
          viewBox={{ w: W, h: H }}
          edges={
            <>
              <defs>
                {tri('tcl-class-tri')}
                <marker
                  id="tcl-class-arrow"
                  viewBox="0 0 12 12"
                  refX="9"
                  refY="6"
                  markerWidth="11"
                  markerHeight="11"
                  orient="auto-start-reverse"
                >
                  <path d="M1 1 L9 6 L1 11" fill="none" stroke="context-stroke" strokeWidth="1.3" />
                </marker>
                <marker
                  id="tcl-class-diamond-filled"
                  viewBox="0 0 22 12"
                  refX="2"
                  refY="6"
                  markerWidth="20"
                  markerHeight="12"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M2 6 L11 1 L20 6 L11 11 Z"
                    fill="context-stroke"
                    stroke="context-stroke"
                  />
                </marker>
                <marker
                  id="tcl-class-diamond-hollow"
                  viewBox="0 0 22 12"
                  refX="2"
                  refY="6"
                  markerWidth="20"
                  markerHeight="12"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M2 6 L11 1 L20 6 L11 11 Z"
                    fill="var(--tcl-bg)"
                    stroke="context-stroke"
                    strokeWidth="1.2"
                  />
                </marker>
              </defs>
              {rels.map((r) => {
                const lit = isRelatedEdge(r);
                return (
                  <path
                    key={`${r.from}->${r.to}:${r.kind}`}
                    data-edge={`${r.from}->${r.to}`}
                    data-kind={r.kind}
                    className={cx(
                      'tcl-classdiagram__edge',
                      lit && 'is-related',
                      hasSelection && !lit && 'is-muted',
                      r.dashed && 'is-dashed',
                    )}
                    style={r.tone ? vars({ '--edge': toneVar(r.tone) }) : undefined}
                    d={r.d}
                    markerStart={r.start ? `url(#${r.start})` : undefined}
                    markerEnd={r.end ? `url(#${r.end})` : undefined}
                  />
                );
              })}
              {rels.map((r) => (
                <g key={`labels:${r.from}->${r.to}:${r.kind}`}>
                  {r.label && (
                    <text
                      className="tcl-classdiagram__edge-label"
                      x={r.midX}
                      y={r.midY}
                      textAnchor="middle"
                    >
                      {r.label}
                    </text>
                  )}
                  {r.fromLabel && (
                    <text
                      className="tcl-classdiagram__mult"
                      x={r.fromX}
                      y={r.fromY - 4}
                      textAnchor="middle"
                    >
                      {r.fromLabel}
                    </text>
                  )}
                  {r.toLabel && (
                    <text
                      className="tcl-classdiagram__mult"
                      x={r.toX}
                      y={r.toY - 4}
                      textAnchor="middle"
                    >
                      {r.toLabel}
                    </text>
                  )}
                </g>
              ))}
            </>
          }
          nodes={laid.map((n) => {
            const isSelected = n.id === selectedId;
            const sections: NodeCardSection[] = [{ items: n.attrLines }, { items: n.methodLines }];
            const ariaLabel = [
              n.name,
              n.stereotype,
              `${n.attrLines.length} ${n.attrLines.length === 1 ? 'attribute' : 'attributes'}`,
              `${n.methodLines.length} ${n.methodLines.length === 1 ? 'method' : 'methods'}`,
            ]
              .filter(Boolean)
              .join(', ');
            return (
              <div
                key={n.id}
                className="tcl-classdiagram__node-wrap"
                style={vars({ left: `${(n.sx / W) * 100}%`, top: `${(n.sy / H) * 100}%` })}
              >
                <NodeCard
                  label={n.name}
                  stereotype={n.stereotype}
                  tone={n.tone}
                  color={n.color}
                  sections={sections}
                  selected={isSelected}
                  emphasized={!isSelected && related.has(n.id)}
                  ariaLabel={ariaLabel}
                  onSelect={() => select(n.id)}
                />
              </div>
            );
          })}
        />
      )}

      <div className="tcl-classdiagram__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-classdiagram__inspector-title">
              {selected.name}
              {selected.stereotype && (
                <span className="tcl-classdiagram__inspector-stereotype">
                  {' '}
                  · {selected.stereotype}
                </span>
              )}
            </p>
            {selected.attrLines.length > 0 && (
              <p className="tcl-classdiagram__inspector-members">
                Attributes: {selected.attrLines.join(', ')}
              </p>
            )}
            {selected.methodLines.length > 0 && (
              <p className="tcl-classdiagram__inspector-members">
                Methods: {selected.methodLines.join(', ')}
              </p>
            )}
            {selRels.length > 0 && (
              <p className="tcl-classdiagram__inspector-rels">
                {selRels
                  .map((r) => {
                    const out = r.from === selected.id;
                    const other = out ? r.to : r.from;
                    const verb = out ? REL[r.kind].outVerb : REL[r.kind].inVerb;
                    return `${verb} ${byId.get(other)?.name ?? other}`;
                  })
                  .join(' · ')}
              </p>
            )}
            {selected.note && <p className="tcl-classdiagram__inspector-note">{selected.note}</p>}
          </>
        ) : (
          <p className="tcl-classdiagram__inspector-hint">
            Select a class to inspect its members and relationships.
          </p>
        )}
      </div>
    </div>
  );
}
