# @trembus/game-viz

Trembus expressive **game / cinematic** UI — HUD frames, character dossiers,
episode decks, title plates, 3D model thumbnails. A liturgical-gothic idiom over
the same 3-jobs contract + axe discipline: _theatrical surface, accessible spine_.
Builds on `@trembus/ui` primitives.

```sh
pnpm add @trembus/game-viz react react-dom
```

`react` / `react-dom` are peer dependencies (React 19); `@trembus/ui` and
`@trembus/tokens` come along automatically.

## Use

```tsx
import { Chronicle } from '@trembus/game-viz';
import '@trembus/game-viz/styles.css';

<div className="tcl-root" data-theme="reliquary">
  <Chronicle data={ironAge} tone="danger" archive="The Reliquary Archive" />
</div>;
```

Components include `Reliquary`, `SoulCard`, `EpisodeDeck`, `CinematicHero`,
`Chronicle`, and `Effigy` (a 3D model thumbnail wrapping Google `<model-viewer>`).
Decorative chrome is `aria-hidden`; interactive bits are real focusable controls;
motion sits behind `prefers-reduced-motion`.

## License

MIT © Nicholas Osto
