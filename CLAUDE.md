# @trembus/ui — guide for Claude

Web React component library (NOT Roblox — that's the separate `@trembus/rbx-ui`).
First-principles UX: tokens → primitives → components, each carrying a machine-checked
"3 UI jobs" contract (Reveal State / Afford Action / Acknowledge Input).

## Workspace

pnpm workspace: `@trembus/tokens` · `icons` · `ui` · `viz` · `game-viz` under `packages/` (plus the
non-gated `@trembus/video` Remotion app, `demos/*` and `templates/*` — see below). `ls packages/*` and
each package's `package.json` / `README.md` are the roster; the rules that are NOT in the manifests:

- **`@trembus/icons`** lives in `packages/icons/src/icons/` (not `src/components/`), so it sits outside
  the contract gate — a React-only foundation **leaf**: no `@trembus/tokens` dep, no CSS, `sideEffects:false`.
- **`@trembus/viz`** (`packages/viz/`) — Tier-2 node-link visualizations (`Tree`, `Nebula`, …). Depends on
  `@trembus/tokens` **only**, never on `@trembus/ui`.
- **`@trembus/game-viz`** (`packages/game-viz/`) — expressive **game / cinematic** UI, titled `Game/*`.
  UNLIKE `@trembus/viz` (tokens-only), it **builds on `@trembus/ui`** (composes `Box`/`Stack`/`Inline`/
  `Text`/`Pressable`) and on **`@trembus/viz`** — composing a viz component from game-viz needs the
  `/^@trembus\/viz$/` source alias in `.storybook/main.ts` or the skinned component renders unstyled.
  **Not every component composes the primitives** — `Reliquary`, `Effigy` and `EpisodeDeck` are
  self-contained chrome importing only game-viz's own `cx`/`vars` (audited 2026-07-25, see
  `COMPONENT-REVIEW.md` §3.1 — rebuilding `Reliquary` on `Box` + `material` is a queued improvement, not a bug).
  Same 3-jobs
  contract + axe discipline — "theatrical surface, accessible spine" (decorative chrome
  `aria-hidden`, interactive bits are real focusable controls, tone-coding always paired with a
  word, motion behind `prefers-reduced-motion`). **Tone-as-text gotcha:** a tone painted as TEXT
  needs a legibility-safe variant — map `accent → var(--tcl-text)` (gold-on-light fails AA ~1.8:1;
  the Badge precedent) and keep the full tone only on borders/tints/strokes.

**Motion / video — `@trembus/video`** (`packages/video/`, private, **not a published library**) is a
**Remotion** app that renders the real components to video. It sits **outside the `pnpm validate` gate**
on purpose (scripts named off the gated set so `pnpm -r` skips it; excluded from root `eslint`/`prettier`).
Remotion gotchas and the license note: `packages/video/CLAUDE.md`.

## Commands

- `pnpm validate` is the full gate — run before declaring work done. It is `validate`, not `ci`
  (pnpm reserves the `ci` command). Build runs FIRST and topologically so every package's dist is
  fresh before dependents typecheck.
- `pnpm test:stories` runs stories in a real browser and needs `pnpm exec playwright install chromium` first.
- **One toolchain, declared once.** vite · vitest · testing-library · typescript · eslint · storybook
  live in the ROOT `package.json` only (pnpm puts the root `.bin` on every package's PATH; TS and
  Node resolve upward). Library manifests carry runtime deps + peers. Versions several projects
  share come from the `catalog:` in `pnpm-workspace.yaml`. Every package builds through
  `config/vite-lib.ts` (React, every `@trembus/*`, and the listed `external` stay external — a
  declared dependency that gets bundled ships twice) and tests through `config/vitest-unit.ts` +
  `config/vitest.setup.ts`; the per-package `vite.config.ts` / `vitest.config.ts` are one-liners.
- `AGENTS.md` is a symlink to this file and `.agents/skills/new-component` to
  `.claude/skills/new-component` (Codex reads the same guide + scaffolder). Edit the `.claude` side.

