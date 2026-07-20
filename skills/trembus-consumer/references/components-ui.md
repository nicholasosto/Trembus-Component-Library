# @trembus/ui — component capsules

> Stamp 2026-07-20 · tokens 0.2.1 · icons 0.2.0 · ui 0.8.2 · viz 0.5.0 · game-viz 0.4.0

Read protocol: scan the index, then `grep -n "^### <Name>"` and Read only that range.
Universal conventions (sel-trio, ids, tones, compound dot-parts, Storybook URL scheme)
live in SKILL.md §4 — capsules don't repeat them. Exact types: `node_modules/@trembus/ui/dist/index.d.ts`.

## Index

| Component        | Group        | Lead job          | One-liner                                                           |
| ---------------- | ------------ | ----------------- | ------------------------------------------------------------------- |
| Box              | primitive    | surface           | polymorphic surface/layout atom (material, radius, border, padding) |
| Stack / Inline   | primitive    | relation          | flex column / row with token gap                                    |
| Text             | primitive    | mark              | typography atom (size, weight, tone, mono, truncate)                |
| Pressable        | primitive    | affordance        | the interaction FSM behind every control                            |
| Input            | form         | acknowledge-input | single-line text field with label/error wiring                      |
| Textarea         | form         | acknowledge-input | multi-line field, same shell as Input                               |
| Select           | form         | acknowledge-input | native dropdown with label/error wiring                             |
| Checkbox         | form         | acknowledge-input | checked / unchecked / indeterminate                                 |
| RadioGroup       | form         | acknowledge-input | one-of-N, arrow-key selection                                       |
| Switch           | form         | acknowledge-input | on/off toggle (`role=switch`)                                       |
| Button           | form         | afford-action     | the primary action control                                          |
| IconButton       | form         | afford-action     | square one-glyph action (aria-label REQUIRED)                       |
| NavBar           | nav          | afford-action     | site nav of real links (`NavBar.Link`)                              |
| Breadcrumb       | nav          | reveal-state      | location trail, `aria-current="page"`                               |
| SkipLink         | nav          | afford-action     | hidden-until-focus jump to main                                     |
| Tabs             | nav          | afford-action     | ARIA tablist (`Tabs.List/Tab/Panel`)                                |
| Menu             | nav          | afford-action     | portal command menu with submenus                                   |
| Toolbar          | nav          | afford-action     | control cluster under one Tab stop                                  |
| Tooltip          | nav          | acknowledge-input | supplemental text on hover/focus                                    |
| Badge            | feedback     | reveal-state      | tone-coded status chip                                              |
| Callout          | feedback     | reveal-state      | tinted banner with accent rail                                      |
| Spinner          | feedback     | reveal-state      | short-wait busy indicator                                           |
| Skeleton         | feedback     | reveal-state      | loading placeholder shape                                           |
| Progress         | feedback     | reveal-state      | determinate task completion bar                                     |
| Meter            | feedback     | reveal-state      | value against capacity (solid/stacked/threshold)                    |
| Toast            | feedback     | acknowledge-input | transient event confirmations (`useToast`)                          |
| DataStatusBar    | feedback     | reveal-state      | data-trust header (live/stale + metrics + filters)                  |
| EmptyState       | feedback     | reveal-state      | deliberate "nothing here yet" + next step                           |
| Card             | container    | reveal-state      | raised grouping surface (`Header/Body/Footer`)                      |
| Avatar           | container    | reveal-state      | image → initials → glyph identity                                   |
| Dialog           | container    | acknowledge-input | focus-trapped modal                                                 |
| Stat             | single-value | reveal-state      | KPI tile (delta, target, embedded trend)                            |
| Sparkline        | single-value | reveal-state      | word-sized trend line (presentational)                              |
| Gauge            | single-value | reveal-state      | 180° dial with zones (`role=meter`)                                 |
| BarChart         | chart        | reveal-state      | categories vs one shared axis                                       |
| LineChart        | chart        | reveal-state      | multi-series trajectories over x                                    |
| DonutChart       | chart        | reveal-state      | part-of-whole ring (≤ ~6 slices)                                    |
| Treemap          | chart        | reveal-state      | area = share, squarified                                            |
| Funnel           | chart        | reveal-state      | ordered stage drop-off                                              |
| Heatmap          | chart        | reveal-state      | rows × columns intensity matrix                                     |
| Timeline         | process      | reveal-state      | dated events on a horizontal axis                                   |
| Swimlane         | process      | reveal-state      | steps across actor lanes with handoffs                              |
| RunHistory       | process      | reveal-state      | execution log table (status, duration, outputs)                     |
| DecisionMap      | process      | reveal-state      | options + consequence cascades / ADR ledger                         |
| Hub              | structure    | reveal-state      | hex-flower domain overview                                          |
| FolderTree       | structure    | reveal-state      | `role=tree` file explorer (filter, checkboxes, lazy)                |
| VirtualAssetGrid | structure    | reveal-state      | windowed 10k+ tile grid (`role=listbox`)                            |
| Table            | structure    | reveal-state      | real `<table>` (sort, sticky, row selection)                        |
| Brief            | document     | reveal-state      | renders a whole plan/spec/instruction doc                           |
| AudioWaveform    | media        | reveal-state      | waveform player with slider scrubber                                |

