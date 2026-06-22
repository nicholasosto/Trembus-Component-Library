# Tier-2 — node-link tree / org-chart / lineage viz (design sketch)

> Status: **planned**, not built. Lives here so the contract is ready to slot into the
> sibling `@trembus/viz` package when it spins up. Nothing in this file is wired into
> `@trembus/ui` — it is intentionally **not** a `src/components/<Name>/` dir (that would
> demand the 5-file contract shape and fail the Tier-1 gate).

## Why this is Tier-2, not Tier-1

A **treemap** encodes hierarchy as nested _area_ — no edges, deterministic squarified
layout, so it qualified as Tier-1 (it ships in `@trembus/ui`). A **node-link tree** —
the thing that actually _looks_ like a tree (org chart, family tree, dendrogram) — draws
explicit parent→child **edges** and needs a real **layout engine** to place nodes and
route edges without overlap. That engine (and its bundle weight) is the line between the
deterministic Tier-1 spine and Tier-2:

| Shape                                                        | Layout                                             | Engine                                        | Tier                                                             |
| ------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| Strict hierarchy, one parent per node (org chart, file tree) | Reingold–Tilford "tidy tree"                       | `d3-hierarchy` (`d3.tree()` / `d3.cluster()`) | Tier-2 (could be Tier-1.5 if depth is capped + recursive layout) |
| Dendrogram (clustering, branch length = distance)            | `d3.cluster()` + `value` as branch length          | `d3-hierarchy`                                | Tier-2                                                           |
| **Genealogy / family tree**                                  | two parents per child → it's a **DAG**, not a tree | layered (Dagre/ELK)                           | Tier-2                                                           |
| Lineage / pipeline-flow DAG (many-to-many, possible cycles)  | layered                                            | `dagre` / `elkjs`                             | Tier-2                                                           |

Key gotcha already baked in: a family tree is **not** a pure tree (a child has two
parents) — model it as the DAG/`GraphContract` below, not the strict `TreeContract`.

## Contract A — `Tree` (strict hierarchy: org chart, file tree, dendrogram)

Mirror the Tier-1 viz-spine contract pattern (BarChart/Funnel/Treemap): authored JSON,
`brand?/code?/title?/caption?`, color-coded tone ontology, and the controlled/uncontrolled
`selectedId` spine. Flat node list + `parentId` (serializable, matches the lineage style)
rather than nested `children` — easier to author and diff.

```ts
import type { FillBarTone } from '../../internal/fillbar';

export type TreeTone = FillBarTone;

export interface TreeNode {
  /** REQUIRED here (unlike Tier-1's index fallback) — edges/parents reference it. */
  id: string;
  /** Node label — the accessible name + the box text. */
  label: string;
  /** Parent's id; omit/null for a root (a forest = multiple roots is allowed). */
  parentId?: string | null;
  /** Optional magnitude → node size, or branch length in `dendrogram` variant. */
  value?: number;
  /** Color-coded tone (default cycles, or by depth). */
  tone?: TreeTone;
  /** Explicit node color (hex) — overrides `tone`. */
  color?: string;
  /** Secondary label shown in the box + inspector (role, dates, count). */
  sub?: string;
  /** Inspector detail shown when selected. */
  note?: string;
  /** Start collapsed (subtree hidden until expanded). */
  collapsed?: boolean;
}

export interface TreeContract {
  view?: 'tree' | 'org-chart' | 'dendrogram';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  /** Flat node list; hierarchy derived from `parentId`. */
  nodes: TreeNode[];
  /** Layout direction (default `vertical` = root at top). */
  orientation?: 'vertical' | 'horizontal' | 'radial';
  /** `tidy` = Reingold–Tilford; `dendrogram` = aligned leaves + `value` as distance. */
  variant?: 'tidy' | 'dendrogram';
}

export interface TreeProps {
  data: TreeContract;
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  /** Controlled expand/collapse set (ids of collapsed nodes). */
  collapsedIds?: string[];
  onToggle?: (id: string, collapsed: boolean) => void;
  className?: string;
}
```

## Contract B — `Lineage` (DAG superset: pipeline flow, genealogy, dependency graph)

