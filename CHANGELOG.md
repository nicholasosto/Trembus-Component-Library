# Changelog

All notable changes to the published `@trembus/*` packages are documented here. The
format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
packages aim to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Documentation pass: monorepo landing README, per-package npm READMEs with badges,
  package `keywords`, a published Storybook gallery on GitHub Pages, and contributor docs.

## [@trembus/ui 0.13.0] — 2026-08

### Added

- **`Assay` (`@trembus/ui`)** — `Visualizations/Assay`, a weighted-rubric evaluation: the
  component for any decision where the SCORE matters less than *why* it came out that way.
  Each criterion's track is sized by its **weight** and filled by its **score**, so inked
  length is literal contribution and the weighted maths is visible geometry rather than a
  footnote; penalties claw points back in `danger`; the total lands on a banded verdict
  scale (skip / inline / trace / engram, or any bands you define); and the card footer
  prints the equation, scale base included, so it actually sums. One candidate renders the
  detail card, several render a ranked board where selecting a row assays it — the
  inspector IS the card, so the n=1 layout is the general model's one-candidate case.

  Standard Tier-1 spine: every board row is a focusable button with a roving tabindex
  (Arrow/Home/End, selection follows focus), controlled/uncontrolled `selectedId`, and an
  aria-live line announcing label, total, verdict and any penalties with their reasons.
  Verdict tone is always paired with the verdict word; relative weights are normalized to
  Σ 1 and a non-unit authored sum is disclosed as `(normalized)`, never silently rescaled.
  Junk degrades rather than misleads — ids dedup first-wins, scores and penalties clamp,
  an all-invalid weight set falls back to an equal split, and tones are laundered through
  the shared `Object.hasOwn`-guarded fillbar registry so an authored `"constructor"` can
  never paint an invisible fill. New exported types: `AssayContract`, `AssayCriterion`,
  `AssayCandidate`, `AssayPenalty`, `AssayBand`, `AssayScale`, `AssayTone`.
- **`MilestoneTrack` learns to read like text** — `layout="wrap"` wraps the same one
  pipeline into **carriage-return rows**: every row reads left→right and a single return
  connector carries the rail out to the right margin, back across the full width in its own
  return band, and down into the next row's lead-in, marked with left-pointing chevrons so it
  can't be misread as forward flow. It is the mode to reach for when the track has to READ
  like text — and because no row is mirrored, none of serpentine's right→left direction cues
  appear. Rows still come from `groups`; the new **`rowLength`** prop subdivides each group run
  into chunks of N stations (only the first chunk keeps the group header) and is the only way
  to wrap a track with no groups at all. Both default to the 0.12.0 behavior, so an existing
  track renders pixel-for-pixel unchanged. `MilestoneTrackLayout` gains `'wrap'`.

### Fixed

- **`MilestoneTrack`** — a measured value above ~1.8e306 overflowed the two-decimal rounding
  and printed the word "Infinity" in the capsule readout, the header total, and the capsule's
  accessible name; the raw value is now printed instead.

## [@trembus/viz 0.6.0] — 2026-08

### Added

- **`Nebula` (`@trembus/viz`)** — `Visualizations/Nebula`, the first viz in the roster that
  encodes relatedness as **distance** rather than as an edge: items sit at real 3D
  coordinates, project to 2D, and rotate under the pointer or the keyboard, so "how close
  are these two ideas?" is answered by where they land instead of by tracing lines. Layout
  is deterministic — a shortest-path completion of the authored link weights feeds a
  hand-rolled classical MDS (`src/internal/nebulaMath.ts`), so the same contract always
  produces the same map — or supply your own `position` triples from an offline embedding
  and set `layout='given'`. No WebGL and no new dependency: depth reads through scale,
  `color-mix` fade and per-node `zIndex`, and group clouds tint with the shared tone
  ontology.

  Accessible spine intact despite the 3D: nodes stay real focusable HTML `<button>`s over
  an `aria-hidden` scene, with the controlled/uncontrolled `selectedId` trio and an
  aria-live inspector that reads out the selected item's **ranked nearest neighbours with
  weights** — the textual equivalent of the proximity the sighted reader gets for free.
  Rotation is drag + arrow keys with a reset; the opt-in `autoOrbit` is double-gated behind
  `prefers-reduced-motion` and a real pause control (the `Effigy` precedent).

## [@trembus/ui 0.12.0] — 2026-07

### Added