## Primitives

### Box · primitive · surface

The surface/layout atom every other piece sits on. Polymorphic (`as`).
Key props: `surface` (none|raised|sunken|overlay) · `material` (glass|cyber|felt|relic|parchment|slate|regal) · `radius` · `border` (true|'soft'|'strong') · `z` · padding scale `p/px/py/pt/pr/pb/pl`.
Use when: anything needs a surface, padding, border, or a material skin.
Gotchas: materials are scene-setting — use on hero/feature surfaces, not every card.
Storybook: primitives-box--default

### Stack / Inline · primitive · relation

Flex layouts: `Stack` = column, `Inline` = row. Extend Box props.
Key props: `gap` (space token) · `align` · `justify` · `wrap`.
Use when: spacing siblings — instead of margin utilities or ad-hoc flex CSS.
Storybook: primitives-stack--vertical-stack (Inline: primitives-stack--horizontal-inline)

### Text · primitive · mark

Typography atom; semantics come from `as` (`p`, `h2`, `span`…), look from props.
Key props: `size` (type token) · `weight` · `tone` (default|dim|faint|accent|status) · `mono` · `truncate` · `align`.
Use when: any text that should sit on the type scale and re-theme.
Storybook: primitives-text--scale

### Pressable · primitive · affordance

The interaction engine: owns the hover/press/focus FSM, emits `data-state`, guarantees a
focus ring. Dev-warns unless it renders a real `<button>`/`<a>`.
Key props: `asChild` (lend behavior to one interactive child) · `disabled` · `loading` · `onPress`.
Use when: building a custom affordance Button doesn't cover (tiles, rows, chips).
Not when: a standard action — use Button/IconButton.
Storybook: primitives-pressable--default

## Form & input

### Input · form · acknowledge-input

Single-line text field with the shared field shell (label/description/error wired to ARIA).
Key props: `label` (REQUIRED — the accessible name) · `description` · `error` (announces via `role=alert`) · `invalid` · size.
Gotchas: pass `error` the message, not a boolean — it renders AND announces.
Storybook: components-input--default

### Textarea · form · acknowledge-input

Multi-line sibling of Input; identical field shell.
Key props: `label` · `description` · `error` · `invalid` · rows.
Storybook: components-textarea--default

### Select · form · acknowledge-input

Native `<select>` in the field shell — reliable on mobile, zero positioning code.
Key props: `label` · `description` · `error` · `size` (sm|md|lg) · `placeholder` (renders a disabled first option) · children = `<option>`/`<optgroup>`.
Not when: options need rich content or search — compose Menu or build with Pressable.
Storybook: components-select--default

### Checkbox · form · acknowledge-input

Binary or tri-state; the label is part of the click target.
Key props: `label` · `indeterminate` (tri-state dash) · native input props (`checked`/`defaultChecked`/`onChange`).
Storybook: components-checkbox--default

### RadioGroup · form · acknowledge-input

One-of-N with arrow-key movement. Compound: `RadioGroup.Item`.
Key props: root `label` · `value`/`defaultValue`/`onValueChange`; Item `value` · `label`.
Not when: N > ~5 or options are long — use Select.
Storybook: components-radiogroup--default