When edges are many-to-many (or cyclic), drop `parentId` for an explicit `edges` array.
This is the `lineage` pipeline-flow graph deferred from the Tier-1 round.

```ts
export interface GraphNode {
  id: string;
  label: string;
  kind?: string; // node category → shape/tone (e.g. 'source' | 'transform' | 'sink')
  tone?: TreeTone;
  color?: string;
  sub?: string;
  note?: string;
}
export interface GraphEdge {
  from: string; // GraphNode.id
  to: string; // GraphNode.id
  label?: string;
  tone?: TreeTone;
  dashed?: boolean; // e.g. a weak / inferred dependency
}
export interface GraphContract {
  view?: 'lineage' | 'graph';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Layered flow direction (Dagre/ELK rankdir): top-bottom, left-right, etc. */
  direction?: 'TB' | 'LR' | 'BT' | 'RL';
}
```

## The 3-jobs contract (draft)

Lead job is **reveal-state**, like the rest of the viz spine.

- **reveal-state** — parent→child structure is drawn as node-link edges; depth and
  branching are perceivable; nodes color-coded by tone (or depth); optional `value` →
  node size. Selecting a node highlights its **ancestor path** to the root.
- **afford-action** — every node is a focusable HTML `<button>` carrying its accessible
  name (and, in the SR name, its path-to-root so position is announced); collapsible
  subtrees expose an expand/collapse control with `aria-expanded`.
- **acknowledge-input** — click / Enter / Space selects a node (`aria-pressed`), rings it,
  emphasizes its lineage edges, and an `aria-live` inspector reveals the node + ancestry;
  toggling a subtree flips `aria-expanded` and re-runs layout.

## Viz-spine adaptation (the overlay lesson, again)

Same pattern as LineChart/Treemap: the layout engine computes `(x, y)` per node and edge
paths into a `viewBox`. Render **edges as a decorative `aria-hidden` SVG** (`<path>` per
edge), then render **nodes as HTML `<button>`s positioned by %** over that SVG with
`preserveAspectRatio` — so node labels never distort and selection stays accessible. The
SVG/grid is decorative; the buttons carry the accessible names; one `aria-live` inspector.

Checklist when implementing in `@trembus/viz`:

- **Ids are real and required** here — use them directly; no `id ?? \`s${i}\`` index
  fallback (that rule is for Tier-1 where ids are optional). Still **validate** edges
  reference existing node ids and detect cycles before layout.
- **Clamp the computed layout to the viewBox** (the recurring "forced viz domains must
  clamp" gotcha) — a wide subtree must scale/scroll, never overflow the plot box.
- **Edges `aria-hidden`**, nodes are the only focusables; arrow-key roving within the tree
  is a nice-to-have on top of Tab.
- **Tokens only** (`var(--tcl-*)`), CSS in `@layer tcl.components`; node box text on a
  solid tone fill uses the tone's `-fg` token (see the Treemap gotcha in `CLAUDE.md`).
- Title `Visualizations/Tree` (+ `Visualizations/Lineage`); same `Default` / `States` /
  `Interaction` story shape and a11y test (`a11yViolations(container) === []`).

## Authoring example (org chart)

```ts
const orgChart: TreeContract = {
  view: 'org-chart',
  code: 'pmo.delivery.org',
  title: 'Delivery org',
  nodes: [
    { id: 'cdo', label: 'Chief Delivery Officer', sub: '1 report' },
    { id: 'plat', label: 'Platform', parentId: 'cdo', tone: 'accent' },
    { id: 'data', label: 'Data', parentId: 'cdo', tone: 'info' },
    { id: 'plat-a', label: 'Platform — Team A', parentId: 'plat' },
    { id: 'plat-b', label: 'Platform — Team B', parentId: 'plat' },
    { id: 'data-a', label: 'Data — Team A', parentId: 'data' },
  ],
  orientation: 'vertical',
};
```

## Deps (Tier-2 only — keeps Tier-1 dependency-free)

- Strict trees / dendrograms: `d3-hierarchy` (small, no DOM).
- DAG / lineage: `dagre` (lighter) or `elkjs` (richer, heavier) — pick per bundle budget.
  This dependency weight is exactly why these live in `@trembus/viz`, not `@trembus/ui`.
