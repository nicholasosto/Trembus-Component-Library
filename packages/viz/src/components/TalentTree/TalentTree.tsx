import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  cx,
  vars,
  toneVar,
  toneFg,
  Glyph,
  VizOverlay,
  useControllableSelection,
  useControllableMap,
} from '../../internal';
import type { VizTone, GlyphName } from '../../internal';
import './TalentTree.css';

/** Tone vocabulary for talent nodes — the shared @trembus/tokens ontology. */
export type TalentTreeTone = VizTone;

/**
 * A prerequisite. A bare id means "that node at rank ≥ 1"; the object form demands
 * a minimum rank (e.g. `{ id: 'fireball', rank: 3 }`). ALL of a node's requirements
 * must be satisfied (AND semantics).
 */
export type TalentRequirement = string | { id: string; rank: number };

export interface TalentTier {
  /** Row heading, e.g. "Adept". An unlabeled tier still draws its rail. */
  label?: string;
  /** Total points spent in EARLIER tiers required before this tier unlocks (default 0). */
  gate?: number;
}

export interface TalentNode {
  /** REQUIRED and unique — `requires` and the allocation map reference it. */
  id: string;
  /** REQUIRED — the drawn name + the core of the accessible name. */
  label: string;
  /** Secondary line folded into the accessible name + inspector. */
  sub?: string;
  /** Longer description revealed in the inspector on selection. */
  note?: string;
  /** Decorative glyph name from @trembus/icons; unknown names degrade to an initial. */
  glyph?: GlyphName;
  /** Explicit tone; default inherits the tree accent (`--tcl-talenttree-accent`). */
  tone?: TalentTreeTone;
  /** Purchasable ranks (default 1; floored at 1). */
  maxRank?: number;
  /** Points per rank (default 1; floored at 0 — a free talent is legal). */
  cost?: number;
  /** 0-based authored row. Omitted → derived: longest prerequisite-chain depth. */
  tier?: number;
  /** Prerequisites — ALL must be satisfied. */
  requires?: TalentRequirement[];
}

export interface TalentTreeContract {
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  /** Total points available. Omitted → unlimited (no budget meter; spend count still shown). */
  points?: number;
  /** Authored rows; index = tier. Nodes may reference tiers beyond this list. */
  tiers?: TalentTier[];
  nodes: TalentNode[];
}

export interface TalentTreeProps {
  /** The tree contract — nodes, tiers, and the points budget. */
  data: TalentTreeContract;
  /** Controlled allocation map: id → rank. Rank-0 entries are treated as absent. */
  allocated?: Readonly<Record<string, number>>;
  /** Uncontrolled initial allocation. */
  defaultAllocated?: Readonly<Record<string, number>>;
  /** Fires on every rank change that passes the guards. `next` is the full next map. */
  onAllocatedChange?: (next: Record<string, number>, change: { id: string; rank: number }) => void;
  /** Display mode — activation only selects; allocate/remove affordances hidden. */
  readOnly?: boolean;
  /** Standard selection trio (spine parity; drives the inspector). */
  selectedId?: string;
  /** Uncontrolled initial selection. */
  defaultSelectedId?: string;
  /** Called with the node id when a talent is selected. */
  onSelect?: (id: string) => void;
  className?: string;
}

export type TalentStatus = 'locked' | 'available' | 'allocated' | 'maxed';

// ── layout geometry (viewBox units; buttons positioned by % over it) ──
const W = 720;
const PAD_X = 60; // column inset so edge nodes + labels never clip the focus ring
const PAD_Y = 22;
const ROW_H = 116;
const EDGE_START = 26; // trim off the prerequisite tile
const EDGE_END = 34; // trim so the arrowhead clears the dependent tile

interface Req {
  id: string;
  rank: number;
}

interface LaidNode {
  id: string;
  label: string;
  sub?: string;
  note?: string;
  glyph?: GlyphName;
  tone?: TalentTreeTone;
  maxRank: number;
  cost: number;
  tier: number;
  requires: Req[];
  inputIdx: number;
  x: number;
  y: number;
  rowIdx: number;
}