### Switch · form · acknowledge-input

Immediate on/off (`role=switch`) — state applies now, no submit.
Key props: `label` · `description` · native input props (`checked`/`defaultChecked`/`onChange`).
Not when: the value is part of a form submitted later — use Checkbox.
Storybook: components-switch--default

### Button · form · afford-action

The action control: a real `<button>` with tones and a loading state.
Key props: `variant` (solid|outline|ghost) · `tone` · `loading` (sets `aria-busy`, keeps width) · `disabled` · `onPress`.
Gotchas: one accent-toned primary per view reads best; the rest neutral/outlined.
Storybook: components-button--default

### IconButton · form · afford-action

Square, one glyph, one action. **`aria-label` REQUIRED** — it is the entire name.
Key props: `aria-label` · `tone` · `size` · glyph child (e.g. `<Glyph name="close" />`).
Storybook: components-iconbutton--default

## Navigation & actions

### NavBar · nav · afford-action

`<nav>` of real links. Compound: `NavBar.Link`.
Key props: Link `href` · `active` (renders `aria-current="page"`) · `asChild` (wrap YOUR router `<Link>`; then omit `active` and let the router own aria-current — see RECIPES).
Storybook: components-navbar--default

### Breadcrumb · nav · reveal-state

Location trail; the current crumb is an inert `<span>` with `aria-current="page"`.
Key props: `items: BreadcrumbItemData[]` or compound `Breadcrumb.Item` (`href` · `asChild`).
Storybook: components-breadcrumb--default

### SkipLink · nav · afford-action

Visually hidden until focused; first Tab stop jumps keyboard users past the chrome.
Key props: `href` (target id, e.g. `#main`) · children label.
Use when: any page with a nav bar before the content. Cheap, always worth it.
Storybook: components-skiplink--default

### Tabs · nav · afford-action

ARIA tablist with roving tabindex. Compound: `Tabs.List` / `Tabs.Tab` / `Tabs.Panel`.
Key props: `value`/`defaultValue`/`onValueChange` · `orientation` (horizontal|vertical); Tab/Panel share a `value`.
Not when: the "tabs" are routed pages — use NavBar links so URLs change.
Storybook: components-tabs--default

### Menu · nav · afford-action

Portal command menu with submenus. Compound: `Menu.Trigger` (single interactive child) ·
`Menu.Content` (`align` start|end, `side` bottom|top) · `Menu.Item` · `Menu.Label` ·
`Menu.Separator` · `Menu.Sub` / `Menu.SubTrigger` / `Menu.SubContent`.
Key props: root `open`/`defaultOpen`/`onOpenChange`; Item `onSelect` · `disabled`.
Gotchas: safe inside Dialog from ui 0.8.1 (popover z-layer; Escape peels one layer per press). A `Toolbar.Button` can be the Trigger.
Storybook: components-menu--default

### Toolbar · nav · afford-action

Many controls, ONE Tab stop (roving arrows). Compound: `Toolbar.Button` (`tone` neutral|accent) · `Toolbar.Group` · `Toolbar.Separator`.
Key props: `orientation` · `aria-label` (name the toolbar).
Use when: an icon command bar (editor chrome, canvas tools) — pairs with Menu for overflow.
Storybook: components-toolbar--default

### Tooltip · nav · acknowledge-input

Supplemental text via `aria-describedby`; opens on hover/focus, Escape dismisses.
Key props: `content` · wraps ONE interactive trigger child.
Not when: the text is essential (put it in the UI) or the trigger isn't focusable.
Storybook: components-tooltip--default

## Feedback & status

### Badge · feedback · reveal-state

Non-interactive tone-coded chip; optional leading dot. The word IS the meaning; tone reinforces.
Key props: `tone` · children label.
Storybook: components-badge--default

### Callout · feedback · reveal-state

Block-level tinted banner with accent rail + tone icon.
Key props: `tone` · `title` · children body · `onDismiss` (setting it adds the close button).
Use when: page/section-level notices. For transient confirmations use Toast.
Storybook: components-callout--default

