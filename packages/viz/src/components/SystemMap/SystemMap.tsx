import { useMemo } from 'react';
import {
  cx,
  vars,
  toneVar,
  VizOverlay,
  NodeCard,
  Glyph,
  SYSTEM_KIND_GLYPH,
  layoutNested,
  useDrilldown,
  useControllableSelection,
  NESTED_VIEWBOX,
} from '../../internal';
import type { VizTone, LaidNestedEdge } from '../../internal';
import './SystemMap.css';

/** Tone vocabulary for system nodes/edges — the shared @trembus/tokens ontology. */
export type SystemTone = VizTone;

export interface SystemNode {
  /** REQUIRED and unique — parents/edges/ports reference it. */
  id: string;
  /** Node label — the box text + the accessible name. */
  label: string;
  /** Parent container id; omit/null for a top-level node. Nesting → drillable levels. */
  parentId?: string | null;
  /** Category → UML stereotype + a tone default (e.g. 'system' | 'container' | 'component' | 'actor' | 'datastore' | 'external'). */
  kind?: string;
  /** Explicit tone (overrides the kind default). */
  tone?: SystemTone;
  /** Explicit node color (hex) — overrides tone. */
  color?: string;
  /** Secondary label (tech / detail) shown in the box + inspector. */
  sub?: string;
  /** Inspector detail shown when selected. */
  note?: string;
  /** Explicit glyph name (overrides the kind→glyph default), e.g. `typescript`. */
  icon?: string;
}

export interface SystemPort {
  /** Unique port id. */
  id: string;
  /** The SystemNode this interface sits on. */
  nodeId: string;
  /** Interface name, e.g. `/charge`. */
  label: string;
  /** `provided` (offered to others) or `required` (consumed). Default `provided`. */
  direction?: 'provided' | 'required';
  tone?: SystemTone;
}

export interface SystemEdge {
  /** Source SystemNode.id (may be any depth — aggregated to the visible level). */
  from: string;
  /** Target SystemNode.id. */
  to: string;
  /** Optional edge label (e.g. the interface or protocol). */
  label?: string;
  /** Connection category → an edge tone when none is set. */
  kind?: string;
  /** Explicit edge tone (stroke + arrow color). */
  tone?: SystemTone;
  /** Render dashed (e.g. async / weak / inferred). */
  dashed?: boolean;
}

export interface SystemMapContract {
  view?: 'system' | 'c4';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  /** Flat node list; container nesting is derived from `parentId`. */
  nodes: SystemNode[];
  /** Provided / required interfaces on nodes. */
  ports?: SystemPort[];
  edges: SystemEdge[];
  /** Layered flow direction (Dagre rankdir). Default `TB` (top→bottom). */
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
}

export interface SystemMapProps {
  /** The architecture contract — flat nodes (nesting via `parentId`), edges, ports. */
  data: SystemMapContract;
  /** Controlled selected node id. */
  selectedId?: string;
  /** Uncontrolled initial selection. */
  defaultSelectedId?: string;
  /** Called with the node id when one is selected. */
  onSelect?: (id: string) => void;
  /** Seed the drilled-into container (uncontrolled; `undefined` = top level). */
  defaultFocusId?: string;
  /** Observe drill changes (`undefined` when returned to the top level). */
  onFocus?: (id: string | undefined) => void;
  className?: string;
}

const { w: W, h: H } = NESTED_VIEWBOX;
const ROOT_LABEL = 'All systems';

function names(ids: Set<string> | undefined, labelOf: Map<string, string>): string {
  return [...(ids ?? [])].map((id) => labelOf.get(id) ?? id).join(', ');
}

function partsLabel(n: number): string {
  return `${n} ${n === 1 ? 'part' : 'parts'}`;
}

/**
 * SystemMap — a nested, drill-down system-architecture map (C4 Context →
 * Container → Component). Lead job is reveal-state: a layered layout of ONE level
 * draws the systems/containers and their typed connections; afford/acknowledge are
 * real — every node is a focusable button (the a11y spine), containers carry an
 * "open" control that drills a level deeper (a frame flip, not a zoom), a
 * breadcrumb keeps the viewer oriented, and an aria-live inspector reveals the
 * selected node's interfaces and its internal + cross-boundary connections.
 */
