# Changelog

All notable changes to the published `@trembus/*` packages are documented here. The
format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
packages aim to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Documentation pass: monorepo landing README, per-package npm READMEs with badges,
  package `keywords`, a published Storybook gallery on GitHub Pages, and contributor docs.

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