**Workflow skills** (`.claude/skills/`, readable by any agent): `/new-component` scaffolds;
**`/finish-component <Name>`** runs the quality loop (visual verify both themes → parallel
adversarial review → fixes WITH regression tests → re-gate) — the done-bar for component
work; **`/release <pkg>`** executes `RELEASING.md` end to end (enforced CHANGELOG entry,
roster docs sync, publish order, git tag + GitHub Release). RELEASING.md stays canonical.

**Consumer-facing skills** (user-level, symlinked into `~/.claude/skills/` and
`~/.codex/skills/`):
**`trembus-consumer`** (canonical at `skills/trembus-consumer/`, installed by
`bash skills/link-skill.sh`) teaches agents in CONSUMING repos the published @trembus
surface — setup, component chooser by data shape/UI job, per-component capsules,
recipes, version-drift protocol. Deliberately self-contained (no private paths). Every
release restamps its `> Stamp` line + syncs the affected roster file (RELEASING.md
docs-sync item 5). Sibling: `trembus-template` (page templates — see below).

## Visual preview — Claude drives Storybook live

Boot Storybook through the **Claude_Preview MCP**, not Bash: `preview_start({name:'storybook'})`
reads `.claude/launch.json` (`storybook dev -p 6006 --ci`) and serves on :6006; then
`preview_screenshot` / `preview_snapshot` / `preview_click` / `preview_eval` /
`preview_console_logs` drive it. Eyeball a component here before the `validate` gate.

- **Theme**: global `theme` (`light|dark`) → `data-theme` on `<html>` (`.storybook/preview.tsx`).
  Force dark by navigating with `&globals=theme:dark`.
- **Story ids** slugify the title — `components-button--states`, `visualizations-hub--default`.
- **Responsive**: `preview_resize` mobile/tablet/desktop presets.

## Adding a component

New component → `/new-component <Name> [--pkg ui|viz|game-viz]` (`--pkg` defaults to `ui`). The
canonical five-file shape is in `CONTRIBUTING.md`; the scaffolder wires the barrel export, and
`contract.name` must equal the directory name.

- `scripts/check-contracts.ts` enforces the shape + that each of the three jobs names a real
  exported story. Use the story names `Default` / `States` / `Interaction`.

## Example pages (multi-component compositions)

Pages that group several components together are NOT library components — they have no single
"3 jobs" contract. Put them in `packages/<pkg>/src/examples/`, **not** `…/src/components/` (the
contract checker scans every `src/components/<Name>/` dir per package and would fail the gate
demanding a contract). A plain `<Name>.stories.tsx` there is all you need — no contract / css /
test files; Storybook still finds it via the `packages/*/src/**/*.stories.tsx` glob. Title them
`Examples/*` and compose from the public barrel (`../index`) so the example exercises the real
consumer API. **Placement rule**: ui-only pages live in `packages/ui/src/examples/` (e.g.
Dashboard); a cross-package example that needs game-viz lives in
`packages/game-viz/src/examples/` (Game Design Document), importing game-viz from `'../../index'`
and ui/viz via real bare specifiers — a ui-hosted copy would force ui's typecheck to resolve its
own stale dist (self-reference), so it is disqualified.

## Demo sites (`demos/*`)

Real consuming apps (routed pages, app shell, navigation, root-level theme) — private Vite + react-router
SPAs under the top-level **`demos/*`** workspace glob (NOT `packages/`). **Consume the PUBLISHED API only** —
bare specifiers (`@trembus/ui`, `@trembus/viz`, `@trembus/game-viz`) + each package's `./styles.css`, never
deep/relative `packages/*/src` paths — and the libs must be **built** first. Off the `validate` gate;
`pnpm demos:check` is the dog-food check. Details: `demos/CLAUDE.md`.

## Page templates (`templates/*`)

**Copy-and-own reference PAGES** (AppShell · WorkflowBoard) — NOT library components: no 3-jobs contract.
**`templates/REGISTRY.md` is the human index AND the canonical grammar reference**; the user-level
**`trembus-template`** skill (canonical at `templates/skill/`) copies them into consuming apps. Check with
`pnpm templates:check`. Gate placement, filename and release rules: `templates/CLAUDE.md`.

## Conventions

