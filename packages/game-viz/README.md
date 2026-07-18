# @trembus/game-viz

[![npm](https://img.shields.io/npm/v/@trembus/game-viz.svg)](https://www.npmjs.com/package/@trembus/game-viz)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/nicholasosto/Trembus-Component-Library/blob/main/LICENSE)
[![Storybook](https://img.shields.io/badge/Storybook-live-ff4785?logo=storybook&logoColor=white)](https://nicholasosto.github.io/Trembus-Component-Library/)

Trembus expressive **game / cinematic** UI — HUD frames, character dossiers,
episode decks, title plates, 3D model thumbnails. A liturgical-gothic idiom over
the same 3-jobs contract + axe discipline: _theatrical surface, accessible spine_.
Builds on `@trembus/ui` primitives.

**🔭 [Browse the cinematic components in the live Storybook →](https://nicholasosto.github.io/Trembus-Component-Library/)**

```sh
pnpm add @trembus/game-viz react react-dom
```

`react` / `react-dom` are peer dependencies (React 19); `@trembus/ui`,
`@trembus/viz`, `@trembus/icons`, and `@trembus/tokens` come along automatically.

## Use

Since 0.4.0 `@trembus/game-viz/styles.css` carries **only game-viz's own
component CSS** — it no longer re-bundles its dependencies' stylesheets (a
bundled copy freezes at build time and can override a newer `@trembus/ui`
you import directly). game-viz renders `@trembus/ui` primitives (and, via
`Constellation`, the `@trembus/viz` `TalentTree`), so import each package's
style entry once in your app:

```tsx
import { Chronicle } from '@trembus/game-viz';
import '@trembus/ui/styles.css'; // tokens foundation + ui primitives
import '@trembus/viz/styles.css'; // viz spine (Constellation's TalentTree)
import '@trembus/game-viz/styles.css'; // game-viz components

<div className="tcl-root" data-theme="reliquary">
  <Chronicle data={ironAge} tone="danger" archive="The Reliquary Archive" />
</div>;
```

Components include `Reliquary`, `SoulCard`, `EpisodeDeck`, `CinematicHero`,
`Chronicle`, `MediaFrame` (a format-aware media surface — image · audio waveform · 3D turntable ·
doc glyph), `Effigy` (a 3D model thumbnail wrapping Google `<model-viewer>`), and
`Constellation` (a gothic star-chart skin over the `@trembus/viz` `TalentTree` — the
first `game-viz → viz` dependency).
Decorative chrome is `aria-hidden`; interactive bits are real focusable controls;
motion sits behind `prefers-reduced-motion`.

## License

MIT © Nicholas Osto · [source & contributing](https://github.com/nicholasosto/Trembus-Component-Library)