### Spinner · feedback · reveal-state

`role=status` busy indicator for short indeterminate waits.
Key props: `size` · `tone` · `label` (screen-reader text).
Not when: layout is known → Skeleton; progress is measurable → Progress.
Storybook: components-spinner--default

### Skeleton · feedback · reveal-state

Shimmering placeholder mirroring the coming layout. Decorative (`aria-hidden`) — pair the
region with a real loading announcement (e.g. DataStatusBar `loading`).
Key props: shape/size via className/style.
Storybook: components-skeleton--default

### Progress · feedback · reveal-state

Determinate `role=progressbar` fill: how far through a task.
Key props: `value` · `max` · `tone` · `label`.
Storybook: components-progress--default

### Meter · feedback · reveal-state

A measurement against capacity (`role=meter`): disk, quota, load.
Key props: `value`/`min`/`max` · `variant` (solid|stacked|threshold) · `segments: {value, tone?, label?}[]` (stacked) · `thresholds: {value, tone?}[]` (recolor on cross) · `size` · `glow` · `showValue` · `label`.
Storybook: components-meter--default

### Toast · feedback · acknowledge-input

Transient event confirmations. Mount `ToastProvider` once at the root; fire with `useToast()`:

```tsx
const { toast } = useToast();
toast({ title: 'Saved', description: 'Document saved.', tone: 'success' });
```

Key options: `title` · `description` · `tone` · `duration` (0 = sticky). Auto-dismiss pauses on hover.
Not when: the message must persist or block — use Callout or Dialog.
Storybook: components-toast--default

### DataStatusBar · feedback · reveal-state

Data-trust header in a `role=status` live region: is this data live, when did it update,
under which filters.
Key props: `status` (live|stale|loading|error|partial|paused) · `statusLabel` · `title` · `updatedAt` (+`updatedLabel`) · `metrics: {label, value}[]` · `filters: {label, value, tone?}[]` · `onRemoveFilter` · `onRefresh` · `dense`.
Use when: above any dashboard/data surface whose freshness matters.
Storybook: components-datastatusbar--default

### EmptyState · feedback · reveal-state

Deliberate absence: what's not here, why, what to do next.
Key props: `icon` (ReactNode; `null` hides the default ∅ mark) · `title` · `description` · `action` (slot for a Button) · `badge` · `pendingSource` (mono chip naming an unexposed data source).
Use when: zero-data states — never leave a blank region.
Storybook: components-emptystate--default

## Containers & overlays

### Card · container · reveal-state

Raised grouping surface. Compound: `Card.Header` / `Card.Body` / `Card.Footer`.
Key props: `interactive` (hover affordance — pair with an interactive child or row link).
Gotchas: a Card grid that wants sorting/filtering wanted to be a Table.
Storybook: components-card--default

### Avatar · container · reveal-state

Identity mark with graceful fallback: image → initials → glyph (`role=img`).
Key props: `src` · `name` (drives initials + accessible name) · `size`.
Storybook: components-avatar--default

### Dialog · container · acknowledge-input

Focus-trapped modal on the overlay layer; returns focus on close.
Key props: `open` · `onClose` · `title` · `description` · `footer` · `size` (sm|md|lg) · `closeOnOverlayClick` · `closeOnEsc`.
Gotchas: keep it controlled (`open` in state). Menus inside are fine (ui ≥ 0.8.1) — Escape closes the Menu first, then the Dialog.
Storybook: components-dialog--default

## Single-value

### Stat · single-value · reveal-state

KPI tile: value + label with optional delta, target, badge, and an embedded trend.
Key props: `label` · `value` · `unit` · `strap` (eyebrow) · `delta: {value, text?, invert?}` (▲/▼ auto-toned; `invert` when down-is-good) · `target` · `trend: (number|null)[]` · `tone` · `onSelect`/`href` (whole tile becomes a drill-in).
Storybook: components-stat--default

### Sparkline · single-value · reveal-state

Word-sized trend path — an accent, not a chart: no axes, no interaction.
Key props: `values: (number|null)[]` (null = gap) · `tone`/`color` · `area` · `markLast` · `min`/`max` (share a scale across siblings) · `label` (given → `role=img`; omitted → decorative).
Not when: values must be read precisely → LineChart.
Storybook: visualizations-sparkline--default

