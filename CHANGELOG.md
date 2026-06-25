# Changelog

All notable changes to the published `@trembus/*` packages are documented here. The
format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
packages aim to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Documentation pass: monorepo landing README, per-package npm READMEs with badges,
  package `keywords`, a published Storybook gallery on GitHub Pages, and contributor docs.

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