- **`MilestoneTrack` learns to wrap and to weigh** — three additive props turn the single
  lead-time rail into a business-process map that shows where the work piles up. All three
  default to the 0.11.0 behavior, so an existing track renders pixel-for-pixel unchanged.

  **`layout="serpentine"`** wraps the SAME one pipeline into alternating-direction rows —
  **one row per `groups` entry**, so each sub-system (Salesforce · Jira Service Desk ·
  Projector) gets its own line — joined end-to-start by U-turn connectors that carry the
  rail, its pending dashes, and a direction chevron around the bend. Row header chips
  replace the horizontal band chrome; stations outside any group form their own unlabeled
  rows; overlapping groups keep their accessible names but yield row-making to the first;
  with no groups the track simply stays one row. A metric that spans a row break — the
  cross-system handoff wait, very often the real bottleneck — renders as a full capsule on
  the next row's lead-in, and a measured span crossing rows splits its dotted whisker per
  row rather than chasing the rail around the turn. Reading order and tab order stay flow
  order throughout; connectors, chevrons, and row headers are decorative.

  **`bubbleSizing="scaled"`** maps each interval's share of the measured total to its
  capsule height (60–128px), so the worst bottleneck literally swells the pipe instead of
  relying on a 72px meter to say so. Where shares are uncomputable — mixed units, or a
  single metric — the new per-metric **`weight`** field carries the ratio instead; with
  neither, capsules stay uniform. Small capsules go compact, trading their sample count and
  meter for legibility (both still announced by the inspector).

  **`labelPlacement="outside"`** leaves only the measured value inside the pillow, lifting
  the interval label above it and dropping the sample count + share meter below — the
  value-stream reading. It keeps small capsules legible and lets long interval names run
  past the capsule width. Still one button, one accessible name, one selection ring.

  New exported types: `MilestoneTrackLayout`, `MilestoneBubbleSizing`,
  `MilestoneLabelPlacement`.

### Fixed

- **`MilestoneTrack`** — an anonymous metric's index-fallback key could squat on another
  metric's authored `id` (`[{from,to,…}, {id:'m0',…}]` handed the anonymous bubble the key
  `m0`), so `selectedId="m0"` pressed the wrong bubble and `onSelect` reported an id absent
  from the consumer's data. Metric fallbacks now skip authored ids, matching the guarantee
  stations and groups already had.

## [@trembus/ui 0.11.0] — 2026-07

### Added

- **`MilestoneTrack` (`@trembus/ui`)** — `Visualizations/MilestoneTrack`, a lead-time rail: one
  horizontal pipeline whose rail **swells into measured interval bubbles** between milestone
  stations (value + sample count + a share-of-total meter, so a 26 d interval visibly outweighs a
  2.6 d one), with source-system group bands (`@trembus/icons` glyphs), dashed handoff dividers at
  band seams, dashed pending segments, a dotted whisker underlining non-adjacent measured spans,
  and a flow arrowhead. Standard Tier-1 spine: every station and bubble is a focusable button,
  controlled/uncontrolled `selectedId`, aria-live inspector (which carries the share-of-total),
  computed "measured" total in the header meta, `--tcl-milestonetrack-accent` skin hook read via
  fallback. Metrics reference stations by id or label, may span several stations (the bubble takes
  the last free gap before `to`), and invalid/negative/crowded-out metrics are dropped rather than
  rendered wrong.
- **`Dialog` grows to host the data-dense tier** — `size` gains `xl` (960px) and `full`
  (viewport-filling), plus `expandable` with a header control that toggles `size` ↔ `full`
  (controllable via `expanded` / `defaultExpanded` / `onExpandedChange`, named by `expandLabel` /
  `collapseLabel`). `DialogSize` is exported. Until now the largest panel was `lg` at 640px while
  `Brief` alone wants 760, so every document and visualization component had to take over a page
  instead of opening in a modal.

  Two properties make the dense case actually work: the panel is now a **flex column whose BODY
  scrolls** — a long table keeps its sticky header and its footer actions instead of scrolling
  them away — and `full` gives the panel a **resolved height**, which is what `VirtualAssetGrid`,
  `Hub`, `Swimlane` and `Timeline` need, since they measure their container to lay out. Nothing
  animates on expand, deliberately: a width/height transition would fire a ResizeObserver storm in
  exactly those children. Existing `sm`/`md`/`lg` dialogs are visually unchanged.

### Changed

- **Component review (`COMPONENT-REVIEW.md`)** — first audit of the library as a set: 60
  components, 8 overlapping families, three tests per family (intent / semantics / duplication).
  Verdict: **zero merges, zero deprecations** — every family's boundary is load-bearing and
  already documented. Rendered in Storybook as `Examples/Component Review` (Brief + two
  DecisionMaps).
- **`useSelection` internal (`@trembus/ui`)** — the controlled/uncontrolled `selectedId` spine was
  inlined verbatim in 9 places; `@trembus/viz` had extracted the same five lines long ago and it
  was never back-ported. Now shared by `Hub`, `BarChart`, `LineChart`, `DonutChart`, `Treemap`,
  `Funnel`, `Swimlane`, `Timeline` and `Heatmap` (twice — cell + row). Behaviour-preserving, no
  public API change. `DecisionMap`, `FolderTree` and `VirtualAssetGrid` keep their own for
  documented reasons (lazy data-seeded initial state; selection paired with a roving-focus id).
- **`Meter` no longer calls its `threshold` variant "a gauge"** — `Gauge` is a separate component
  carrying the same `role="meter"`, so shape is the only separator. Both components' boundary
  lines now say so, and `Treemap` gained the hard "not for" line its siblings already had.