export function SystemMap({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  defaultFocusId,
  onFocus,
  className,
}: SystemMapProps) {
  const direction = data.direction ?? 'TB';
  const [selectedId, select] = useControllableSelection(selProp, defaultSelectedId, onSelect);
  const [focusId, setFocus] = useDrilldown(defaultFocusId, onFocus);

  const layout = useMemo(
    () => layoutNested(data.nodes, data.edges, data.ports ?? [], focusId, direction),
    [data.nodes, data.edges, data.ports, focusId, direction],
  );
  const { workingSet, edges, breadcrumb, focusExists, labelOf, fwd, rev, extOut, extIn } = layout;

  const selected = workingSet.find((n) => n.id === selectedId);

  // Emphasis = the selected node + its direct (1-hop) neighbors at this level.
  const related = useMemo(() => {
    const set = new Set<string>();
    if (!selected) return set;
    set.add(selected.id);
    for (const x of fwd.get(selected.id) ?? []) set.add(x);
    for (const x of rev.get(selected.id) ?? []) set.add(x);
    return set;
  }, [selected, fwd, rev]);

  const hasSelection = related.size > 0;
  // An edge lights when BOTH endpoints are on the related set; non-related edges
  // mute. Nodes are never dimmed (focusable controls stay legible + operable).
  const isRelatedEdge = (e: LaidNestedEdge): boolean => related.has(e.from) && related.has(e.to);

  const hasNodes = data.nodes.some((n) => n.id);

  return (
    <div className={cx('tcl-systemmap', className)}>
      {(data.brand || data.code || data.title || data.caption) && (
        <div className="tcl-systemmap__head">
          {data.brand && <span className="tcl-systemmap__brand">{data.brand}</span>}
          {data.code && <span className="tcl-systemmap__code">{data.code}</span>}
          {data.title && <span className="tcl-systemmap__title">{data.title}</span>}
          {data.caption && <span className="tcl-systemmap__caption">{data.caption}</span>}
        </div>
      )}

      {/* breadcrumb — the constant orientation spine; only the highlight moves */}
      <nav className="tcl-systemmap__crumbs" aria-label="System map breadcrumb">
        <ol>
          <li>
            {focusId === undefined ? (
              <span className="tcl-systemmap__crumb is-current" aria-current="page">
                {ROOT_LABEL}
              </span>
            ) : (
              <button
                type="button"
                className="tcl-systemmap__crumb"
                onClick={() => setFocus(undefined)}
              >
                {ROOT_LABEL}
              </button>
            )}
          </li>
          {breadcrumb.map((c, i) => {
            const last = i === breadcrumb.length - 1;
            return (
              <li key={c.id}>
                <span className="tcl-systemmap__crumb-sep" aria-hidden="true">
                  ›
                </span>
                {last ? (
                  <span className="tcl-systemmap__crumb is-current" aria-current="page">
                    {c.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="tcl-systemmap__crumb"
                    onClick={() => setFocus(c.id)}
                  >
                    {c.label}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {!hasNodes ? (
        <p className="tcl-systemmap__empty">No nodes to display.</p>
      ) : !focusExists ? (
        <p className="tcl-systemmap__empty">
          That container is no longer present.{' '}
          <button type="button" className="tcl-systemmap__link" onClick={() => setFocus(undefined)}>
            Back to overview
          </button>
        </p>
      ) : workingSet.length === 0 ? (
        <p className="tcl-systemmap__empty">
          Nothing inside this container yet — use the breadcrumb to step back out.
        </p>
      ) : (
        <VizOverlay
          label={`${data.title ? `${data.title} — ` : ''}system map${
            breadcrumb.length ? ` (inside ${breadcrumb[breadcrumb.length - 1].label})` : ''
          }`}
          viewBox={{ w: W, h: H }}
          edges={
            <>
              <defs>
                <marker
                  id="tcl-systemmap-arrow"
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
              {edges.map((e) => {
                const lit = isRelatedEdge(e);
                return (
                  <path
                    key={`${e.from}->${e.to}`}
                    data-edge={`${e.from}->${e.to}`}
                    className={cx(
                      'tcl-systemmap__edge',
                      lit && 'is-related',
                      hasSelection && !lit && 'is-muted',
                      e.dashed && 'is-dashed',
                    )}
                    style={e.tone ? vars({ '--edge': toneVar(e.tone) }) : undefined}
                    d={e.d}
                    markerEnd="url(#tcl-systemmap-arrow)"
                  />
                );
              })}
              {edges
                .filter((e) => e.label)
                .map((e) => (
                  <text
                    key={`label:${e.from}->${e.to}`}
                    className="tcl-systemmap__edge-label"
                    x={e.midX}
                    y={e.midY}
                    textAnchor="middle"
                  >
                    {e.label}
                  </text>
                ))}
            </>
          }
          nodes={workingSet.map((n) => {
            const isSelected = n.id === selectedId;
            const glyphName = n.icon ?? (n.kind ? SYSTEM_KIND_GLYPH[n.kind] : undefined);
            const provided = n.ports.filter((p) => p.direction === 'provided').map((p) => p.label);
            const required = n.ports.filter((p) => p.direction === 'required').map((p) => p.label);
            const portsAria = [
              provided.length ? `provides ${provided.join(', ')}` : '',
              required.length ? `requires ${required.join(', ')}` : '',
            ]
              .filter(Boolean)
              .join('; ');
            const ariaLabel = [
              n.label,
              n.sub,
              n.kind,
              n.variant === 'container' ? `container with ${partsLabel(n.childCount)}` : '',
              portsAria,
              n.external ? 'has external connections' : '',
            ]
              .filter(Boolean)
              .join(', ');
            return (
              <div
                key={n.id}
                className="tcl-systemmap__node-wrap"
                style={vars({ left: `${(n.sx / W) * 100}%`, top: `${(n.sy / H) * 100}%` })}
              >
                <NodeCard
                  label={n.label}
                  sub={n.sub}
                  stereotype={n.kind ? `«${n.kind}»` : undefined}
                  icon={glyphName ? <Glyph name={glyphName} /> : undefined}
                  tone={n.tone}
                  color={n.color}
                  variant={n.variant}
                  badge={n.variant === 'container' ? partsLabel(n.childCount) : undefined}
                  ports={n.ports}
                  selected={isSelected}
                  emphasized={!isSelected && related.has(n.id)}
                  external={n.external}
                  ariaLabel={ariaLabel}
                  onSelect={() => select(n.id)}
                />
                {n.variant === 'container' && (
                  <button
                    type="button"
                    className="tcl-systemmap__open"
                    aria-label={`Open ${n.label}, ${partsLabel(n.childCount)}`}
                    onClick={() => setFocus(n.id)}
                  >
                    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                      <circle
                        cx="7"
                        cy="7"
                        r="4.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <line
                        x1="10.6"
                        y1="10.6"
                        x2="14"
                        y2="14"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <line x1="5" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.3" />
                      <line x1="7" y1="5" x2="7" y2="9" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        />
      )}

      <div className="tcl-systemmap__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-systemmap__inspector-title">
              {selected.label}
              {selected.sub && (
                <span className="tcl-systemmap__inspector-sub"> · {selected.sub}</span>
              )}
              {selected.kind && (
                <span className="tcl-systemmap__inspector-kind"> · {selected.kind}</span>
              )}
            </p>
            {selected.variant === 'container' && (
              <p className="tcl-systemmap__inspector-drill">
                Contains {partsLabel(selected.childCount)} — open it to drill in.
              </p>
            )}
            {selected.ports.length > 0 && (
              <p className="tcl-systemmap__inspector-ports">
                {selected.ports
                  .map((p) => `${p.direction === 'required' ? 'requires' : 'provides'} ${p.label}`)
                  .join(' · ')}
              </p>
            )}
            {rev.get(selected.id)?.size ? (
              <p className="tcl-systemmap__inspector-conn">
                From: {names(rev.get(selected.id), labelOf)}
              </p>
            ) : null}
            {fwd.get(selected.id)?.size ? (
              <p className="tcl-systemmap__inspector-conn">
                To: {names(fwd.get(selected.id), labelOf)}
              </p>
            ) : null}
            {extIn.get(selected.id)?.size ? (
              <p className="tcl-systemmap__inspector-ext">
                External in: {names(extIn.get(selected.id), labelOf)}
              </p>
            ) : null}
            {extOut.get(selected.id)?.size ? (
              <p className="tcl-systemmap__inspector-ext">
                External out: {names(extOut.get(selected.id), labelOf)}
              </p>
            ) : null}
            {selected.note && <p className="tcl-systemmap__inspector-note">{selected.note}</p>}
          </>
        ) : selectedId && labelOf.has(selectedId) ? (
          <p className="tcl-systemmap__inspector-hint">
            {labelOf.get(selectedId)} is on another level — use the breadcrumb to navigate to it.
          </p>
        ) : (
          <p className="tcl-systemmap__inspector-hint">
            Select a node to inspect it; open a container to drill in.
          </p>
        )}
      </div>
    </div>
  );
}