### Gauge · single-value · reveal-state

180° needle dial with zone semantics (`role=meter` + `aria-valuetext`). Presentational — no selection.

```tsx
<Gauge
  value={72}
  max={100}
  unit="%"
  label="CPU"
  zones={[
    { upTo: 60, tone: 'success' },
    { upTo: 85, tone: 'warning' },
    { upTo: 100, tone: 'danger' },
  ]}
/>
```

Key props: `value` · `min`/`max` · `unit` · `zones: {upTo, tone?, label?}[]` · `target: {value, label?}` · `label`/`ariaLabel` (REQUIRED accessible name).
Gotchas: out-of-range values clamp everywhere (needle, readout, aria — by design).
Storybook: visualizations-gauge--default

## Charts

All take `data: <Name>Contract` (`title?` · `caption?` · `unit?` shared) + the sel-trio,
and render an aria-live inspector. Datum fields share `id?` · `label` · `value` · `tone?` · `color?` · `sub?` · `note?`.

### BarChart · chart · reveal-state

Categories against one shared axis; single bars or clustered multi-series.

```tsx
<BarChart
  data={{
    title: 'Open issues',
    unit: 'issues',
    bars: [
      { id: 'ui', label: 'UI', value: 14, tone: 'warning' },
      { id: 'api', label: 'API', value: 6 },
    ],
  }}
/>
```

Key data: `bars: BarDatum[]` OR `series: {name, tone?, values: (number|null)[]}[]` + `categories: string[]` · `orientation` (vertical|horizontal) · `max` · `markers: {value, label?, tone?}[]`.
Key props: sel-trio · `height`. Series point ids are `"{seriesKey}#{catIdx}"`.
Storybook: visualizations-barchart--default

### LineChart · chart · reveal-state

Continuous trajectories; supports bands, targets, gaps.

```tsx
<LineChart
  data={{
    unit: 'ms',
    target: { value: 200, label: 'SLO' },
    series: [
      {
        id: 'p95',
        name: 'p95',
        points: [
          { x: 'Mon', y: 180 },
          { x: 'Tue', y: 240 },
        ],
      },
    ],
  }}
/>
```

Key data: `series: {id?, name, tone?/color?, dashed?, fill?, points: {x, y: number|null, note?}[]}[]` · `yMin`/`yMax` · `band: {lo, hi, label?}` · `target: {value, label?}`.
Key props: sel-trio (point ids `"{seriesId}#{index}"`) · `height`.
Gotchas: `y: null` renders a gap — don't zero-fill missing data.
Storybook: visualizations-linechart--default

### DonutChart · chart · reveal-state

Part-of-whole ring with optional center readout.
Key data: `segments: DonutSegment[]` · `centerValue` · `centerLabel`.
Key props: sel-trio · `size`.
Not when: > ~6 slices or nesting → Treemap.
Storybook: visualizations-donutchart--default

### Treemap · chart · reveal-state

Squarified cells, area = share. Zero/negative values get no cell (by design).
Key data: `nodes: {id?, label, value, tone?, color?, sub?}[]`.
Key props: sel-trio.
Storybook: visualizations-treemap--default

### Funnel · chart · reveal-state

Ordered stages of one flow; reports conversion vs top AND drop vs previous.
Key data: `stages: {id?, label, value, tone?, note?}[]` (in flow order).
Key props: sel-trio.
Storybook: visualizations-funnel--default

### Heatmap · chart · reveal-state

Rows × columns intensity matrix; tokens-only color-mix scale, legible in both themes.

```tsx
<Heatmap
  selectionMode="row"
  data={{
    columns: ['Mon', 'Tue', 'Wed'],
    rows: [
      { id: 'r1', label: 'Build', cells: [3, 9, 4] },
      { id: 'r2', label: 'Test', cells: [1, 5, 8] },
    ],
  }}
/>
```