- **`CLAUDE.md` / `AGENTS.md`** — corrected the claim that game-viz composes the `ui` primitives:
  five of eight do; `Reliquary`, `Effigy` and `EpisodeDeck` are self-contained chrome.

## [@trembus/ui 0.10.0] — 2026-07

### Added

- **`CommandBar`** — a data-driven command dock over the `Toolbar` + `Menu` spine, promoted
  from the `Examples/Command Bar` composition (that example story is retired). One
  `groups: CommandGroup[]` model renders separator-divided `role="group"` clusters of real
  controls under a single Tab stop; a `Command` with nested `commands` progressively
  discloses into a menu and one submenu; groups that no longer fit the container collapse
  into a "⋯" overflow menu under their group headings; and an `aria-live` readout under the
  bar echoes the command just invoked (`status` controlled, or `formatStatus` uncontrolled —
  the readout node is replaced per activation so a repeat is re-announced). Commands carry
  `glyph` (`@trembus/icons` name), `tone` (`neutral`/`accent`/`danger`, painted as text so it
  stays AA in every theme), `disabled`, `pressed` (→ `aria-pressed`), `showLabel` and `hint`
  (part of the accessible name — "offline" is why a command is unavailable). Bar props:
  `label` (required) · `side` · `align` · `overflow` · `overflowLabel` · `meta` ·
  `showStatus` · `onCommand`.

  Overflow is measured, not guessed: natural group edges are captured once while nothing is
  collapsed, and an unmeasurable width (jsdom / SSR / `display:none`) shows every group
  rather than hiding the bar behind a "⋯". The root is full-width by design, so overflow
  needs a width-constrained parent.

## [@trembus/ui 0.9.0] — 2026-07

### Added

- **`Brief` dynamic resize** — new `resizable` prop renders an APG window-splitter on the
  inline-end edge: a focusable `role="separator"` handle with live `aria-value*`
  (Arrow ±16px, Shift+Arrow ±64px, Home/End to the bounds, Enter or double-click resets),
  offset-preserving pointer drag, RTL-aware senses. Width is controllable
  (`width` / `defaultWidth` / `onWidthChange`) and clamped to `minWidth`/`maxWidth`
  (360/1200) plus the live container. Below ~480px of measured width the layout
  self-tightens (`data-size="narrow"`); new `--tcl-brief-max-width` skin hook. Default
  off — the rendered DOM is unchanged unless enabled.
- **`Brief` vocabulary** — doc `kind: 'session'` (the work-log archetype; gold accent,
  `Session` label) and checklist `severity: 'success'` (the met-state green row), both
  recognized by `parseBrief` without issues.
- **Session work-log template** — `Examples/Session Brief`: a deterministic
  `sessionToBrief` adapter (in-repo example, not in the tarball) that maps project-system
  `_project/sessions/` records onto Brief sub-components with lifecycle-aware indicators —
  status-toned pills, a `filled n/m sections` progress pill, scaffold placeholders as
  "Not yet recorded" notes, blockers as danger rows or one success all-clear, and the
  records' own `observation → disposition` grammar as decisions rows. Exercised on real
  records from three project spaces; a `TemplateSpec` story renders the mapping design
  itself as a Brief.
- **Gallery: `Examples/Game Design Document`** (lives in `packages/game-viz/src/examples/`,
  repo/gallery-only) — the full three-package showcase: CinematicHero cover, a resizable
  Brief beside an auto-fit appendix (Stats, SoulCard class sheets, EpisodeDeck,
  MediaFrame, Table), Chronicle production timeline, and a Constellation talent page.

### Changed

