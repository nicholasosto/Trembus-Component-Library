# @trembus/ui — guide for Codex

Web React component library (NOT Roblox — that's the separate `@trembus/rbx-ui`).
First-principles UX: tokens → primitives → components, each carrying a machine-checked
"3 UI jobs" contract (Reveal State / Afford Action / Acknowledge Input).

## Workspace

This repo is a **pnpm workspace** with five **library** packages under `packages/` (plus a sixth
member — the non-gated `@trembus/video` Remotion app, see _Motion / video_ below):

- **`@trembus/tokens`** (`packages/tokens/`) — the shared design-token foundation: the
  `var(--tcl-*)` token CSS (`src/css/tokens.*.css` + `layers.css`), the type-safe token ontology,
  the color-coded tone vocabulary, the `ComponentContract` type (`@trembus/tokens/contract`), and
  the axe `a11yViolations` helper (`@trembus/tokens/testing`). React-free; exported from source.
- **`@trembus/icons`** (`packages/icons/`) — the shared glyph set (node-kind / file-type marks +
  UI affordances) de-duplicated out of `ui` and `viz`. A React-only foundation **leaf**: no
  `@trembus/tokens` dep, no CSS, `sideEffects:false`. Ships tree-shakeable `*Icon` components + a
  `GLYPHS` / `<Glyph name>` registry + `SYSTEM_KIND_GLYPH` / `extToGlyph` maps; consumed by `ui`,
  `viz`, `game-viz`. Lives in `src/icons/` (not `src/components/`), so it sits outside the contract
  gate. `viz` re-exports it from `src/internal/index.ts`; `ui`'s FolderTree imports it directly.
- **`@trembus/ui`** (`packages/ui/`) — this component library. Depends on `@trembus/tokens`; keeps
  re-export shims (`src/tokens`, `src/types/contract`, `src/test/a11y`) so its internal import
  paths and public API are unchanged.
- **`@trembus/viz`** (`packages/viz/`) — Tier-2 node-link visualizations (`Tree`, …). Depends on
  `@trembus/tokens` **only**, never on `@trembus/ui`.
- **`@trembus/game-viz`** (`packages/game-viz/`) — expressive **game / cinematic** UI
  (`Reliquary`, `SoulCard`, `EpisodeDeck`, `CinematicHero`, `Chronicle`, `Effigy`, `MediaFrame`),
  titled `Game/*`.
  Liturgical-gothic idiom: HUD frames, character dossiers, episode decks, title plates, 3D model
  thumbnails (`Effigy` wraps Google `<model-viewer>` — the repo's first 3D primitive). UNLIKE
  `@trembus/viz`
  (tokens-only), it **builds on `@trembus/ui`** (composes `Box`/`Stack`/`Inline`/`Text`/`Pressable`
  - reuses materials), so it depends on `@trembus/ui`, `@trembus/icons`, and `@trembus/tokens` (the
    `@trembus/icons` dep arrived with `MediaFrame`'s doc/fallback `Glyph` plate). Same 3-jobs
    contract + axe discipline — "theatrical surface, accessible spine" (decorative chrome
    `aria-hidden`, interactive bits are real focusable controls, tone-coding always paired with a
    word, motion behind `prefers-reduced-motion`). **Tone-as-text gotcha:** a tone painted as TEXT
    needs a legibility-safe variant — map `accent → var(--tcl-text)` (gold-on-light fails AA ~1.8:1;
    the Badge precedent) and keep the full tone only on borders/tints/strokes.

Run gates at the **root** (`pnpm validate` orchestrates every package via `pnpm -r` + one
Storybook build) or per package (`pnpm --filter @trembus/<pkg> validate`). One root `.storybook/`
globs `packages/*`; shared compiler options in root `tsconfig.base.json`;
`scripts/check-contracts.ts` is package-parameterized.

**Motion / video — `@trembus/video`** (`packages/video/`, private, **not a published library**) is a
**Remotion** app that renders the real components to video: a composition `import`s the actual
`@trembus/game-viz` component **and** `@trembus/game-viz/styles.css`, so the whole
`@layer`/`var(--tcl-*)`/`color-mix` token system renders in headless Chromium with zero re-authoring
(verified — a `CinematicHero` promo renders at full fidelity). It sits **outside the `pnpm validate`
gate** (no `*.contract.ts`, no axe): its scripts are named off the gated set
(`studio`/`render`/`still`/`tc`) so `pnpm -r` skips it, and `packages/video` is excluded from the root
`eslint`/`prettier` scope. **Remotion gotchas:** drive motion off `useCurrentFrame()` — it does NOT
mock the wall clock, so the components' own CSS transitions / `model-viewer` rAF won't animate
(reuse the look, own the motion in frame-space); load `--tcl-font-display` explicitly (the repo ships
no Cinzel face — use `@remotion/google-fonts`); set `data-theme` per composition; pin all
`@remotion/*` to ONE exact version. Remotion is **source-available** (free ≤3 people, paid Company
License at 4+). See `packages/video/README.md`.

## Commands

- `pnpm run validate` — the full gate: lint → typecheck → check:contracts → test → build →
  verify:exports → build:storybook. Run before declaring work done.
  NOTE: it is `validate`, not `ci` (pnpm reserves the `ci` command).
- `pnpm test` — unit tests (jsdom + axe), runs anywhere.
  `pnpm test:stories` runs stories in a real browser and needs
  `pnpm exec playwright install chromium` first.
- `pnpm dev` — Storybook (docs + playground) on :6006.
- `pnpm check:contracts` — enforce the 3-jobs contract per component.

## Visual preview — Codex drives Storybook live

Boot Storybook through the **Claude_Preview MCP**, not Bash: `preview_start({name:'storybook'})`
reads `.Codex/launch.json` (`storybook dev -p 6006 --ci`) and serves on :6006; then
`preview_screenshot` / `preview_snapshot` / `preview_click` / `preview_eval` /
`preview_console_logs` drive it. Eyeball a component here before the `validate` gate.

- **Theme**: global `theme` (`light|dark`) → `data-theme` on `<html>` (`.storybook/preview.tsx`).
  Force dark by navigating with `&globals=theme:dark`.
- **Story ids** slugify the title — `components-button--states`, `visualizations-hub--default`.
- **Responsive**: `preview_resize` mobile/tablet/desktop presets.

## Adding a component — the canonical 5-file shape

Fastest path: `node .Codex/skills/new-component/scaffold.mjs <Name> [--pkg ui|viz|game-viz]` (the
`/new-component` skill). `--pkg` defaults to `ui` (titled `Components/*`); `--pkg viz` titles
`Visualizations/*` and `--pkg game-viz` titles `Game/*`, both wiring the shared `@trembus/tokens`
imports. It scaffolds the shape below and wires the barrel.

Every component in `packages/<pkg>/src/components/<Name>/` has EXACTLY:
`<Name>.tsx · <Name>.css · <Name>.contract.ts · <Name>.stories.tsx · <Name>.test.tsx`

- Export it from `packages/<pkg>/src/index.ts` (the barrel); `contract.name` must equal the
  directory name.
- `scripts/check-contracts.ts` enforces the shape + that each of the three jobs names a real
  exported story. Use the story names `Default` / `States` / `Interaction`.

## Example pages (multi-component compositions)

Pages that group several components together are NOT library components — they have no single
"3 jobs" contract. Put them in `packages/ui/src/examples/`, **not** `…/src/components/` (the
contract checker scans every `src/components/<Name>/` dir per package and would fail the gate
demanding a contract). A plain `<Name>.stories.tsx` there is all you need — no contract / css /
test files; Storybook still finds it via the `packages/*/src/**/*.stories.tsx` glob. Title them
`Examples/*` and compose from the public barrel (`../index`) so the example exercises the real
consumer API. See `packages/ui/src/examples/Dashboard.stories.tsx`.

## Demo sites (multi-page apps)

A **demo site** is a real consuming app — multiple **routed** pages, an app shell, navigation,
root-level theme — exercising the components the way a downstream product does (which neither
Storybook nor the `Examples/*` single-canvas stories cover). They live under the top-level
**`demos/*`** workspace glob (NOT `packages/`), each a private Vite + react-router SPA. First one
shipped: `demos/soul-steel/` (composes all three packages; see its `README.md`).

- **Consume the PUBLISHED API only** — import the bare specifiers (`@trembus/ui`, `@trembus/viz`,
  `@trembus/game-viz`) + each package's `./styles.css`, never deep/relative `packages/*/src` paths.
  Each styles.css bundles the full `@trembus/tokens` layer system, so the libs must be **built**
  first (the demo resolves their `dist/`) — that's the point: it dog-foods the real consumer surface.
- **Off the `validate` gate**, like `packages/video`: living under `demos/` keeps it invisible to
  `scripts/check-contracts.ts` (scoped to `packages/{ui,viz,game-viz}`); it's in the root
  `eslint`/`prettier` ignores; and its scripts are named OFF the gated set (`dev` / `build:site` /
  `preview` / `tc`, not `build` / `test` / `typecheck`) so `pnpm -r <gated>` skips it.
- **Dog-food check** is deliberate + separate: `pnpm demos:check` (root) builds the three libs, then
  `tc` + `build:site` every demo. Run it (or a dedicated CI job) to catch consumer-facing API breaks
  without letting a WIP demo page block a library release.
- Preview live via the Claude_Preview MCP — `.Codex/launch.json` has a `soul-steel` config
  (`preview_start({name:'soul-steel'})` → :5174). Same `data-theme` + `.tcl-root` wrapper as Storybook.

## Conventions

- **Tokens only**: components reference `var(--tcl-*)` — never hardcode a hex. Component CSS
  lives in `@layer tcl.components`. Tokens are defined once in `@trembus/tokens`
  (`packages/tokens/src/css/tokens.*.css`); light is the default, dark via `[data-theme="dark"]`.
- **TypeScript**: `verbatimModuleSyntax` is on → use `import type { … }` for type-only
  imports (shared compiler options in root `tsconfig.base.json`). `noUncheckedSideEffectImports`
  is on → CSS imports rely on each package's `src/global.d.ts`.
- **Accessibility**: every component test asserts
  `expect(await a11yViolations(container)).toEqual([])` from `@trembus/tokens/testing` (`@trembus/ui`
  keeps a re-export shim at `packages/ui/src/test/a11y.ts`) — it disables page-level axe rules
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

## Visualizations

Data-driven viz components (e.g. `Hub`) consume the **Trembus Visual Grammar** JSON contracts
(schemas at `…/Project-Spaces/LLM-Agent-Development/canonical/kits/visual-grammar/schema/`).
Mirror the schema as a TS type so ONE contract renders in both the static HTML kit and React.
Title these `Visualizations/*` in Storybook. Tier-1 (deterministic layout, no heavy deps) lives
in `@trembus/ui`; **Tier-2** (node-link graphs needing a layout engine) lives in the sibling
**`@trembus/viz`** package — `Tree` (strict hierarchy via `d3-hierarchy`; org-chart / file-tree /
dendrogram) and `Lineage` (directed-graph / DAG via `@dagrejs/dagre`; pipeline · data-lineage ·
dependency · genealogy) both shipped. Tier-2 reuses the same viz
spine via `packages/viz/src/internal/` (`VizOverlay` = decorative aria-hidden `preserveAspectRatio`
SVG edges + HTML `<button>` nodes positioned by `%`; `useControllableSelection`/`useControllableSet`;
the aria-live inspector). Mirror each Tier-2 contract as a VG schema too (`tree.schema.json`).

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