interface LaidEdge {
  from: string;
  to: string;
  rank: number;
  d: string;
  midX: number;
  midY: number;
}

interface Row {
  tier: number;
  label?: string;
  gate: number;
  rowIdx: number;
  y: number;
  nodes: LaidNode[];
}

interface Sanitized {
  nodes: LaidNode[];
  edges: LaidEdge[];
  byId: Map<string, LaidNode>;
  requiresOf: Map<string, Req[]>;
  dependents: Map<string, Req[]>;
  rows: Row[];
  tierGate: Map<number, number>;
  viewBox: { w: number; h: number };
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const intAtLeast = (v: unknown, lo: number, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.floor(v)) : fallback;

/**
 * The single sanitize pass: dedup, clamp numeric fields, normalize + cycle-break the
 * requirement graph, derive tiers, and lay out rows/columns/edges. Pure and total —
 * it never throws (lenient parse, strict render). Produces the ONE effective graph
 * consumed by layout, gating, and the inspector.
 */
function sanitizeTree(nodes: TalentNode[], tiers: TalentTier[] | undefined): Sanitized {
  // 1. dedup (first id wins; drop entries missing id or label).
  const seen = new Map<string, TalentNode>();
  for (const n of nodes) {
    if (n && typeof n.id === 'string' && n.id && typeof n.label === 'string' && n.label) {
      if (!seen.has(n.id)) seen.set(n.id, n);
    }
  }
  const valid = [...seen.values()];
  const ids = new Set(valid.map((n) => n.id));

  const emptyView = { w: W, h: PAD_Y * 2 };
  if (!valid.length) {
    return {
      nodes: [],
      edges: [],
      byId: new Map(),
      requiresOf: new Map(),
      dependents: new Map(),
      rows: [],
      tierGate: new Map(),
      viewBox: emptyView,
    };
  }

  // 2. per-node clamped numerics.
  const maxRankOf = new Map<string, number>();
  const costOf = new Map<string, number>();
  const authoredTier = new Map<string, number | undefined>();
  for (const n of valid) {
    maxRankOf.set(n.id, intAtLeast(n.maxRank, 1, 1));
    costOf.set(n.id, intAtLeast(n.cost, 0, 1));
    authoredTier.set(n.id, n.tier === undefined ? undefined : intAtLeast(n.tier, 0, 0));
  }

  // 3. normalize requirements → collapse dups to the strongest rank, drop self-refs
  //    and dangling refs (a data error must never brick a node), clamp the required
  //    rank to the target's maxRank (else the dependent is unreachable).
  const rawRequires = new Map<string, Req[]>();
  for (const n of valid) {
    const strongest = new Map<string, number>();
    for (const r of n.requires ?? []) {
      const id = typeof r === 'string' ? r : r?.id;
      if (typeof id !== 'string' || !id || id === n.id || !ids.has(id)) continue;
      const rank = typeof r === 'string' ? 1 : intAtLeast(r?.rank, 1, 1);
      const capped = Math.min(rank, maxRankOf.get(id)!);
      strongest.set(id, Math.max(strongest.get(id) ?? 0, capped));
    }
    rawRequires.set(
      n.id,
      [...strongest.entries()].map(([id, rank]) => ({ id, rank })),
    );
  }

  // 4. cycle-break: DFS in input order; an edge back into a node on the current
  //    stack is a back-edge → dropped from the EFFECTIVE graph (used by both layout
  //    and gating), so a cycle degrades to a still-playable tree, never a mutual brick.
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();
  const eff = new Map<string, Req[]>();
  const dfs = (id: string): void => {
    color.set(id, GRAY);
    const kept: Req[] = [];
    for (const req of rawRequires.get(id) ?? []) {
      const c = color.get(req.id) ?? WHITE;
      if (c === GRAY) continue; // back-edge → break the cycle
      if (c === WHITE) dfs(req.id);
      kept.push(req);
    }
    eff.set(id, kept);
    color.set(id, BLACK);
  };
  for (const n of valid) if ((color.get(n.id) ?? WHITE) === WHITE) dfs(n.id);

  // 5. tier = authored ?? derived longest-chain depth (eff is acyclic → memoized).
  const depth = new Map<string, number>();
  const depthOf = (id: string): number => {
    const memo = depth.get(id);
    if (memo !== undefined) return memo;
    let d = 0;
    for (const req of eff.get(id) ?? []) d = Math.max(d, depthOf(req.id) + 1);
    depth.set(id, d);
    return d;
  };
  const tierOf = new Map<string, number>();
  valid.forEach((n) => tierOf.set(n.id, authoredTier.get(n.id) ?? depthOf(n.id)));

  // 6. rows: occupied tiers ascending (gaps compress visually; indices stay semantic).
  const occupied = [...new Set(valid.map((n) => tierOf.get(n.id)!))].sort((a, b) => a - b);
  const rowIndexOf = new Map<number, number>(occupied.map((t, i) => [t, i]));
  const tierGate = new Map<number, number>();
  const rows: Row[] = occupied.map((tier, rowIdx) => ({
    tier,
    label: tiers?.[tier]?.label,
    gate: Math.max(0, Math.floor(tiers?.[tier]?.gate ?? 0)),
    rowIdx,
    y: PAD_Y + rowIdx * ROW_H + ROW_H / 2,
    nodes: [],
  }));
  rows.forEach((row) => tierGate.set(row.tier, row.gate));

  // 7. columns: authored (input) order within a tier; x spread evenly, clamped.
  const laidById = new Map<string, LaidNode>();
  valid.forEach((n, inputIdx) => {
    const tier = tierOf.get(n.id)!;
    const rowIdx = rowIndexOf.get(tier)!;
    const laid: LaidNode = {
      id: n.id,
      label: n.label,
      sub: n.sub,
      note: n.note,
      glyph: n.glyph,
      tone: n.tone,
      maxRank: maxRankOf.get(n.id)!,
      cost: costOf.get(n.id)!,
      tier,
      requires: eff.get(n.id) ?? [],
      inputIdx,
      x: 0,
      y: rows[rowIdx].y,
      rowIdx,
    };
    rows[rowIdx].nodes.push(laid);
    laidById.set(n.id, laid);
  });
  rows.forEach((row) => {
    const usable = W - 2 * PAD_X;
    const n = row.nodes.length;
    row.nodes.forEach((laid, i) => {
      laid.x = clamp(PAD_X + ((i + 1) / (n + 1)) * usable, PAD_X, W - PAD_X);
    });
  });

  // 8. edges: prerequisite → dependent, trimmed at both ends so arrowheads clear tiles.
  const edges: LaidEdge[] = [];
  const dependents = new Map<string, Req[]>();
  for (const dep of valid) {
    const b = laidById.get(dep.id)!;
    for (const req of eff.get(dep.id) ?? []) {
      const a = laidById.get(req.id)!;
      (dependents.get(req.id) ?? dependents.set(req.id, []).get(req.id)!).push({
        id: dep.id,
        rank: req.rank,
      });
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const x1 = a.x + ux * EDGE_START;
      const y1 = a.y + uy * EDGE_START;
      const x2 = b.x - ux * EDGE_END;
      const y2 = b.y - uy * EDGE_END;
      edges.push({
        from: req.id,
        to: dep.id,
        rank: req.rank,
        d: `M${x1.toFixed(2)},${y1.toFixed(2)} L${x2.toFixed(2)},${y2.toFixed(2)}`,
        midX: (x1 + x2) / 2,
        midY: (y1 + y2) / 2,
      });
    }
  }

  const flat = rows.flatMap((row) => row.nodes);
  return {
    nodes: flat,
    edges,
    byId: laidById,
    requiresOf: eff,
    dependents,
    rows,
    tierGate,
    viewBox: { w: W, h: PAD_Y * 2 + rows.length * ROW_H },
  };
}

interface Derived {
  rank: Map<string, number>;
  status: Map<string, TalentStatus>;
  prereqMet: Map<string, boolean>;
  gateMet: Map<string, boolean>;
  spent: number;
  spentClamped: number;
  over: boolean;
  budgetText: string;
  spentBelowTier: (tier: number) => number;
}

/** Per-tier spend below a given tier — recomputed from any ranks map (guards + render). */
function spentBelow(nodes: LaidNode[], ranks: Map<string, number>): (tier: number) => number {
  const byTier = new Map<number, number>();
  for (const n of nodes) {
    byTier.set(n.tier, (byTier.get(n.tier) ?? 0) + (ranks.get(n.id) ?? 0) * n.cost);
  }
  return (tier: number): number => {
    let sum = 0;
    for (const [t, v] of byTier) if (t < tier) sum += v;
    return sum;
  };
}

/** The ids of every allocated node whose prerequisites or tier gate are unmet under `ranks`. */
function violationsOf(s: Sanitized, ranks: Map<string, number>): Set<string> {
  const below = spentBelow(s.nodes, ranks);
  const bad = new Set<string>();
  for (const n of s.nodes) {
    if ((ranks.get(n.id) ?? 0) <= 0) continue;
    const pm = (s.requiresOf.get(n.id) ?? []).every((r) => (ranks.get(r.id) ?? 0) >= r.rank);
    const gm = below(n.tier) >= (s.tierGate.get(n.tier) ?? 0);
    if (!pm || !gm) bad.add(n.id);
  }
  return bad;
}

/** Derive statuses + budget from the (rank-clamped-once) allocation map. */
function deriveAllocation(
  s: Sanitized,
  rankMap: ReadonlyMap<string, number>,
  points: number | undefined,
): Derived {
  const rank = new Map<string, number>();
  for (const n of s.nodes) {
    const raw = rankMap.get(n.id) ?? 0;
    rank.set(n.id, clamp(Math.floor(raw), 0, n.maxRank));
  }
  let spent = 0;
  for (const n of s.nodes) spent += rank.get(n.id)! * n.cost;
  const spentBelowTier = spentBelow(s.nodes, rank);

  const prereqMet = new Map<string, boolean>();
  const gateMet = new Map<string, boolean>();
  const status = new Map<string, TalentStatus>();
  for (const n of s.nodes) {
    const r = rank.get(n.id)!;
    const pm = (s.requiresOf.get(n.id) ?? []).every((req) => (rank.get(req.id) ?? 0) >= req.rank);
    const gm = spentBelowTier(n.tier) >= (s.tierGate.get(n.tier) ?? 0);
    prereqMet.set(n.id, pm);
    gateMet.set(n.id, gm);
    status.set(
      n.id,
      r >= n.maxRank ? 'maxed' : r > 0 ? 'allocated' : pm && gm ? 'available' : 'locked',
    );
  }

  const over = points !== undefined && spent > points;
  const spentClamped = points !== undefined ? Math.min(spent, points) : spent;
  const budgetText =
    points === undefined
      ? `${spent} ${spent === 1 ? 'point' : 'points'} spent`
      : over
        ? `${spent} of ${points} points spent — over budget`
        : `${spent} of ${points} points spent, ${points - spent} remaining`;

  return {
    rank,
    status,
    prereqMet,
    gateMet,
    spent,
    spentClamped,
    over,
    budgetText,
    spentBelowTier,
  };
}

const costPhrase = (c: number): string =>
  c === 0 ? 'free' : c === 1 ? 'costs 1 point' : `costs ${c} points`;
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * TalentTree — a game skill-tree: a prerequisite DAG of multi-rank talents you spend a
 * points budget into. Its lead job is **afford-action** (a viz-roster first) — allocation
 * IS the component: click / Enter / Space spends a rank where the prerequisites, tier gate,
 * and budget allow; Shift+click / `-` / Delete safely removes one (never orphaning a
 * dependent). Reveal-state (tiers, met/unmet edges, locked/available/allocated/maxed nodes,
 * the budget meter) and acknowledge-input (an aria-live inspector announcing every spend
 * with the reason in words) serve the spending. Every node is a focusable button over the
 * decorative SVG; locked nodes stay focusable (`aria-disabled`) so a screen reader can hear
 * why. Controlled or uncontrolled via `allocated` / `defaultAllocated` / `onAllocatedChange`;
 * `readOnly` displays a finished build.
 */
export function TalentTree({
  data,
  allocated,
  defaultAllocated,
  onAllocatedChange,
  readOnly = false,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: TalentTreeProps) {
  const [selectedId, select] = useControllableSelection(selProp, defaultSelectedId, onSelect);
  const [ranks, commit] = useControllableMap(allocated, defaultAllocated, onAllocatedChange);
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

  // `points` is the one budget numeric — launder it like every field sanitizeTree
  // clamps (non-finite / negative → unlimited), so a junk value can't leak NaN into
  // the meter's aria-valuenow/valuemax/valuetext (the never-render-NaN invariant).
  const points =
    typeof data.points === 'number' && Number.isFinite(data.points)
      ? Math.max(0, Math.floor(data.points))
      : undefined;

  const S = useMemo(() => sanitizeTree(data.nodes, data.tiers), [data.nodes, data.tiers]);
  const D = useMemo(() => deriveAllocation(S, ranks, points), [S, ranks, points]);

  const rankOf = (id: string): number => D.rank.get(id) ?? 0;

  const canAllocate = (id: string): boolean => {
    if (readOnly) return false;
    const n = S.byId.get(id);
    if (!n || rankOf(id) >= n.maxRank) return false;
    if (!D.prereqMet.get(id) || !D.gateMet.get(id)) return false;
    if (points !== undefined && D.spent + n.cost > points) return false;
    return true;
  };

  // Removal may not CREATE a violation (orphan a dependent or break a tier gate); a
  // pre-existing violation from an illegal controlled map doesn't block the repair.
  const deallocation = (id: string): { ok: boolean; blockers: string[] } => {
    if (readOnly || rankOf(id) <= 0) return { ok: false, blockers: [] };
    const before = violationsOf(S, D.rank);
    const next = new Map(D.rank);
    next.set(id, rankOf(id) - 1);
    const after = violationsOf(S, next);
    const newly = [...after].filter((v) => !before.has(v));
    return { ok: newly.length === 0, blockers: newly.map((v) => S.byId.get(v)?.label ?? v) };
  };
  const canDeallocate = (id: string): boolean => deallocation(id).ok;

  // Activation always selects; on an allocatable node it additionally spends a rank —
  // a strict superset of the spine's click-selects. readOnly / locked → select only.
  const activate = (id: string): void => {
    setRovingId(id);
    select(id);
    if (canAllocate(id)) commit(id, rankOf(id) + 1);
  };
  const remove = (id: string): void => {
    setRovingId(id);
    select(id);
    if (canDeallocate(id)) commit(id, rankOf(id) - 1);
  };
  const moveFocus = (id: string): void => {
    setRovingId(id);
    select(id);
    nodeEls.current.get(id)?.focus();
  };

  const nearestInRow = (node: LaidNode, rowIdx: number): string | undefined => {
    const row = S.rows[rowIdx];
    if (!row || !row.nodes.length) return undefined;
    let best = row.nodes[0];
    for (const cand of row.nodes) {
      if (Math.abs(cand.x - node.x) < Math.abs(best.x - node.x)) best = cand;
    }
    return best.id;
  };

  const navTarget = (node: LaidNode, key: string): string | undefined => {
    const row = S.rows[node.rowIdx];
    const col = row.nodes.findIndex((n) => n.id === node.id);
    switch (key) {
      case 'ArrowLeft':
        return col > 0 ? row.nodes[col - 1].id : undefined;
      case 'ArrowRight':
        return col < row.nodes.length - 1 ? row.nodes[col + 1].id : undefined;
      case 'Home':
        return row.nodes[0]?.id;
      case 'End':
        return row.nodes[row.nodes.length - 1]?.id;
      case 'ArrowUp':
        return nearestInRow(node, node.rowIdx - 1);
      case 'ArrowDown':
        return nearestInRow(node, node.rowIdx + 1);
      default:
        return undefined;
    }
  };

  const onNodeKeyDown = (event: KeyboardEvent<HTMLButtonElement>, node: LaidNode): void => {
    const { key } = event;
    if (
      key === 'ArrowLeft' ||
      key === 'ArrowRight' ||
      key === 'ArrowUp' ||
      key === 'ArrowDown' ||
      key === 'Home' ||
      key === 'End'
    ) {
      const target = navTarget(node, key);
      if (target !== undefined) {
        event.preventDefault();
        event.stopPropagation();
        moveFocus(target);
      }
      return;
    }
    if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
      event.preventDefault();
      activate(node.id);
      return;
    }
    if (key === '-' || key === 'Delete' || key === 'Backspace') {
      event.preventDefault();
      remove(node.id);
    }
  };

  const selected = selectedId ? S.byId.get(selectedId) : undefined;
  const tabbableId = S.nodes.some((n) => n.id === rovingId)
    ? rovingId
    : (selected?.id ?? S.nodes[0]?.id);

  const nodeName = (n: LaidNode, r: number, status: TalentStatus): string => {
    const parts = [n.label];
    if (n.sub) parts.push(n.sub);
    parts.push(`rank ${r} of ${n.maxRank}`);
    parts.push(costPhrase(n.cost));
    parts.push(status);
    return parts.join(', ');
  };

  const labelOf = (id: string): string => S.byId.get(id)?.label ?? id;

  const hasBudgetMeter = points !== undefined;
  const meterPct = points !== undefined && points > 0 ? (D.spentClamped / points) * 100 : 0;

  return (
    <div className={cx('tcl-talent-tree', className)}>
      {(data.brand || data.code || data.title || data.caption) && (
        <div className="tcl-talent-tree__head">
          {data.brand && <span className="tcl-talent-tree__brand">{data.brand}</span>}
          {data.code && <span className="tcl-talent-tree__code">{data.code}</span>}
          {data.title && <span className="tcl-talent-tree__title">{data.title}</span>}
          {data.caption && <span className="tcl-talent-tree__caption">{data.caption}</span>}
        </div>
      )}

      {S.nodes.length > 0 &&
        (hasBudgetMeter ? (
          <div
            className="tcl-talent-tree__budget"
            role="meter"
            aria-label="Points spent"
            aria-valuemin={0}
            aria-valuemax={points}
            aria-valuenow={D.spentClamped}
            aria-valuetext={D.budgetText}
            data-over={D.over || undefined}
          >
            <span className="tcl-talent-tree__budget-track" aria-hidden="true">
              <span
                className="tcl-talent-tree__budget-fill"
                style={vars({ '--fill': `${clamp(meterPct, 0, 100)}%` })}
              />
            </span>
            <span className="tcl-talent-tree__budget-text" aria-hidden="true">
              {D.budgetText}
            </span>
          </div>
        ) : (
          <p className="tcl-talent-tree__budget-text tcl-talent-tree__budget-text--plain">
            {D.budgetText}
          </p>
        ))}

      {S.nodes.length === 0 ? (
        <p className="tcl-talent-tree__empty">No talents to display.</p>
      ) : (
        <VizOverlay
          className="tcl-talent-tree__canvas"
          label={data.title ? `${data.title} — talent tree` : 'Talent tree'}
          viewBox={S.viewBox}
          edges={
            <>
              <defs>
                <marker
                  id="tcl-talent-tree-arrow"
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

              {S.rows.map((row) => {
                const railMet = D.spentBelowTier(row.tier) >= row.gate;
                const railY = row.y - ROW_H / 2 + 12;
                return (
                  <g key={`rail:${row.tier}`}>
                    <line
                      className="tcl-talent-tree__rail"
                      x1={24}
                      y1={railY}
                      x2={W - 24}
                      y2={railY}
                    />
                    {row.label && (
                      <text className="tcl-talent-tree__rail-label" x={26} y={railY - 6}>
                        {row.label}
                      </text>
                    )}
                    {row.gate > 0 && (
                      <text
                        className={cx('tcl-talent-tree__rail-gate', railMet && 'is-met')}
                        x={W - 26}
                        y={railY - 6}
                        textAnchor="end"
                      >
                        {railMet ? `unlocked · ${row.gate} pts` : `locked · needs ${row.gate} pts`}
                      </text>
                    )}
                  </g>
                );
              })}

              {S.edges.map((e) => {
                const met = rankOf(e.from) >= e.rank;
                const active = e.from === selectedId || e.to === selectedId;
                return (
                  <path
                    key={`${e.from}->${e.to}`}
                    data-edge={`${e.from}->${e.to}`}
                    className={cx(
                      'tcl-talent-tree__edge',
                      met ? 'is-met' : 'is-unmet',
                      active && 'is-active',
                    )}
                    d={e.d}
                    markerEnd="url(#tcl-talent-tree-arrow)"
                  />
                );
              })}
              {S.edges
                .filter((e) => e.rank > 1)
                .map((e) => (
                  <text
                    key={`num:${e.from}->${e.to}`}
                    className="tcl-talent-tree__edge-num"
                    x={e.midX}
                    y={e.midY}
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    {e.rank}
                  </text>
                ))}
            </>
          }
          nodes={
            <>
              {S.nodes.map((n) => {
                const status = D.status.get(n.id)!;
                const r = rankOf(n.id);
                const isSelected = n.id === selectedId;
                return (
                  <button
                    key={n.id}
                    type="button"
                    ref={(el) => {
                      if (el) nodeEls.current.set(n.id, el);
                      else nodeEls.current.delete(n.id);
                    }}
                    className={cx('tcl-talent-tree__node', isSelected && 'is-selected')}
                    style={vars({
                      left: `${(n.x / S.viewBox.w) * 100}%`,
                      top: `${(n.y / S.viewBox.h) * 100}%`,
                      '--node': n.tone
                        ? toneVar(n.tone)
                        : 'var(--tcl-talenttree-accent, var(--tcl-accent))',
                      '--node-fg': n.tone ? toneFg(n.tone) : 'var(--tcl-accent-fg)',
                    })}
                    data-state={status}
                    aria-pressed={isSelected}
                    aria-disabled={status === 'locked' || undefined}
                    aria-label={nodeName(n, r, status)}
                    tabIndex={n.id === tabbableId ? 0 : -1}
                    onClick={(e) => (e.shiftKey ? remove(n.id) : activate(n.id))}
                    onKeyDown={(e) => onNodeKeyDown(e, n)}
                  >
                    <span className="tcl-talent-tree__tile" aria-hidden="true">
                      <span className="tcl-talent-tree__glyph">
                        {n.glyph ? (
                          <Glyph name={n.glyph} />
                        ) : (
                          <span className="tcl-talent-tree__initial">
                            {n.label.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </span>
                      <span
                        className="tcl-talent-tree__pips"
                        data-many={n.maxRank > 5 || undefined}
                      >
                        {n.maxRank <= 5 ? (
                          Array.from({ length: n.maxRank }, (_, k) => (
                            <span
                              key={k}
                              className="tcl-talent-tree__pip"
                              data-on={k < r || undefined}
                            />
                          ))
                        ) : (
                          <span className="tcl-talent-tree__pip-count">
                            {r}/{n.maxRank}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="tcl-talent-tree__node-label" aria-hidden="true">
                      {n.label}
                    </span>
                  </button>
                );
              })}
            </>
          }
        />
      )}

      {S.nodes.length > 0 && (
        <ul className="tcl-talent-tree__legend" aria-hidden="true">
          {(['available', 'allocated', 'maxed', 'locked'] as TalentStatus[]).map((st) => (
            <li key={st} className="tcl-talent-tree__legend-item">
              <span className="tcl-talent-tree__swatch" data-state={st} />
              {cap(st)}
            </li>
          ))}
        </ul>
      )}

      <div className="tcl-talent-tree__inspector">
        <div className="tcl-talent-tree__inspector-live" aria-live="polite" aria-atomic="true">
          {selected ? (
            <TalentDetail
              node={selected}
              rank={rankOf(selected.id)}
              status={D.status.get(selected.id)!}
              prereqMet={D.prereqMet.get(selected.id)!}
              gateMet={D.gateMet.get(selected.id)!}
              requires={S.requiresOf.get(selected.id) ?? []}
              dependents={S.dependents.get(selected.id) ?? []}
              gate={S.tierGate.get(selected.tier) ?? 0}
              spentBelow={D.spentBelowTier(selected.tier)}
              blockers={readOnly ? [] : deallocation(selected.id).blockers}
              rankFor={rankOf}
              labelOf={labelOf}
              budgetText={hasBudgetMeter ? D.budgetText : undefined}
            />
          ) : (
            <p className="tcl-talent-tree__inspector-hint">
              Select a talent to inspect its ranks, cost, and prerequisites.
            </p>
          )}
        </div>

        {!readOnly && selected && (
          <div className="tcl-talent-tree__actions">
            <button
              type="button"
              className="tcl-talent-tree__action"
              aria-disabled={!canAllocate(selected.id) || undefined}
              aria-label={`Add rank to ${selected.label}`}
              onClick={() => activate(selected.id)}
            >
              + Add rank
            </button>
            <button
              type="button"
              className="tcl-talent-tree__action"
              aria-disabled={!canDeallocate(selected.id) || undefined}
              aria-label={`Remove rank from ${selected.label}`}
              onClick={() => remove(selected.id)}
            >
              − Remove rank
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface TalentDetailProps {
  node: LaidNode;
  rank: number;
  status: TalentStatus;
  prereqMet: boolean;
  gateMet: boolean;
  requires: Req[];
  dependents: Req[];
  gate: number;
  spentBelow: number;
  blockers: string[];
  rankFor: (id: string) => number;
  labelOf: (id: string) => string;
  budgetText: string | undefined;
}

/** The selected-node detail inside the aria-live region — every distinction in words. */
function TalentDetail({
  node,
  rank,
  status,
  prereqMet,
  gateMet,
  requires,
  dependents,
  gate,
  spentBelow,
  blockers,
  rankFor,
  labelOf,
  budgetText,
}: TalentDetailProps) {
  return (
    <>
      <p className="tcl-talent-tree__inspector-title">
        {node.label}
        {node.sub && <span className="tcl-talent-tree__inspector-sub"> · {node.sub}</span>}
      </p>
      <p className="tcl-talent-tree__inspector-status">
        {cap(status)} · Rank {rank} of {node.maxRank} · {cap(costPhrase(node.cost))}
        {budgetText && ` · ${budgetText}`}
      </p>
      {requires.length > 0 && (
        <p className="tcl-talent-tree__inspector-line">
          Requires:{' '}
          {requires
            .map(
              (r) =>
                `${labelOf(r.id)}${r.rank > 1 ? ` rank ${r.rank}` : ''} — ${
                  rankFor(r.id) >= r.rank ? 'met' : 'not met'
                }`,
            )
            .join(' · ')}
        </p>
      )}
      {gate > 0 && (
        <p className="tcl-talent-tree__inspector-line">
          Tier gate:{' '}
          {gateMet
            ? 'met'
            : `spend ${gate - spentBelow} more point${gate - spentBelow === 1 ? '' : 's'} in earlier tiers`}
        </p>
      )}
      {dependents.length > 0 && (
        <p className="tcl-talent-tree__inspector-line">
          Enables: {dependents.map((d) => labelOf(d.id)).join(', ')}
        </p>
      )}
      {blockers.length > 0 && (
        <p className="tcl-talent-tree__inspector-line tcl-talent-tree__inspector-line--warn">
          Removing a rank would lock: {blockers.join(', ')}
        </p>
      )}
      {status === 'locked' && !prereqMet && requires.length === 0 && (
        <p className="tcl-talent-tree__inspector-line">Locked.</p>
      )}
      {node.note && <p className="tcl-talent-tree__inspector-note">{node.note}</p>}
    </>
  );
}