- **`VirtualAssetGrid`** now consumes the shared `src/internal/useElementSize` (promoted
  from its inlined copy for `Brief`'s adaptive layout). No behavior change.

## [@trembus/ui 0.8.4] — 2026-07

### Changed

- **`FolderTree` infers file glyphs via `fileToGlyph`** (was bare `extToGlyph`) — file
  trees now recognize well-known basenames (SKILL.md → book, CLAUDE.md/AGENTS.md → robot,
  MEMORY.md → brain, `.env`/`.env.*` → key, package.json → box…) and the widened extension
  coverage (images, audio, video, 3D models, shell, YAML). Explicit `icon` overrides are
  untouched. Requires `@trembus/icons` ^0.3.0 (the dependency range moves with this release).

### Added

- **Storybook gallery: `Examples/Package Dossier`** — a monorepo package-viewer page
  composed from the public barrel (Brief as the progressively-disclosed API spine +
  Badge/Callout/Table/Button chrome, master rail + detail layout). Example-only: ships in
  the Storybook gallery, not in the npm package.

## [@trembus/icons 0.3.0] — 2026-07

### Added

- **The workflow-output icon language** — 13 new hand-authored glyphs
  (clock · gear · gamepad · waveform · video · model-3d · sliders · key · brain · book ·
  message · venn · play) covering what human+AI workflow steps emit, organized into five
  command-center categories (Code—Tools · Application · Media · Configuration · Context).
  New string-only maps: `OUTPUT_CATEGORY_GLYPH`, `OUTPUT_KIND_GLYPH` (kind → glyph, e.g.
  `engram` → brain, `job` → clock, `game` → gamepad), and `PROVENANCE_GLYPH`
  (human → user, ai → robot, conjoined → venn — badge a kind glyph to say who produced it).
  `EXT_GLYPH` now covers images, audio, video, 3D models (incl. `.rbxm`/`.rbxmx`/`.blend`),
  shell scripts, YAML/TOML, ini/cfg/conf, and `.pem`. New `fileToGlyph(label)` +
  `WELL_KNOWN_FILE_GLYPH` resolve role-defining basenames before extensions:
  `SKILL.md` → book, `CLAUDE.md`/`AGENTS.md` → robot, `MEMORY.md` → brain, `.env`/
  `.env.*` → key, `package.json` → box, `Dockerfile` → box, `Makefile` → terminal,
  `README.md` → book. The `Foundations/Icons` Storybook page gains an **Output Language**
  spec-sheet story (categories, provenance marks, badge composition, well-known files).

## [@trembus/tokens 0.2.2] — 2026-07

### Fixed

- **`ThemeName` now includes `'reliquary'`.** The theme fully ships
  (`tokens.reliquary.css`, the `./reliquary.css` export, the Storybook theme toolbar) but
  the union stayed `'light' | 'dark'`, forcing consumers to widen or cast the attribute
  value locally. Type-only widening — no CSS or runtime change.

## [@trembus/ui 0.8.3] — 2026-07

### Changed

- **Storybook docs + `.d.ts` TSDoc pass over the entire surface** — all 46 components
  plus the 4 primitives (Box · Pressable · Stack/Inline · Text). Every docs page now
  opens with an organized component description (When to use it · Data & key props ·
  Accessibility · Theming & setup — accessibility claims verified against source),
  every story carries a job-mapped description, and missing prop TSDoc was filled —
  the TSDoc ships in the published `.d.ts`, so editor hover docs improve too.
  Comment-only: no runtime, type, or CSS change. Two stale id-fallback TSDoc comments
  were corrected to match the code (`DonutChart` segment ids and `LineChart` series ids
  fall back to the INDEX, never the label/name).

## [@trembus/viz 0.5.1] — 2026-07

### Fixed

- **`Strata` support connectors arc around the hub.** A wide-angle or layer-skipping
  `restsOn` connector used to cut a straight chord through the central hub; connectors
  now flow with the geology — a radial stub off the dependent, an arc riding the seam
  between the two bands (always the short way), and a radial stub docking onto the
  foundation — degrading to a clean spoke when the endpoints align. Regression-tested:
  no connector vertex may enter the hub radius.

### Changed

- **Storybook docs + `.d.ts` TSDoc pass over all 6 Tier-2 components** (Tree · Lineage ·
  SystemMap · ClassDiagram · Strata · TalentTree): organized component descriptions,
  job-mapped story descriptions, and completed prop TSDoc (selection trios, contract
  masthead fields) shipping in the published `.d.ts`. Comment-only.

## [@trembus/game-viz 0.4.1] — 2026-07

### Changed

- **Storybook docs + `.d.ts` TSDoc pass over all 8 Game components** (Reliquary ·
  SoulCard · EpisodeDeck · CinematicHero · Effigy · MediaFrame · Chronicle ·
  Constellation): organized component descriptions (including the skin→base guidance
  and the three-stylesheet setup line), job-mapped story descriptions, and completed
  prop TSDoc shipping in the published `.d.ts`. Comment-only.

## [@trembus/tokens 0.2.1] — 2026-07

### Fixed

- **WCAG AA contrast for the faint / dim text tokens.** `--tcl-text-faint` is used as real
  text (Brief ids & micro-labels, Stat units) yet failed AA on every surface — even 3.2:1 on
  the dark page. Lifted per theme (it moves opposite ways because light is dark-on-light):
  dark `#5a6371 → #8b94a4`, reliquary `#7a6668 → #958083`, light **darkened** `#9a9a94 → #6f6f69`.
  Dark `--tcl-text-dim` also lifted `#8b949e → #a6afba` so secondary body text (e.g. Callout
  bodies) clears AA on tinted-over-raised surfaces. Values were solved hue-preserving in OKLab
  and the `text > dim > faint` hierarchy is preserved. Verified with axe in all three themes.

## [@trembus/ui 0.8.2] — 2026-07

### Fixed

- **AA contrast on faint and tone-as-text micro-labels** (consumes `@trembus/tokens` 0.2.1;
  the faint/dim label lift flows through automatically). Component-level fixes:
  - **`Badge`** — the `neutral` tone painted its label in the raw neutral tone (fails AA on
    the soft tint); it now uses `--tcl-text-dim`, the AA-safe muted ink (mirrors the existing
    `accent → --text` legibility variant).
  - **`Brief`** — checklist descriptions on a severity tint move to the readable
    `--tcl-text-dim` tier; the kind pill (`SPEC`/`PLAN`/…) keeps its tone on the tint plus a
    new border but paints the label in `--tcl-text` (raw tone-on-tint was 1.8–4.3:1); the
    reference-link chip was near-invisible (`--tcl-status-info-fg` dark ink on a sunken chip,
    1.09:1) and now uses a legible info tone.
  - **`Stat`** — the "bad" delta (danger red on the raised card) was 4.25:1 in dark; nudged
    toward `--tcl-text` so it clears AA while staying clearly red.
  - Added `tokenContrast.test.ts` — a pure-math AA guard across all three themes, since the
    browser a11y gate (`test:stories`) only exercises the dark theme.

## [@trembus/game-viz 0.4.0] — 2026-07-18

### Changed

- **BREAKING — `styles.css` now ships only game-viz's own component CSS.** It no longer
  re-bundles `@trembus/ui/styles.css` and `@trembus/viz/styles.css` (the follow-up
  tracked in 0.3.1): Vite inlines dependency CSS even with the JS externalized, so every
  game-viz build froze a snapshot of ui/viz styles that could silently override a newer
  copy the consumer imported directly — exactly how ui 0.8.1's Menu popover-layer fix
  got stomped. The bundle drops from ~208 kB to ~26 kB (own components + the idempotent
  `@layer` cascade-order declaration) and can never go stale against its dependencies.
  - **Migration:** import each package's style entry yourself (in any order):
    `import '@trembus/ui/styles.css'` (tokens foundation + the primitives game-viz
    composes), `import '@trembus/viz/styles.css'` (Constellation's `TalentTree` spine),
    `import '@trembus/game-viz/styles.css'`. If you already imported all three — the
    long-documented consumer pattern — nothing changes except the override hazard and
    ~180 kB of duplicate CSS disappearing. No JS API change.

### Fixed

- Rebuilt against `@trembus/ui` 0.8.1: the package's single `styles.css` (library-mode
  `cssCodeSplit: false`) bundles a copy of the ui component CSS it imports, and the 0.3.0
  snapshot predated the Menu popover-layer fix — a consumer importing game-viz styles
  _after_ ui's had `.tcl-menu` regressed back to the dropdown layer (z 1000, behind a
  Dialog overlay). No API change. (De-duplicating the bundled dependency CSS is tracked
  as a follow-up.)

