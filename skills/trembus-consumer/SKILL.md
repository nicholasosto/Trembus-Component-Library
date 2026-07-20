---
name: trembus-consumer
description: Build UI in any app that consumes the Trembus Component Library (@trembus/tokens · icons · ui · viz · game-viz). Activates on "trembus", "TCL", any @trembus/* import or install, "which trembus/TCL component", var(--tcl-*) tokens, .tcl-root, data-theme light/dark/reliquary, or when adding/choosing/styling components in a repo whose package.json depends on @trembus/*. Self-contained consumer guide — setup, component chooser by data shape and UI job, per-component capsules, theming recipes, version-drift handling. Whole-page scaffolds (AppShell, WorkflowBoard) belong to the sibling trembus-template skill.
---

# trembus-consumer — build with the Trembus Component Library

TCL is five published ESM npm packages (React `^19` peer, Node ≥ 20): `@trembus/tokens`
(`var(--tcl-*)` tokens, themes, materials) · `@trembus/icons` (glyphs) · `@trembus/ui`
(5 primitives + ~46 components) · `@trembus/viz` (node-link diagrams) ·
`@trembus/game-viz` (cinematic skins over ui + viz). Built tokens → primitives →
components; every component carries a machine-checked "3 UI jobs" contract and ships
axe-clean. Live gallery: <https://nicholasosto.github.io/Trembus-Component-Library/>

> Stamp 2026-07-20 · tokens 0.2.2 · icons 0.2.0 · ui 0.8.3 · viz 0.5.1 · game-viz 0.4.1

- **Self-contained.** Everything you need is this skill's files, the consumer repo,
  `node_modules/@trembus/*`, and public URLs. Never go looking for the library author's
  private notes or non-public paths.
- **Precedence.** Inside a TCL-consuming repo, TCL's tokens, tone rules, and this chooser
  override generic chart-color / design-system guidance from other loaded skills.

## 1 · Detect + set up

**Step 0 — confirm you're in a consumer.** Grep package.json for `@trembus/`. No dep and
the user isn't asking to adopt TCL → this skill doesn't apply; say so. If the repo has
`packages/{ui,viz,game-viz}/src/components/`, you're IN the library — defer to its CLAUDE.md.

Install (tokens + icons arrive transitively — never install them directly):

```sh
pnpm add @trembus/ui react react-dom   # core components
pnpm add @trembus/viz                  # + node-link diagrams (adds d3-hierarchy, dagre)
pnpm add @trembus/game-viz             # + cinematic skins (pulls ui + viz + model-viewer)
```

Wire styles + theme once, at the app entry:

```tsx
import '@trembus/ui/styles.css'; // bundles the whole token foundation
import '@trembus/viz/styles.css'; // only if @trembus/viz is used
import '@trembus/game-viz/styles.css'; // only if @trembus/game-viz is used
import './app.css'; // your own styles — deliberately UNLAYERED
```

- **MUST: a game-viz consumer imports ALL THREE styles.css.** Since game-viz 0.4.0 its
  stylesheet carries only its own component CSS — ui/viz styles come from their own entries.
- **MUST: wrap the app in `.tcl-root` and set `data-theme` on an ancestor** (usually
  `<html>`): `light` (default) · `dark` · `reliquary`. Without them, components render unthemed.
- ESM-only, React `^19`, Node ≥ 20. No CommonJS `require`.
- Display font is opt-in: `--tcl-font-display` is Cinzel-first but no font file ships —
  `pnpm add @fontsource/cinzel` + import a weight, else a graceful serif fallback.

Weight tiers — prefer the lightest tier that does the job:

| Tier                | Adds                             | Cost                                                              |
| ------------------- | -------------------------------- | ----------------------------------------------------------------- |
| `@trembus/icons`    | glyphs only                      | ~free (tree-shakeable, no CSS)                                    |
| `@trembus/ui`       | primitives + components + tokens | the baseline                                                      |
| `@trembus/viz`      | layout-engine diagrams           | + d3-hierarchy + @dagrejs/dagre                                   |
| `@trembus/game-viz` | cinematic skins, 3D              | + ui + viz; Effigy lazy-loads ~300 KB model-viewer (browser-only) |

## 2 · Principles — recommended defaults

Every component satisfies three irreducible UI jobs — use them to think: **Reveal State**
(make data/machine state perceivable) · **Afford Action** (make possible actions
discoverable, honestly) · **Acknowledge Input** (respond perceivably to every input).

Steered defaults, each with its named exit — deviation is a designed path, not a hack:

- **Style with `var(--tcl-*)` tokens, not raw hex** — tokens are what keep all three
  themes and future re-skins working. _Exit:_ all TCL CSS lives in `@layer tcl.*`, so any
  unlayered CSS you write wins automatically; when a design truly needs an off-system
  value, write it plainly in your own stylesheet, accepting that surface won't re-theme.
- **Compose from primitives before writing custom markup** — `Box` (surface),
  `Stack`/`Inline` (relation), `Text` (mark), `Pressable` (affordance — owns the
  hover/press/focus state machine). _Exit:_ plain HTML is fine for static prose; the
  primitives earn their keep the moment surfaces, spacing scale, or interaction states
  appear. **NEVER hand-roll a clickable `<div>`** — use `Button`/`Pressable`.
- **Speak tone, and pair it with a word.** Six tones, one meaning each:
  `accent` brand/emphasis/selected · `info` neutral notice · `success` good/complete ·
  `warning` caution/degraded · `danger` destructive/failing · `neutral` inert. **NEVER**
  encode meaning by color alone — a tone always accompanies a visible word. No exit.
  Legibility: tone as _text_ on a plain surface → `var(--tcl-text)` (gold-on-light fails
  AA); text on a _solid tone fill_ → that tone's `-fg` token, never plain `--tcl-text`.
- **a11y is built in — your job is to not undo it.** NEVER: strip an accessible name
  (props marked REQUIRED in capsules are the name), `aria-hidden`/`inert` anything
  interactive, remove focus rings (restyle via `--tcl-focus-ring`), suppress the aria-live
  inspectors, or add motion that ignores `prefers-reduced-motion`.

Anti-patterns (each has bitten a real consumer):

- Reaching into internals — deep imports (`@trembus/ui/dist/…`, `packages/*/src/…`) or
  patching `node_modules` CSS. Bare specifiers + documented subpaths; override in your own CSS.
- Rebuilding selection state around a data component — wire its sel-trio (§4) instead.
- Reaching for game-viz on ordinary product UI — it's a theatrical idiom AND a weight tier.
- Duplicate or missing datum ids — breaks selection, keys, and screen-reader targets.

## 3 · Choose a component

By what you have (details: the capsule files in `references/`):

| You have                                    | Reach for                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| One number, now (KPI)                       | **Stat** (+ inline **Sparkline** trend)                                   |
| One number with bounds                      | **Meter** (capacity) / **Gauge** (zones) / **Progress** (completion)      |
| Categories compared by magnitude            | **BarChart**                                                              |
| Parts of a meaningful whole                 | **DonutChart** (≤ ~6 slices) / **Treemap** (many, or size-compare)        |
| Ordered stages of one flow (drop-off)       | **Funnel**                                                                |
| Numbers over time (continuous)              | **LineChart**                                                             |
| Discrete dated events                       | **Timeline** (gothic skin: **Chronicle**)                                 |
| Executed runs w/ status + duration          | **RunHistory** (replay a run onto **Swimlane** via `applyRun`)            |
| Work flowing across actors/lanes            | **Swimlane**                                                              |
| Two categorical axes × intensity            | **Heatmap** (cell- or row-select)                                         |
| Hierarchy to _navigate_ (select a node)     | **FolderTree**                                                            |
| Hierarchy to _read_ (org chart, dendrogram) | viz **Tree**                                                              |
| Hierarchy where _size_ matters              | **Treemap**                                                               |
| Nested systems to drill into (C4)           | viz **SystemMap**                                                         |
| "What rests on what" foundations            | viz **Strata**                                                            |
| DAG / pipeline / dependency edges           | viz **Lineage**                                                           |
| UML classes + typed relationships           | viz **ClassDiagram**                                                      |
| Skill tree with point allocation            | viz **TalentTree** (gothic skin: **Constellation**)                       |
| One center + status satellites              | **Hub**                                                                   |
| Records to scan/sort by fields              | **Table**                                                                 |
| Many visual assets (~50+)                   | **VirtualAssetGrid**                                                      |
| A few rich curated items with actions       | **Card** grid (Card + Stack/Inline)                                       |
| Options, consequences, a decision to make   | **DecisionMap**                                                           |
| A structured doc rendered as data           | **Brief** (`fromMarkdown` converts markdown)                              |
| Audio / framed media / 3D model             | **AudioWaveform** / game-viz **MediaFrame** / **Effigy**                  |
| Status or message, not data                 | Badge · Callout · Toast · DataStatusBar · EmptyState · Skeleton · Spinner |

Near-neighbor litmus rules (where agents actually err):

- **Gauge vs Meter vs Progress** — what does 100% mean? _Finished_ → Progress; _full_
  (capacity) → Meter; nothing special, safe/warn/danger zones matter → Gauge.
- **BarChart vs Funnel** — Funnel only when categories are ordered stages of ONE flow and
  drop-off is the story; peer categories → BarChart.
- **DonutChart vs Treemap** — ≤ ~6 flat labeled slices → Donut. Nesting, long tails, or
  area comparison → Treemap.
- **Table vs VirtualAssetGrid vs Cards** — comparing _fields_ across records → Table;
  browsing _thumbnails_ at scale → VirtualAssetGrid; a handful of rich heterogeneous items
  → Cards. Thumbnail column creeping into a Table → it wanted the Grid; a Card grid that
  needs sorting → it wanted a Table.
- **FolderTree vs Tree vs Treemap** — interact/navigate → FolderTree; contemplate
  structure → Tree; compare sizes → Treemap.
- **Timeline vs RunHistory vs Swimlane** — x-axis is calendar time → Timeline; rows are
  executions with pass/fail + duration → RunHistory; rows are owners/actors → Swimlane.
- **Hub vs SystemMap vs Lineage** — one center + satellites, edges don't matter → Hub;
  nested containers with drill-down → SystemMap; individual directed edges are the story
  → Lineage.
- **Brief vs plain markdown** — Brief when the doc is _data_ (JSON contract, status/tone
  chips, in-app chrome). Don't convert authored prose to JSON just to use a component.
- **game-viz vs plain ui** — default is ALWAYS plain ui. Pick the base component first
  (Timeline, TalentTree, media frame); swap to the skin only when the page deliberately
  speaks the gothic/cinematic idiom AND accepts the weight tier.
- **Terminal rules:** nothing fits → compose primitives (never the nearest-looking
  chart). Two rows tie → read both capsules, prefer the lighter weight tier. Data shape
  genuinely unclear → ask the user ONE question instead of guessing.

By UI job, when the prompt is "I need to…":

| Job                   | Need               | Components                                                                                                    |
| --------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Reveal state**      | a number           | Stat · Meter · Gauge                                                                                          |
|                       | a status word      | Badge (inline) · Callout (block) · DataStatusBar (data-trust strip)                                           |
|                       | pending / absent   | Skeleton (loading shape) · Spinner (short wait) · Progress (advancing) · EmptyState (nothing yet + next step) |
|                       | a collection       | Table · VirtualAssetGrid · the chart rows above                                                               |
| **Afford action**     | navigate           | NavBar · Tabs · Breadcrumb · Menu · Toolbar · SkipLink                                                        |
|                       | commit an action   | Button · IconButton · Pressable (custom affordances)                                                          |
|                       | choose within data | the sel-trio on every data component · TalentTree allocation                                                  |
|                       | disclose more      | Dialog · Menu · Tooltip                                                                                       |
| **Acknowledge input** | capture values     | Input · Textarea · Select · Checkbox · RadioGroup · Switch (label/error wiring built in)                      |
|                       | confirm an event   | Toast (`useToast` via ToastProvider)                                                                          |
|                       | selection feedback | built into sel-trio components — do not rebuild it                                                            |

## 4 · Use a component — universal conventions

Read protocol: scan the capsule file's index table → jump with `grep -n "^### <Name>"` →
Read just that range; never the whole file. Conventions stated once, not per capsule:

- Data-driven components take a JSON-serializable `data: <Name>Contract` prop plus the
  **sel-trio**: `selectedId` / `defaultSelectedId` / `onSelect(id)` (controlled or
  uncontrolled), and render an aria-live inspector for the selected datum.
- **Give every datum a stable unique `id`.** ui charts fall back to index (never label);
  **`@trembus/viz` REQUIRES node ids** — edges/parents reference them.
- Tone fields accept `accent | info | success | warning | danger | neutral`.
- Compound components use dot-parts (`Table.Row`, `Menu.Trigger`, `Tabs.Panel`,
  `NavBar.Link`…). Router integration: `asChild` lends behavior/styling to YOUR `<Link>`
  (recipe in RECIPES.md).
- Capsules end with a `Storybook:` slug — view at
  `https://nicholasosto.github.io/Trembus-Component-Library/?path=/story/<slug>`
  (+`&globals=theme:dark` or `theme:reliquary` for the dark themes).

