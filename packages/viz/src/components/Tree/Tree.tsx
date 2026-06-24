import { useMemo } from 'react';
import { stratify, tree as d3tree, cluster as d3cluster } from 'd3-hierarchy';
import type { HierarchyPointNode } from 'd3-hierarchy';
import {
  cx,
  vars,
  toneVar,
  VizOverlay,
  useControllableSelection,
  useControllableSet,
} from '../../internal';
import type { VizTone } from '../../internal';
import './Tree.css';

/** Tone vocabulary for tree nodes — the shared @trembus/tokens ontology. */
export type TreeTone = VizTone;

export interface TreeNode {
  /** REQUIRED (unlike Tier-1's index fallback) — parents/edges reference it. */
  id: string;
  /** Node label — the accessible name + the box text. */
  label: string;
  /** Parent's id; omit/null for a root (a forest = multiple roots is allowed). */
  parentId?: string | null;
  /** Optional magnitude shown in the inspector. */
  value?: number;
  /** Color-coded tone (defaults to a cycle by depth). */
  tone?: TreeTone;
  /** Explicit node color (hex) — overrides `tone`. */
  color?: string;
  /** Secondary label shown in the box + inspector. */
  sub?: string;
  /** Inspector detail shown when selected. */
  note?: string;
  /** Start with this node's subtree collapsed. */
  collapsed?: boolean;
}

export interface TreeContract {
  view?: 'tree' | 'org-chart' | 'dendrogram';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  /** Flat node list; hierarchy is derived from `parentId`. */
  nodes: TreeNode[];
  /** Layout direction (default `vertical` = root at top). */
  orientation?: 'vertical' | 'horizontal' | 'radial';
  /** `tidy` = Reingold–Tilford; `dendrogram` = aligned leaves. */
  variant?: 'tidy' | 'dendrogram';
}

export interface TreeProps {
  data: TreeContract;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  /** Controlled set of collapsed node ids. */
  collapsedIds?: string[];
  onToggle?: (id: string, collapsed: boolean) => void;
  className?: string;
}

// ── layout geometry (viewBox units; nodes are positioned by % over it) ──
const W = 760;
const H = 520;
const PAD = 56;
const ROOT_ID = '__tcl_tree_root__';
const TONE_CYCLE: TreeTone[] = ['accent', 'info', 'success', 'warning', 'danger', 'neutral'];

interface Strat {
  id: string;
  parentId: string | null;
  data?: TreeNode;
}

interface LaidNode {
  id: string;
  label: string;
  sub?: string;
  note?: string;
  value?: number;
  tone?: TreeTone;
  color?: string;
  depth: number;
  sx: number;
  sy: number;
  /** Self → root chain of ids (for lineage highlight). */
  ancestorIds: string[];
  /** Root → parent labels joined for the SR name + inspector. */
  ancestry: string;
  hasChildren: boolean;
}

interface LaidLink {
  sourceId: string;
  targetId: string;
  d: string;
}

function linkPath(
  s: { sx: number; sy: number },
  t: { sx: number; sy: number },
  orientation: string,
): string {
  if (orientation === 'horizontal') {
    const mx = (s.sx + t.sx) / 2;
    return `M${s.sx},${s.sy}C${mx},${s.sy} ${mx},${t.sy} ${t.sx},${t.sy}`;
  }
  if (orientation === 'radial') {
    return `M${s.sx},${s.sy}L${t.sx},${t.sy}`;
  }
  const my = (s.sy + t.sy) / 2;
  return `M${s.sx},${s.sy}C${s.sx},${my} ${t.sx},${my} ${t.sx},${t.sy}`;
}