## [@trembus/ui 0.8.1] — 2026-07-18

### Fixed

- **`Menu` inside `Dialog`** — the composition now works end to end (found composing a
  command bar whose Toolbar overflow menu lives in a modal):
  - The portaled content sat on the dropdown layer (z 1000), _under_ the dialog overlay's
    modal layer (1300) — present in the a11y tree but invisible on screen. `.tcl-menu` now
    stacks on the new popover layer (`--tcl-z-popover`, 1350 — above modal, below toast),
    with a `calc(--tcl-z-modal + 50)` fallback for a pre-0.2.0 `@trembus/tokens`.
  - `Dialog`'s press-outside-to-close no longer treats a press inside a portaled
    `role="menu"` popup as outside — selecting a menu item fires the action instead of
    dismissing the dialog first.
  - Escape in an open root menu stops propagating, so it peels one layer at a time: menu
    first, dialog on the second press (submenus already did this).
  - New `Components/Menu → InsideDialog` story locks all three in with a play test
    (stacking assert + item select + Escape layering).

## [@trembus/tokens 0.2.0] — 2026-07-18

### Added

- **`--tcl-z-popover: 1350`** — a z-layer for portaled popovers/menus that must surface
  above the modal layer (1300) but stay under toast (1400) and tooltip (1500);
  `'popover'` joins the `ZToken` union (usable via `tokens.z('popover')` and `Box`'s
  `z` prop).

## [@trembus/ui 0.8.0] — 2026-07-14

### Added

- **`Swimlane`** — the swimlane-v2 process-board kit (additive API; default geometry and step
  accessible names unchanged; lane-head visuals refreshed — the old `__lane-dot` /
  `__lane-kind` internal class hooks are gone):
  - Lane heads render a per-kind glyph from `@trembus/icons` (`human → user`, `ai → sparkle`,
    `system → server`, `tool → wrench`; `neutral` keeps an empty slot so labels stay aligned)
    in place of the 8px dot + raw uppercased kind word. The kind word moves into the glyph's
    `title` tooltip — the lane column was `aria-hidden` decoration, and each step button
    already announces its actor — and the lane label gets the freed width.
  - New `density` prop (`'cozy' | 'comfortable'`, default `'cozy'` — the original geometry,
    byte-for-byte). `comfortable` raises cell/lane heights so step labels wrap to two clamped
    lines instead of ellipsizing; the preset feeds both the SVG connector math and the cells.
  - New `SwimlaneStep.markers` — small per-step annotation badges
    (`{ id?, glyph?, title }[]`, glyph names from the `@trembus/icons` registry). Decorative
    on the card; every marker `title` is folded into the step button's accessible name.
  - The step `detail` line gains a hover `title` tooltip (labels already had one).
- **`RunHistory`** — `RunOutput.op?: 'create' | 'modify' | 'delete'`: output chips render a
  git-style `+` / `~` / `−` prefix mark (decorative) paired with an sr-only word
  ("created" / "modified" / "deleted") in the chip's accessible name.