## 5 · Reference map

| Need                                                      | Where                                                                                                                                                                                                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ui component capsule                                      | `references/components-ui.md`                                                                                                                                                                                                                                   |
| viz component capsule                                     | `references/components-viz.md`                                                                                                                                                                                                                                  |
| game-viz component capsule                                | `references/components-gameviz.md`                                                                                                                                                                                                                              |
| setup/framework/composition recipes, full troubleshooting | `references/RECIPES.md`                                                                                                                                                                                                                                         |
| exact prop types for the INSTALLED version                | `node_modules/@trembus/<pkg>/dist/index.d.ts` (+ that package's README)                                                                                                                                                                                         |
| visual reference, every variant, both themes              | the live Storybook gallery (slug scheme in §4)                                                                                                                                                                                                                  |
| real consumer app, CHANGELOG, page templates              | the library checkout `~/Master-Managed/Repositories/Trembus-Component-Library` (`demos/soul-steel`, `CHANGELOG.md`, `templates/`) → fallback `https://raw.githubusercontent.com/nicholasosto/Trembus-Component-Library/main/…` → else ask the user; never guess |

## 6 · Version drift

1. Compare installed versions (`node_modules/@trembus/*/package.json`) to the `> Stamp` above.
2. Equal → trust this skill fully.
3. Installed **newer** → new components/props may be missing here: scan the installed
   `index.d.ts` for exports absent from the capsule index and tell the user what you find.
4. Installed **older** → capsules may describe props that don't exist yet: confirm any
   `since:`-tagged or unusual prop in the installed `.d.ts` before using it; offer the
   upgrade command, don't auto-upgrade.
5. **The installed `.d.ts` is ground truth for the API; this skill is ground truth for
   intent, choice, and composition.** On any conflict about a prop's existence, name, or
   type — `.d.ts` wins, silently.
6. Major-version divergence from the stamp → treat all capsules as advisory: read the
   shipped per-package READMEs + CHANGELOG, and suggest refreshing this skill
   (`git pull` in the library checkout; the symlink updates it instantly).

## 7 · Verify your work

No Storybook in consumer repos — verify in the app itself:

1. Run the consumer's own dev server; screenshot **light AND dark** (flip `data-theme`
   on `<html>`), plus `reliquary` when game-viz is on the page.