- **Tokens only**: components reference `var(--tcl-*)` — never hardcode a hex. Component CSS
  lives in `@layer tcl.components`. Tokens are defined once in `@trembus/tokens`
  (`packages/tokens/src/css/tokens.*.css`); light is the default, dark via `[data-theme="dark"]`.
- **TypeScript**: `verbatimModuleSyntax` is on → use `import type { … }` for type-only
  imports (shared compiler options in root `tsconfig.base.json`). `noUncheckedSideEffectImports`
  is on → CSS imports rely on each package's `src/global.d.ts`.
- **Accessibility**: every component test asserts
  `expect(await a11yViolations(container)).toEqual([])` from `@trembus/tokens/testing` — it disables page-level axe rules
  (region / landmark / page-has-heading-one) that false-positive on isolated fragments and portals,
  and passes `preload: false` so axe doesn't hang ~10s trying to load `<audio>`/`<video>` media in
  jsdom (the async media rules never apply to a fragment anyway). `.storybook/preview.tsx` disables
  the same page-level rules for the browser a11y gate.
- **Compose from primitives** (`@trembus/ui`): `Box` (Surface), `Stack`/`Inline` (Relation),
  `Text` (Mark), `Pressable` (Affordance — owns the interaction FSM → `data-state`). Compound
  components use `Object.assign(Root, { Sub })`. `asChild` uses `packages/ui/src/utils/Slot`.
  (`@trembus/viz` components compose NO primitives — raw HTML/SVG + `@trembus/tokens` only.)
- Labeled controls (Input/Textarea/Select) share `packages/ui/src/internal/field` (FieldShell +
  useFieldIds) — one source of truth for label/description/error wiring.
- **Storybook docs descriptions**: every component ships all three description layers — the JSDoc
  docs intro above `const meta`, a `/** Job: <UI job> — … */` line above every story export, and prop
  TSDoc (the recipe is in the `/new-component` skill). Keep backticked code spans on ONE comment
  line — a span wrapped across lines renders as a code block with a Copy chip mid-bullet.

## Gotchas (learned the hard way — don't rediscover these)

- **Storybook + a required prop + a render-only story** → Storybook's types STILL demand
  `args`. Put a default in the meta `args` (e.g. Dialog/Select/Tooltip/Hub).
- **jsx-a11y**: keep interaction handlers off a container with a composite role (e.g.
  `tablist`/`menu`) — put them on the focusable children.
- **Portals render synchronously** (no deferred `useEffect` mount) so a parent's focus/measure
  effect sees the node on the same commit (see `packages/ui/src/utils/Portal.tsx`).
- **attw**: this is an ESM-only package — `verify:exports` runs with `--profile esm-only` and
  excludes the `./styles.css` entrypoint.
- **Viz datum ids — never fall back to the label.** Use `id ?? \`s${i}\``(index), NOT`id ?? label`. Duplicate labels/names with no id collide → wrong inspector target, double
selection rings, duplicate React keys. Recurred in LineChart/Donut/Heatmap — same fix each time.
**Tier-2 exception** (`@trembus/viz`): node ids are REQUIRED (parents/edges reference them) — no
index fallback. Instead dedup duplicates (first wins), remap missing parents to a synthetic root,
and derive a **collision-proof** synthetic-root id (suffix until unused) so a node literally named
like the sentinel can't make `d3.stratify` throw and blank the whole tree (Tree).
- **Forced viz domains must clamp.** A forced `min`/`max` (or band/target) can invert the scale or
  push points/lines outside the plot box. Guard `hi <= lo`, swap inverted pairs, SVG `clipPath` the
  series, and skip overlay buttons whose value is out of domain (no phantom clickables).
- **A clamped meter must clamp everywhere.** Clamp the value ONCE and feed the same number to the
  needle, readout, `aria-valuenow` AND `aria-valuetext` — else a screen reader announces two
  different values for out-of-range input (Gauge).
- **`color-mix(in oklab, <tone> N%, var(--tcl-surface-sunken))`** is the tokens-only way to make a
  continuous intensity scale (Heatmap); for cell text over arbitrary mixes use `var(--tcl-text)` +
  a `var(--tcl-bg)` halo so it stays legible on both dark and bright cells, in both themes.