- **`applyRun`** — the run-over-definition replay from the `Examples/SwimlaneRuns` page is now
  a public barrel export (two consuming command centers were hand-copying it); lenient about
  a missing `steps` array, mirroring `Swimlane`'s own parse.

### Fixed

- Authored-JSON junk hardening: unknown or prototype-chain lane kinds, marker glyph names,
  and output `op` values degrade to their documented fallbacks (neutral lane / dot mark /
  op-less chip) instead of crashing or rendering empty stubs.

## [@trembus/icons 0.2.0] — 2026-07-14

### Added

- New monochrome glyphs — `wrench`, `sparkle`, `robot` — registered in `GLYPHS` and exported
  tree-shakeably as `WrenchIcon` / `SparkleIcon` / `RobotIcon`. `wrench` and `sparkle` head
  `Swimlane`'s tool/ai lanes; `robot` ships as the alternative ai mark.

### Fixed

- `Glyph` now resolves names with an own-property check: prototype-chain names in authored
  JSON (`'constructor'`, `'toString'`, …) previously resolved to functions and crashed the
  consumer's render tree; they now render nothing, like any unknown name.

## [@trembus/ui 0.7.0] — 2026-07-11

### Added

- **`DecisionMap`** — a Tier-1 "before the call" decision visualization. Option cards carry a
  recommendation ribbon (word + strength), a clamped confidence bar with its printed %,
  effort / reversibility ("door type") word chips, and a benefit/caution/risk tally; selecting a
  card unrolls its first- and second-order **consequence cascade** with a likelihood word on
  every edge, tone rails, and dashed "still-negotiable" rails for possible/unlikely effects. A
  `status: 'decided'` + `decidedId` state renders the at-rest ledger view for a locked-in call.
  Lenient parse, strict render (only `title` / option `label` required; unknown enums degrade to
  safe defaults; ids uniquified first-wins; confidence clamped once and reused for bar + print +
  aria). Each card is a focusable button with a composed accessible-name sentence and an
  aria-live inspector.

### Changed

- **`Brief`** — new `headingLevel` prop (1–6, default 2) so the document title and section
  headings slot into the host page's heading hierarchy — needed to compose `Brief` inside
  example pages without breaking heading order.
- **`Hub`**, **`Swimlane`**, **`Timeline`** — keyboard navigation upgraded to a **roving
  tabindex**: one Tab stop, Arrow keys move focus and selection together (2-D for
  Swimlane/Timeline), Home/End jump to the ends. Timeline's prev/next controls still provide the
  same chronological step.
- **`Timeline`** — duplicate explicit event ids now resolve first-authored-wins before layout,
  and selection scroll respects `prefers-reduced-motion`.
- **`Heatmap`** — in `selectionMode="row"` the row button's accessible name now enumerates every
  column/value pair with its unit; duplicate explicit row ids resolve first-authored-wins;
  no-data cells are named placeholders.

## [@trembus/viz 0.5.0] — 2026-07-11

### Added

- **`TalentTree`** — a game skill-tree: a prerequisite DAG of multi-rank talents you spend a
  points budget into. Its lead job is **afford-action** (a viz-roster first) — allocation _is_ the
  component. Click / Enter / Space raises a rank where the prerequisites (including rank
  prerequisites like "Fireball at rank 3"), the tier gate, and the budget allow; Shift+click, `-`,
  or Delete safely removes one and can never orphan an allocated dependent or break a tier gate
  (a full-recheck simulation). Authored tiers with a derived fallback (tier = longest
  prerequisite chain), locked / available / allocated / maxed states (distinguished by border
  shape, not colour alone), met vs unmet edges with rank numerals, a hand-rolled `role="meter"`
  points budget, and an aria-live inspector that states every reason in words. Controlled or
  uncontrolled via `allocated` / `defaultAllocated` / `onAllocatedChange`; `readOnly` displays a
  finished build. Lenient parse, strict render (duplicate ids first-wins, dangling requires
  dropped, cycles broken, a non-finite budget treated as unlimited, never throws). Adds the
  `--tcl-talenttree-accent` skin hook, read via fallback and never declared on the component root
  so a skin can remap it from an ancestor.

### Changed

- **`Strata`** — keyboard navigation upgraded to a **roving tabindex**: either Arrow-key pair
  roves, selects, and focuses in deterministic arc order with Home/End jumping to the bounds, and
  an external `selectedId` change re-seeds the single Tab stop.

## [@trembus/game-viz 0.3.0] — 2026-07-11

### Added

- **`Constellation`** — the liturgical-gothic skin over the viz `TalentTree`, framing the talent
  DAG as a night star-chart (reliquary-dark plate, HUD corner brackets, display-serif title, an
  optional designation tab) and re-tinting the whole tree accent through the
  `--tcl-talenttree-accent` hook per `data-tone`, while per-node tones still override. The
  interactive spine is the TalentTree's, passed straight through — theatrical surface, accessible
  spine. This is the first **`@trembus/game-viz → @trembus/viz`** dependency.