2. Keyboard pass: Tab reaches every interactive datum; arrows move selection in sel-trio
   components; Escape peels stacked layers (Dialog + Menu) one per press.
3. Accessibility tree: data buttons expose real names — no empty or "[object Object]" names.

| Symptom (top 6 — full table in RECIPES.md)      | Cause                                                      |
| ----------------------------------------------- | ---------------------------------------------------------- |
| Components render unstyled                      | that package's `styles.css` import is missing              |
| game-viz styled, but ui parts inside it aren't  | ui/viz `styles.css` missing (the 0.4.0 three-imports rule) |
| Headings serif but not Cinzel                   | Cinzel is opt-in — load `@fontsource/cinzel`               |
| Theme not applying / stuck on light             | `data-theme` not on an ancestor, or `.tcl-root` missing    |
| Menu/popover invisible behind a Dialog          | `@trembus/ui` < 0.8.1 — upgrade                            |
| Double selection rings / wrong inspector target | duplicate or missing datum ids                             |

## 8 · Install / maintain this skill

```sh
bash ~/Master-Managed/Repositories/Trembus-Component-Library/skills/link-skill.sh
ls -la ~/.claude/skills/trembus-consumer   # → symlink into the library repo
```

Library-side maintenance (the /release skill executes this): every release restamps the
`> Stamp` line in all five files, syncs the reference files describing the changed
surface, prunes fixed known-gaps. SKILL.md stays ≤ 260 lines — overflow order: symptom
rows → RECIPES.md, component facts → capsules; principles stay.

**Report done-bar:** after acting under this skill, report the @trembus packages +
versions detected (vs the stamp), which components you chose and the litmus that decided
it, and which reference files you consulted.