- **Inline text on a SOLID tone fill uses the tone's `-fg` token, not `var(--tcl-text)`.** The
  status tokens are AA-tuned for white in light theme and dark-fg in dark theme, so a solid-tone
  cell (Treemap) must set its text to `var(--tcl-status-<tone>-fg)` / `var(--tcl-accent-fg)` — plain
  `--tcl-text` fails contrast on the darker light-theme tones. Custom hex fills can't map to a tone
  fg → fall back to `--tcl-text` + the `--tcl-bg` halo above.
- **A clamped bar must clamp its label too.** If a bar's width is capped (`clampPct`), the % it
  prints must clamp to the same ceiling — else an out-of-order/non-monotonic datum shows e.g. "150%"
  next to a full bar (Funnel: conversion vs top, and "% retained"). Size bars against the largest
  datum (not strictly the first) so a zero/low reference can't collapse every bar to empty.
- **By-name registry lookups need `Object.hasOwn`.** Any `REGISTRY[name]` where the name comes
  from authored JSON (glyph names, lane kinds, op codes) resolves prototype-chain keys
  (`'constructor'`, `'toString'`) to inherited functions — React then renders a function as a
  component and the whole tree unmounts. Guard with
  `Object.hasOwn(REG, key) ? REG[key] : fallback`; icons' `Glyph` (0.2.0) does it centrally,
  Swimlane's `KIND_GLYPH`/marker lookup and RunHistory's `OP_META` mirror it.
- **Portaled popup content stacks on the popover layer, not dropdown.** Anything that portals
  to `<body>` and can be opened from inside a `Dialog` (Menu today; a future Select/Popover)
  takes `--tcl-z-popover` (1350 — above modal 1300, below toast/tooltip), or it renders BEHIND
  the dialog overlay: present in the a11y tree, invisible on screen. The same composition also
  needs Dialog's press-outside-to-close to ignore presses inside the portaled popup (it exempts
  `[role="menu"]`) and the popup's Escape to `stopPropagation` so layers peel one per press
  (ui 0.8.1 / tokens 0.2.0; `Components/Menu → InsideDialog` is the regression story).
- **An `aria-live` readout does NOT re-announce identical text.** Same string = no DOM
  mutation = silence, so a repeated action (retry a send, run the same command twice) is
  never confirmed. Wrap the message in a `<span key={n}>` where `n` counts activations —
  React swaps the node, the mutation fires, the screen reader speaks (CommandBar's status
  line; the regression test asserts the node identity changed).
- **Responsive "collapse what doesn't fit" must measure the ROOT, never the bar.** Measuring
  the content-sized element feeds back into itself (collapse → narrower → collapse again).
  Give the component a full-width block root, measure THAT, keep bar children `flex: none`
  (a squished cluster corrupts the natural measurement), capture each group's right edge
  ONCE while nothing is collapsed (edges, not summed widths, fold in gaps/separators/padding),
  and treat an unmeasurable width (jsdom / SSR / `display:none`) as "show everything" —
  collapsing on a `0` measurement hides the whole bar behind a `⋯` nobody asked for
  (CommandBar).