## [@trembus/ui 0.6.0] — 2026-07

### Changed

- **`Heatmap`** — row selection + per-column tones: `selectionMode="row"` makes each row a
  single focusable button (a CSS-subgrid whole-row control carrying `aria-current`, with a
  selection rail distinct from the focus ring); `columnTones` gives each metric column its
  own tone ramp; rows take a stable `id` (for `selectionMode="row"`, falling back to the
  index — never the label) and a rich `display` ReactNode for the row header while `label`
  stays the string accessible name; `showInspector` / `showScale` toggle the chrome.
- **`AudioWaveform`** — `playOnClick` (default `true`): clicking/scrubbing the waveform
  seeks AND starts playback in one gesture; pass `playOnClick={false}` for the previous
  seek-only behavior. Never fires mid-drag and still never autoplays on mount.

## [@trembus/viz 0.4.0] — 2026-07

### Added

- **`Strata`** — a concentric first-principles visualization. Radial depth encodes
  dependency layering: bedrock axioms (no `restsOn`) fill the innermost ring, and every
  principle layers outward at its longest support chain. Deliberately strata-with-DAG-links,
  not a sunburst — `restsOn` is many-to-many, so arcs settle near their foundations via a
  wrap-safe circular barycenter in an overlap-free slice grid. A `restsOn` reference to an
  id that doesn't exist auto-materializes a dashed **gap** arc in the ring beneath its
  shallowest referencer (undiscovered supports surfaced as discovery opportunities, never
  errors), and `conjecture: true` shares the dashed "still negotiable" vocabulary. Selecting
  an arc lights its foundation cone and its load cone — everything that would collapse with
  it — and names both in the aria-live inspector; every arc, gaps included, is a focusable
  core-sample button over the decorative SVG. Deep maps compress their rings but never
  escape the plot box; support cycles degrade deterministically (a principle that declared
  `restsOn` never presents as bedrock).

## [@trembus/ui 0.5.0] — 2026-07

### Added

- **`Toolbar`** (+ `Toolbar.Button` / `Toolbar.Group` / `Toolbar.Separator`) — a
  `role="toolbar"` command bar with focus-aware roving tabindex. A `Toolbar.Button` can
  act as a `Menu` trigger, composing the compact icon-bar → pop-up → submenu
  progressive-disclosure command bar.

### Changed

- **`Menu`** extended for command bars: `Menu.Sub` / `Menu.SubTrigger` / `Menu.SubContent`
  nested submenus, `Menu.Label` + `Menu.Separator` grouping, and `side="top"` upward
  opening with collision-flip for bottom-docked bars.

## [@trembus/ui 0.4.0] — 2026-07

### Added

- **`AudioWaveform`** — an audio preview + player: a rendered waveform (from a `peaks` array or a lazy
  Web Audio decode) with a play/pause transport (`aria-pressed`), a keyboard-operable scrubber
  (`role=slider`; arrow / Home / End / PageUp-Down), and a current-time / duration readout. Loading and
  decode-error are surfaced visually **and** via an `aria-live` region; a `compact` mode renders a
  waveform-only thumbnail. Never autoplays, and the playhead honours `prefers-reduced-motion`.
- **`VirtualAssetGrid`** — a windowed, responsive, sectioned single-select tile grid that renders only the
  visible tiles of a large (10k+) dataset. Groups items into sticky counted section subheads (`groupBy` +
  `groupOrder`), owns 2D roving-tabindex arrow navigation (moving by the live column count, across section
  boundaries), and exposes a `role=listbox` of focusable `role=option` tiles with controlled / uncontrolled
  selection. Windowing is dependency-free; `virtualize={false}` renders the full tree (print / small sets).

## [@trembus/game-viz 0.2.0] — 2026-07

### Added

- **`MediaFrame`** — one format-aware media surface for an asset: an `<img>` poster for images, a compact
  `AudioWaveform` for audio, an `Effigy` turntable for loadable 3D (glTF / GLB) or a pre-rendered poster for
  formats `<model-viewer>` cannot load (`.fbx` / `.blend` / `.rbxm` / `.obj`), a `Glyph` plate for documents,
  and a tone-tinted `Skeleton` while loading or when there is no source. The bracket-cornered frame is
  decorative (`aria-hidden`); `interactive` promotes the frame to a real focusable button (`onActivate`).

### Changed

- Added **`@trembus/icons`** as a dependency (for the document / fallback `Glyph` plate).

## [@trembus/icons 0.1.0] — 2026-06

### Added

- Initial release. The shared **glyph set** — 34 hand-authored, normalized 24×24 inline-SVG icons
  (node-kind marks, file-type marks, core UI affordances) — extracted from the duplicated copies
  that lived inside `@trembus/ui` and `@trembus/viz`. A React-only leaf: **no `@trembus/tokens`
  dependency, no stylesheet, `sideEffects: false`.** Exposes tree-shakeable `*Icon` components
  (`DatabaseIcon`, `SearchIcon`, …), a `GLYPHS` registry with a render-by-name `<Glyph name>`, and
  the `SYSTEM_KIND_GLYPH` (C4 kind → glyph) and `EXT_GLYPH` / `extToGlyph` (file-extension → glyph)
  maps. Monochrome glyphs inherit `currentColor`; brand/type marks (TS, JS, React, CSS, HTML) carry
  their own color.