function buildLayout(
  nodes: TreeNode[],
  collapsed: ReadonlySet<string>,
  orientation: 'vertical' | 'horizontal' | 'radial',
  variant: 'tidy' | 'dendrogram',
): { laid: LaidNode[]; links: LaidLink[] } {
  // 1. dedup + index (first id wins; drop unidentified — ids never fall back to label).
  const byId = new Map<string, TreeNode>();
  for (const n of nodes) {
    if (n.id && !byId.has(n.id)) byId.set(n.id, n);
  }
  const valid = [...byId.values()];
  if (!valid.length) return { laid: [], links: [] };

  // A synthetic-root id that cannot collide with a user node id — a node literally
  // named ROOT_ID would otherwise make stratify throw "ambiguous" and blank the tree.
  let rootId = ROOT_ID;
  while (byId.has(rootId)) rootId += '_';

  // 2. prune collapsed subtrees BEFORE layout (collapsed node stays; descendants leave).
  const hiddenByCollapse = (n: TreeNode): boolean => {
    const seen = new Set<string>();
    let p = n.parentId ?? null;
    while (p && byId.has(p) && !seen.has(p)) {
      seen.add(p);
      if (collapsed.has(p)) return true;
      p = byId.get(p)!.parentId ?? null;
    }
    return false;
  };
  const visible = valid.filter((n) => !hiddenByCollapse(n));
  if (!visible.length) return { laid: [], links: [] };

  // 3. stratify entries — remap null/missing parents to a synthetic root (forest support).
  const visibleIds = new Set(visible.map((n) => n.id));
  const entries: Strat[] = visible.map((n) => ({
    id: n.id,
    parentId: n.parentId && visibleIds.has(n.parentId) ? n.parentId : rootId,
    data: n,
  }));

  // 4. break cycles so d3.stratify never throws — cut the actual back-edge to the root.
  const entryById = new Map(entries.map((e) => [e.id, e]));
  for (const start of entries) {
    const path = new Set<string>([start.id]);
    let cur = start;
    while (cur.parentId && cur.parentId !== rootId) {
      if (path.has(cur.parentId)) {
        cur.parentId = rootId;
        break;
      }
      path.add(cur.parentId);
      const next = entryById.get(cur.parentId);
      if (!next) {
        cur.parentId = rootId;
        break;
      }
      cur = next;
    }
  }
  entries.push({ id: rootId, parentId: null });

  // 5. stratify (guarded — degrade to empty rather than throw on malformed input).
  let root;
  try {
    root = stratify<Strat>()
      .id((d) => d.id)
      .parentId((d) => d.parentId)(entries);
  } catch {
    return { laid: [], links: [] };
  }

  // 6. layout — tidy tree or aligned-leaf dendrogram.
  const innerW = W - 2 * PAD;
  const innerH = H - 2 * PAD;
  const layout = variant === 'dendrogram' ? d3cluster<Strat>() : d3tree<Strat>();
  layout.separation((a, b) => (a.parent === b.parent ? 1 : 1.5));
  if (orientation === 'radial') {
    layout.size([2 * Math.PI, Math.min(innerW, innerH) / 2]);
  } else if (orientation === 'horizontal') {
    layout.size([innerH, innerW]);
  } else {
    layout.size([innerW, innerH]);
  }
  const positioned = layout(root);

  // 7. screen coords — orientation maps + a hard clamp to the padded box (a wide
  //    subtree must scale/fit, never overflow — the recurring viz-domain gotcha).
  const cxC = W / 2;
  const cyC = H / 2;
  const screen = (n: HierarchyPointNode<Strat>): { sx: number; sy: number } => {
    let sx: number;
    let sy: number;
    if (orientation === 'radial') {
      const a = n.x - Math.PI / 2;
      sx = cxC + n.y * Math.cos(a);
      sy = cyC + n.y * Math.sin(a);
    } else if (orientation === 'horizontal') {
      sx = PAD + n.y;
      sy = PAD + n.x;
    } else {
      sx = PAD + n.x;
      sy = PAD + n.y;
    }
    return {
      sx: Math.min(W - PAD, Math.max(PAD, sx)),
      sy: Math.min(H - PAD, Math.max(PAD, sy)),
    };
  };
  const coords = new Map<string, { sx: number; sy: number }>();
  positioned.each((n) => coords.set(n.data.id, screen(n)));

  // nodes with children in the FULL tree (so a collapsed node still shows a toggle).
  const allParents = new Set<string>();
  for (const n of valid) if (n.parentId && byId.has(n.parentId)) allParents.add(n.parentId);

  // 8. laid nodes (exclude the synthetic root).
  const laid: LaidNode[] = [];
  positioned.each((n) => {
    if (n.data.id === rootId || !n.data.data) return;
    const node = n.data.data;
    const pos = coords.get(n.data.id)!;
    const ancestors = n.ancestors().filter((a) => a.data.id !== rootId && a.data.data);
    const ancestorIds = ancestors.map((a) => a.data.id);
    const parentLabels = ancestors
      .slice(1)
      .map((a) => a.data.data!.label)
      .reverse();
    laid.push({
      id: node.id,
      label: node.label,
      sub: node.sub,
      note: node.note,
      value: node.value,
      tone: node.tone,
      color: node.color,
      depth: n.depth,
      sx: pos.sx,
      sy: pos.sy,
      ancestorIds,
      ancestry: parentLabels.length ? parentLabels.join(' › ') : 'root',
      hasChildren: allParents.has(node.id),
    });
  });

  // 9. links (exclude edges from the synthetic root).
  const links: LaidLink[] = [];
  for (const link of positioned.links()) {
    if (link.source.data.id === rootId) continue;
    const s = coords.get(link.source.data.id)!;
    const t = coords.get(link.target.data.id)!;
    links.push({
      sourceId: link.source.data.id,
      targetId: link.target.data.id,
      d: linkPath(s, t, orientation),
    });
  }

  return { laid, links };
}