Key data: `columns: string[]` · `rows: {id?, label, display?, sub?, cells: (number|null)[]}[]` · `columnTones` · `stops: {at, tone?, label?}[]` · `min`/`max` · `showValues`.
Key props: `selectionMode` (cell|row) — cell uses the sel-trio (`"{row}#{col}"`), row uses `selectedRowId`/`defaultSelectedRowId`/`onSelectRow` (master-detail) · `showInspector` · `showScale`.
Gotchas: `label` stays a string (it's the accessible name); use `display` for rich cells.
Storybook: visualizations-heatmap--default

## Process & time

### Timeline · process · reveal-state

Dated events on a horizontal axis, above/below the rail, category-toned.

```tsx
<Timeline
  data={{
    scale: 'time',
    events: [
      {
        id: 'v1',
        at: Date.parse('2026-01-10'),
        dateLabel: 'Jan 10',
        label: 'v1 ships',
        tone: 'success',
      },
      {
        id: 'inc',
        at: Date.parse('2026-03-02'),
        dateLabel: 'Mar 2',
        label: 'Incident',
        tone: 'danger',
      },
    ],
  }}
/>
```

Key data: `events: {id?, at: number, dateLabel?, label, category?, tone?, sub?, detail?, side?}[]` · `categories: {key, label, tone?}[]` · `scale` (ordinal = evenly spaced | time = proportional) · `range`.
Key props: sel-trio (arrow keys walk events). Gothic skin: game-viz `Chronicle`.
Storybook: visualizations-timeline--default

### Swimlane · process · reveal-state

Steps across actor lanes with handoff connectors — who does what, in what order.

```tsx
<Swimlane
  data={{
    lanes: [
      { id: 'dev', label: 'Developer', kind: 'human' },
      { id: 'ci', label: 'CI', kind: 'system' },
    ],
    steps: [
      { id: 's1', lane: 'dev', label: 'Open PR', status: 'done', to: ['s2'] },
      { id: 's2', lane: 'ci', label: 'Run checks', status: 'active' },
    ],
  }}
/>
```

Key data: `lanes: {id?, label, kind?: human|ai|system|tool|neutral}[]` · `steps: {id?, lane, label, col?, status?: done|active|pending|blocked|skipped, detail?, to?: string[], markers?: {glyph?, title}[]}[]`.
Key props: sel-trio · `density` (cozy|comfortable).
Storybook: visualizations-swimlane--default

### RunHistory · process · reveal-state

Execution log (built on Table): status, start, duration, trigger, outputs per run.
Key data: `runs: {id?, label?, status: succeeded|failed|running|cancelled|partial|queued, startedAt, durationMs?, trigger?, stepOutcomes?: {step, status}[], outputs?: {label, href?, kind?: pr|doc|log|dataset|deploy|link, op?: create|modify|delete}[]}[]`.
Key props: `selectedRunId`/`defaultSelectedRunId`/`onSelectRun` · `density`.
Gotchas: pair with Swimlane — `applyRun(swimlaneData, run)` (exported from `@trembus/ui`) replays a selected run's step outcomes onto the board (recipe in RECIPES.md).
Storybook: visualizations-runhistory--default

### DecisionMap · process · reveal-state

Options + consequence cascades; doubles as a decided-ADR ledger.
Key data: `options: {id?, label, summary?, tone?, effort?: low|medium|high, reversibility?: reversible|costly|one-way, confidence?: 0–100, consequences?: {label, likelihood?: certain|likely|possible|unlikely, horizon?, then?: […]}[]}[]` · `recommendation: {optionId, strength?: lean|moderate|strong, rationale?}` · `status` (open|decided) + `decidedId`/`decidedNote`.
Key props: sel-trio (seeds to decided, else recommended).
Use when: laying out a call BEFORE it's made, or rendering the decision record after.
Storybook: visualizations-decisionmap--default

## Structure & collections

### Hub · structure · reveal-state

Hex-flower domain overview: one center, up to six status-toned satellites. No layout engine.
Key data: `domains: {id, pos?: center|n|ne|se|s|sw|nw, kind: center|shipped|current|planned, tag, name, sub, status, note?}[]` · `stats: {label, value}[]` · `tagline`/`axis`.
Key props: sel-trio (roving arrows) · `size`.
Not when: satellites interconnect (→ viz Lineage) or containers nest (→ viz SystemMap).
Storybook: visualizations-hub--default

### FolderTree · structure · reveal-state

WAI-ARIA `role=tree` explorer: expand/collapse, roving keyboard, search filter,
tri-state checkboxes, lazy children.

```tsx
<FolderTree
  label="Project files"
  data={[
    {
      id: 'src',
      label: 'src',
      kind: 'folder',
      children: [{ id: 'a', label: 'App.tsx', kind: 'file' }],
    },
  ]}
/>
```

Key data: `FolderNode[]` — `{id?, label, kind?: folder|file, icon?, children?, hasChildren? (lazy), disabled?}`.
Key props: `expandedIds`/`defaultExpandedIds`/`onExpandedChange` · sel-trio · `checkable` + `checkedIds` trio (tri-state parents) · `filter` + `onFilterChange` · `onLoadChildren` (async) · `label` (REQUIRED tree name).
Storybook: components-foldertree--default

### VirtualAssetGrid · structure · reveal-state

Windowed `role=listbox` tile grid for thousands of assets; sticky section headers; 2D
arrow-key roving.

```tsx
<VirtualAssetGrid
  items={assets}
  getKey={(a) => a.id}
  getLabel={(a) => a.name}
  groupBy={(a) => a.category}
  renderTile={(a, { selected }) => <AssetTile asset={a} selected={selected} />}
/>
```

Key props: `items: T[]` · `getKey` (REQUIRED stable key) · `renderTile(item, {selected})` · `getLabel` (accessible option name) · `groupBy`/`groupLabel`/`groupOrder` · `minTileWidth`/`tileHeight`/`aspect`/`gap`/`overscanRows` · sel-trio · `virtualize` (set false in jsdom tests) · `emptyState`.
Storybook: components-virtualassetgrid--default

### Table · structure · reveal-state

Real `<table>` semantics. Compound: `Table.Caption/Head/Body/Foot/Row/HeaderCell/Cell/Empty`.
Key props: `density` (comfortable|compact) · `striped` · `sticky` + `maxHeight` · `sortDescriptor: {column, direction}` + `onSortChange` (YOU reorder the data) · `selectionMode` (none|multiple) + `selectedKeys`/`defaultSelectedKeys`/`onSelectionChange` (adds a tri-state checkbox column). `Table.Row` takes `href`/`onClick` (stretched row link); `Table.Cell` takes `align`.
Gotchas: sorting is controlled — the component renders indicators, your code sorts.
Storybook: components-table--default

## Documents & media

### Brief · document · reveal-state

Renders a whole structured doc (plan, spec, agent instructions) as data: meta chips,
typed sections (prose | rules | commands | checklist | phases | artifacts | boundaries |
decisions | reference), per-section collapse.
Key data: `{kind?: claude|agents|plan|spec, title?, summary?, meta?: {label, value, tone?}[], sections?: {id?, heading?, kind?, body?, items?: (string | {text, desc?, status?, severity?, ref?})[]}[]}`.
Key props: `headingLevel` · `defaultCollapsed: string[]`. Helpers exported from ui: `parseBrief` (validate), `fromMarkdown` (convert markdown → contract).
Storybook: visualizations-brief--default

### AudioWaveform · media · reveal-state

Waveform player: peaks bar-rail, play/pause transport, `role=slider` scrubber. Never autoplays.
Key props: `src` · `label` (REQUIRED accessible name) · `peaks: number[]` (0–1; or `autoLoadPeaks` to decode via Web Audio) · `duration` · `tone` · `compact` (thumbnail, no transport) · `playOnClick` · `onPlay`/`onPause`.
Storybook: components-audiowaveform--default

## @trembus/icons (consumed alongside ui)

Tree-shakeable `*Icon` components (FolderIcon, SearchIcon, WarningIcon, …37 glyphs) or the
by-name registry: `<Glyph name="folder-open" />` (`GlyphName` union; unknown names render
the fallback — lookups are own-property guarded). Maps: `SYSTEM_KIND_GLYPH` (architecture
node kinds), `extToGlyph('tsx')` (file extensions). No CSS, no tokens dep — glyphs inherit
`currentColor`. Prefer direct `*Icon` imports in app code (tree-shaking); use `Glyph` when
the name comes from data.
