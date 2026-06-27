# Changelog

All notable changes to the published `@trembus/*` packages are documented here. The
format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
packages aim to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Documentation pass: monorepo landing README, per-package npm READMEs with badges,
  package `keywords`, a published Storybook gallery on GitHub Pages, and contributor docs.

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