## [@trembus/ui 0.3.0] — 2026-06

### Added

- **`Breadcrumb`** (+ `Breadcrumb.Item`), **`NavBar`** (+ `NavBar.Link`), and **`SkipLink`** — the
  first site-level page-navigation components. Routing-agnostic: links take a plain `href` or wrap a
  consumer's router link via `asChild`, and the active/current state is styled off
  `aria-current="page"` (set by an `active` / `current` prop, or by the wrapped router link itself).
  `SkipLink` is a WCAG 2.4.1 bypass link, visually hidden until focused.

### Changed

- Glyphs now come from the new **`@trembus/icons`** package (FolderTree's file/folder marks); the
  internal glyph copy (`src/internal/glyphs.tsx`) was removed.

## [@trembus/viz 0.3.1] — 2026-06

### Changed

- Glyphs now come from the new **`@trembus/icons`** package; the internal glyph copy
  (`src/internal/glyphs.tsx`, the seed of the new package) was removed. The `Glyph` / `GLYPHS` /
  `SYSTEM_KIND_GLYPH` re-exports from `src/internal` are unchanged, so component behavior and the
  public API are identical.

## [@trembus/ui 0.2.0] — 2026-06

### Added

- **`FolderTree`** — the library's first WAI-ARIA `role="tree"` file explorer: nested
  folder nodes, roving-tabindex keyboard navigation, search/filter, tri-state checkboxes
  (`aria-checked` on the row), and lazy-loaded children. _(Entry backfilled 2026-07 —
  this release predated changelog discipline.)_

## [@trembus/viz 0.3.0] — 2026-06

### Added

- **`ClassDiagram`** — a UML class diagram. Classes render as compartmented boxes
  (name + stereotype · attributes · methods, with `+ - # ~` visibility markers)
  connected by typed relationships whose arrowheads encode the kind: inheritance and
  realization (hollow triangle), composition (filled diamond), aggregation (hollow
  diamond), association and dependency (open arrow), with dashed lines for realization
  and dependency. Selecting a class emphasizes its relationships and reveals its members
  and relationships (named with UML verbs) in the aria-live inspector.

### Changed

- `NodeCard` (the shared node body) gained UML-style compartments (`sections`), reused
  by `ClassDiagram` for attribute/method lists.

## [@trembus/viz 0.2.0] — 2026-06

### Added

- **`SystemMap`** — a nested, drill-down C4 / system-architecture map. The root reads
  as a Context diagram; opening a container is a semantic-zoom step to that level's
  children, and deep component-to-component edges aggregate up to the visible level.
  Includes provided/required interface ports, a breadcrumb orientation spine, and an
  aria-live inspector that names a node's interfaces plus its internal and
  cross-boundary connections. New reusable spine pieces: `useDrilldown`, `layoutNested`,
  `NodeCard`.
- **Icon glyphs** — an in-package glyph set (node-kind marks, file-type marks, and core
  UI affordances) so `SystemMap` and `Tree` can distinguish kinds/types at a glance via
  a `kind → icon` map and a per-node `icon` field. Monochrome glyphs inherit
  `currentColor`; type/brand marks (TS, JS, React, CSS, HTML) carry their own color.
  (Seed of a future standalone `@trembus/icons` package.)

## [0.1.0] — 2026-06

Initial public release of the four packages to npm under the MIT license.

### Added

- **`@trembus/tokens`** — the `var(--tcl-*)` CSS layer system (light · dark · reliquary
  themes + material presets), the type-safe token ontology and tone vocabulary, the
  3-jobs `ComponentContract` type, and the axe `a11yViolations` test helper.
- **`@trembus/ui`** — primitives (`Box`, `Stack`/`Inline`, `Text`, `Pressable`), form
  controls, overlays (`Dialog`, `Menu`, `Tooltip`, `Toast`), and Tier-1 data
  visualizations (`Hub`, `BarChart`, `LineChart`, `DonutChart`, `Heatmap`, `Gauge`,
  `Sparkline`, `Funnel`, `Treemap`, `Timeline`, `Swimlane`, …).
- **`@trembus/viz`** — Tier-2 node-link visualizations: `Tree` (hierarchy via
  `d3-hierarchy`) and `Lineage` (DAG via `dagre`).
- **`@trembus/game-viz`** — expressive game / cinematic UI: `Reliquary`, `SoulCard`,
  `EpisodeDeck`, `CinematicHero`, `Chronicle`, and `Effigy` (3D model thumbnail).

[Unreleased]: https://github.com/nicholasosto/Trembus-Component-Library/compare/main...HEAD
[0.1.0]: https://github.com/nicholasosto/Trembus-Component-Library/releases/tag/v0.1.0
