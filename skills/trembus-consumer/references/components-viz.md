# @trembus/viz — component capsules

> Stamp 2026-07-20 · tokens 0.2.2 · icons 0.2.0 · ui 0.8.3 · viz 0.5.1 · game-viz 0.4.1

Tier-2 node-link visualizations: real layout engines (d3-hierarchy, dagre) behind an
accessible spine — the SVG is decorative (`aria-hidden`); every node is a real focusable
HTML `<button>` positioned over it, with the sel-trio + an aria-live inspector.

**Rules that differ from ui charts:**

- **Node `id` is REQUIRED — no index fallback.** Edges/parents reference ids; the
  components dedupe duplicate ids (first wins) and remap orphans rather than crash, but
  authored data should be clean.
- Import `@trembus/viz/styles.css` (in addition to ui's if ui is present).
- Depends only on `@trembus/tokens` — usable without `@trembus/ui`.
- Layered components take `direction` (TB|LR|BT|RL) where noted; tone fields as usual.

### Tree · hierarchy · reveal-state

Strict parent→child hierarchy: org chart, file tree, dendrogram, radial.

```tsx
<Tree
  data={{
    nodes: [
      { id: 'ceo', label: 'CEO' },
      { id: 'eng', label: 'Engineering', parentId: 'ceo' },
      { id: 'des', label: 'Design', parentId: 'ceo' },
    ],
  }}
/>
```

Key data: `nodes: {id, label, parentId?, value?, tone?, color?, sub?, note?, icon?, collapsed?}[]` · `orientation` (vertical|horizontal|radial) · `variant` (tidy|dendrogram — dendrogram aligns leaves).
Key props: sel-trio · `collapsedIds`/`onToggle` (controlled collapse).
Gotchas: multiple roots get a synthetic root; missing `parentId` refs re-parent to it (rendered, not thrown).
Not when: edges cross the hierarchy (any node with two parents) → Lineage.
Storybook: visualizations-tree--default

### Lineage · graph · reveal-state

Directed graph / DAG: pipelines, data lineage, dependencies. Selecting a node highlights
its full upstream AND downstream chain.

```tsx
<Lineage
  data={{
    direction: 'LR',
    nodes: [
      { id: 'raw', label: 'raw_events' },
      { id: 'dw', label: 'warehouse' },
      { id: 'dash', label: 'dashboard' },
    ],
    edges: [
      { from: 'raw', to: 'dw' },
      { from: 'dw', to: 'dash' },
    ],
  }}
/>
```

Key data: `nodes: {id, label, kind?, tone?, color?, sub?, note?}[]` · `edges: {from, to, label?, tone?, dashed?}[]` · `direction`.
Key props: sel-trio.
Gotchas: label edges that carry meaning — edge labels are what screen readers get for connections. Cycles render (it's a graph, not a strict DAG check).
Storybook: visualizations-lineage--default

### SystemMap · architecture · reveal-state

Nested C4-style architecture map with semantic-zoom drill-down (Context → Container →
Component), breadcrumb trail, and cross-boundary edge aggregation.

```tsx
<SystemMap
  data={{
    nodes: [
      { id: 'shop', label: 'Storefront' },
      { id: 'api', label: 'API', parentId: 'shop' },
      { id: 'db', label: 'Postgres', parentId: 'shop', kind: 'database' },
    ],
    edges: [{ from: 'api', to: 'db', label: 'reads/writes' }],
  }}
/>
```

Key data: `nodes: {id, label, parentId? (nesting = drill levels), kind?, tone?, sub?, note?, icon?}[]` · `ports: {id, nodeId, label, direction?: provided|required}[]` · `edges: {from, to, label?, kind?, dashed?}[]` · `direction`.
Key props: sel-trio · `defaultFocusId`/`onFocus` (which container is zoomed).
Not when: no containment — a flat dependency story → Lineage.
Storybook: visualizations-systemmap--default

### ClassDiagram · uml · reveal-state

UML class boxes (stereotype, attributes, methods with visibility marks) + typed
relationship arrowheads: inheritance · realization · composition · aggregation ·
association · dependency.
Key data: `nodes: {id, name, stereotype?, attributes?: {name, visibility?: public|private|protected|package}[], methods?: […], tone?, note?}[]` · `edges: {from, to, kind?, label?, fromLabel?, toLabel? (multiplicities), tone?}[]` · `direction` (default BT — parents on top).
Key props: sel-trio.
Gotchas: arrowheads encode `kind` — the visual language is the point; pick kinds accurately.
Storybook: visualizations-classdiagram--default

### Strata · foundations · reveal-state

Concentric strata: radius = fundamentality (longest `restsOn` support chain) — "what
rests on what", first-principles maps, capability stacks.

```tsx
<Strata
  data={{
    principles: [
      { id: 'physics', label: 'Physics' },
      { id: 'chem', label: 'Chemistry', restsOn: ['physics'] },
      { id: 'bio', label: 'Biology', restsOn: ['chem', 'unknown-field'] },
    ],
  }}
/>
```

Key data: `principles: {id, label, restsOn?: string[], conjecture? (dashed ring), tone?, sub?, note?}[]`.
Key props: sel-trio (full arrow/Home/End roving). Selecting shows the load cone — everything resting on the selection.
Gotchas: a dangling `restsOn` ref auto-materializes a dashed GAP arc — a discovery
prompt, deliberately not an error. Don't "fix" gaps by deleting the reference; either add
the missing principle or keep the gap visible.
Storybook: visualizations-strata--default

### TalentTree · allocation · **afford-action**

Game-style skill tree: prerequisite DAG, multi-rank nodes, tier gates, and a points-budget
**allocation engine** — the one viz whose lead job is action, not display.

```tsx
const [alloc, setAlloc] = useState<Record<string, number>>({});
<TalentTree
  allocated={alloc}
  onAllocatedChange={(next) => setAlloc(next)}
  data={{
    points: 10,
    nodes: [
      { id: 'strike', label: 'Strike', maxRank: 3 },
      { id: 'combo', label: 'Combo', maxRank: 2, requires: [{ id: 'strike', rank: 2 }] },
    ],
  }}
/>;
```

Key data: `points?` (budget) · `tiers?: {label?, gate? (points spent to unlock)}[]` · `nodes: {id, label, sub?, glyph?, tone?, maxRank?, cost?, tier?, requires?: (string | {id, rank})[] (AND semantics)}[]`.
Key props: `allocated`/`defaultAllocated: Record<id, rank>` · `onAllocatedChange(next, change)` · `readOnly` · sel-trio. Click adds a rank; Shift+click / Delete removes.
Gotchas: deallocation is guarded — it never orphans a dependent; don't re-implement
budget math outside, the engine owns legality. Node statuses derive: locked → available → allocated → maxed.
Gothic skin: game-viz `Constellation` (same contract, same props).
Storybook: visualizations-talenttree--default