- **Never `@import` a sibling package's `styles.css` from a package style entry.** Vite's CSS
  pipeline inlines dependency CSS even when the JS is externalized (`rollupOptions.external`
  does not apply to CSS), so the dist bundle freezes a stale snapshot of the dep's styles that
  later overrides a newer copy the consumer imported directly (game-viz built against ui 0.7.0
  stomped ui 0.8.1's Menu popover fix, 2026-07-18 → game-viz 0.4.0). Each package's styles.css
  carries only its OWN component CSS plus `@trembus/tokens/layers.css` (the idempotent
  cascade-order one-liner); the tokens FOUNDATION inlined by ui/viz styles.css is the one
  deliberate exception (tokens changes ship as lockstep releases). Consumers import each
  package's styles.css themselves.
- **Never animate the SIZE of a container whose children measure it.** `VirtualAssetGrid`,
  `Hub`, `Swimlane` and `Timeline` lay out from a measured container width/height; a CSS
  transition on the box around them fires a ResizeObserver relayout per animation frame.
  Snap between sizes instead — Dialog's `expandable` toggles `size` ↔ `full` with no
  transition for exactly this reason (ui 0.11.0).
- **Text floated OUTSIDE its box needs `width: max-content`.** An absolutely-positioned
  child anchored `left: 50%` (+ `translateX(-50%)`) shrink-to-fits against the REMAINING
  half of its containing block — 72px of a 144px capsule — so `max-width` never gets a
  say and the label silently truncates to "Ticket →…". Set `width: max-content` and cap
  it with `max-width` (MilestoneTrack's `labelPlacement="outside"`, ui 0.12.0). The same
  trick keeps a count/meter stack from wrapping under the box it annotates.
- **Wrapping a laid-out sequence into ROWS?** Make the single row the one-row case of the
  general model rather than branching — MilestoneTrack derives every rail y, x, and
  connector from a `PlacedRow[]`, so the pre-existing single-rail output stays
  pixel-identical by construction (ui 0.12.0). Two things bite: per-row React keys (a key
  built from an x coordinate collides across same-direction rows) and — in the
  **`serpentine`** mode specifically — mirrored rows, where every `x1 < x2` assumption in
  edges, whiskers, and attach points needs a `min`/`max`. The later **`wrap`** mode
  (carriage-return rows, all `dir: 1`, one return connector back to the left margin) is
  the cheaper wrap precisely because it has no mirrored rows to mirror-proof.

## Visualizations

Data-driven viz components (e.g. `Hub`) consume the **Trembus Visual Grammar** JSON contracts
(schemas: the Visual Grammar kit's `schema/` folder — the `LLM-Agent-Development/canonical/kits/visual-grammar/`
path once named here no longer exists; the last copy on disk is `Repositories/_archive/Flow-Explorer/packages/visual-grammar/schema/`).
Mirror the schema as a TS type so ONE contract renders in both the static HTML kit and React.
Title these `Visualizations/*` in Storybook. Tier-1 (deterministic layout, no heavy deps) lives
in `@trembus/ui`; **Tier-2** (node-link graphs needing a layout engine) lives in the sibling
**`@trembus/viz`** package — `ls packages/viz/src/components` is the roster and each component's docs
block says when to use it. Tier-2 reuses one viz spine via `packages/viz/src/internal/` (`VizOverlay` =
decorative aria-hidden `preserveAspectRatio` SVG edges + HTML `<button>` nodes positioned by `%`;
`useControllableSelection`/`useControllableSet`/`useControllableMap`; the aria-live inspector). Mirror
each Tier-2 contract as a VG schema too (`tree.schema.json`). Contracts that are rules, not roster:
`Strata` — dangling `restsOn` refs auto-materialize dashed GAP arcs (discovery opportunities, never
errors) and there is NO ring-thickness floor, rings compress so deep maps never escape the plot box;
`TalentTree` — the allocation engine's safe deallocation never orphans a dependent, and the
`--tcl-talenttree-accent` skin hook is read via fallback and never declared on the component root, so
`game-viz`'s `Constellation` can remap it from an ancestor.

**The Tier-1 viz spine** (Hub · BarChart · LineChart · DonutChart · Heatmap): lead job is
_reveal-state_, but afford/acknowledge are real — each datum is a focusable **HTML `<button>`**
(not an SVG node) carrying the accessible name, driven by controlled/uncontrolled `selectedId`
(+ `defaultSelectedId` + `onSelect`), with an `aria-live` **inspector** revealing the selected
datum. The SVG/grid is decorative (`aria-hidden`); when points live inside an SVG (LineChart),
overlay HTML buttons positioned by `%` over a `preserveAspectRatio` chart so axis text never
distorts and selection stays accessible. **Gauge** (`role=meter` + `aria-valuetext`) and
**Sparkline** (`role=img`/decorative) are the presentational exceptions — they declare
afford/acknowledge as "presentational" like Badge/Skeleton and may name their third story
descriptively (`Labeled`/`Zones`); the checker only requires the contract to point at a real story.