/**
 * Tree — a strict-hierarchy node-link visualization (org chart / file tree /
 * dendrogram). Lead job is reveal-state: parent→child structure drawn as edges
 * with depth/branching perceivable; afford/acknowledge are real — every node is
 * a focusable HTML button (the a11y spine) over a decorative SVG, selection
 * highlights the ancestor path, and an aria-live inspector reveals the datum.
 */
export function Tree({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  collapsedIds,
  onToggle,
  className,
}: TreeProps) {
  const orientation = data.orientation ?? 'vertical';
  const variant = data.variant ?? 'tidy';

  const [selectedId, select] = useControllableSelection(selProp, defaultSelectedId, onSelect);

  const seededCollapsed = useMemo(
    () => data.nodes.filter((n) => n.collapsed).map((n) => n.id),
    [data.nodes],
  );
  const [collapsed, toggle] = useControllableSet(
    collapsedIds,
    collapsedIds ? undefined : seededCollapsed,
    onToggle,
  );

  const { laid, links } = useMemo(
    () => buildLayout(data.nodes, collapsed, orientation, variant),
    [data.nodes, collapsed, orientation, variant],
  );

  const selectedAncestors = useMemo(() => {
    const target = laid.find((n) => n.id === selectedId);
    return new Set<string>(target ? target.ancestorIds : []);
  }, [selectedId, laid]);

  const selected = laid.find((n) => n.id === selectedId);

  return (
    <div className={cx('tcl-tree', className)}>
      {(data.brand || data.code || data.title || data.caption) && (
        <div className="tcl-tree__head">
          {data.brand && <span className="tcl-tree__brand">{data.brand}</span>}
          {data.code && <span className="tcl-tree__code">{data.code}</span>}
          {data.title && <span className="tcl-tree__title">{data.title}</span>}
          {data.caption && <span className="tcl-tree__caption">{data.caption}</span>}
        </div>
      )}

      {laid.length === 0 ? (
        <p className="tcl-tree__empty">No nodes to display.</p>
      ) : (
        <VizOverlay
          label={data.title ? `${data.title} — tree` : 'Tree'}
          viewBox={{ w: W, h: H }}
          edges={links.map((l) => (
            <path
              key={`${l.sourceId}->${l.targetId}`}
              className={cx(
                'tcl-tree__edge',
                selectedAncestors.has(l.sourceId) &&
                  selectedAncestors.has(l.targetId) &&
                  'is-lineage',
              )}
              d={l.d}
            />
          ))}
          nodes={laid.map((n) => {
            const isSelected = n.id === selectedId;
            const onLineage = selectedAncestors.has(n.id);
            const tone = n.tone ?? TONE_CYCLE[(n.depth - 1) % TONE_CYCLE.length];
            const isCollapsed = collapsed.has(n.id);
            return (
              <div
                key={n.id}
                className="tcl-tree__node-wrap"
                style={vars({ left: `${(n.sx / W) * 100}%`, top: `${(n.sy / H) * 100}%` })}
              >
                <button
                  type="button"
                  className={cx(
                    'tcl-tree__node',
                    isSelected && 'is-selected',
                    onLineage && 'is-lineage',
                  )}
                  style={vars({ '--node': n.color ?? toneVar(tone) })}
                  aria-pressed={isSelected}
                  aria-label={`${n.label}${n.sub ? `, ${n.sub}` : ''}, level ${n.depth}, ${n.ancestry}`}
                  onClick={() => select(n.id)}
                >
                  <span className="tcl-tree__node-label">{n.label}</span>
                  {n.sub && <span className="tcl-tree__node-sub">{n.sub}</span>}
                </button>
                {n.hasChildren && (
                  <button
                    type="button"
                    className="tcl-tree__toggle"
                    aria-expanded={!isCollapsed}
                    aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${n.label}`}
                    onClick={() => toggle(n.id)}
                  >
                    {isCollapsed ? '+' : '−'}
                  </button>
                )}
              </div>
            );
          })}
        />
      )}

      <div className="tcl-tree__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-tree__inspector-title">
              {selected.label}
              {selected.sub && <span className="tcl-tree__inspector-sub"> · {selected.sub}</span>}
              {typeof selected.value === 'number' && (
                <span className="tcl-tree__inspector-value"> · {selected.value}</span>
              )}
            </p>
            <p className="tcl-tree__inspector-path">{selected.ancestry}</p>
            {selected.note && <p className="tcl-tree__inspector-note">{selected.note}</p>}
          </>
        ) : (
          <p className="tcl-tree__inspector-hint">Select a node to inspect it.</p>
        )}
      </div>
    </div>
  );
}
