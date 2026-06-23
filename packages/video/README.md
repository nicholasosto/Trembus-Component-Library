# @trembus/video — motion studio (Remotion)

Renders the Trembus component library to video with [Remotion](https://remotion.dev).
A composition is an ordinary React tree, so it **imports the real components and the
real token CSS** — no re-authoring:

```tsx
import { CinematicHero } from '@trembus/game-viz';
import '@trembus/game-viz/styles.css'; // the whole @layer cascade + var(--tcl-*) tokens
```

This package is an **internal app, not a published library**. It has no `*.contract.ts`
(the 3-jobs discipline is for UI primitives), and it is deliberately **outside the
`pnpm validate` gate**: its scripts are named off the gated set (`studio`/`render`/
`still`/`tc`) so root `pnpm -r` skips it, and it's excluded from the root `eslint`/
`prettier` scope. Run its own checks with `pnpm --filter @trembus/video tc`.

## Use

```bash
# live editor / preview
pnpm --filter @trembus/video studio

# render the promo to an MP4 (id is the <Composition id>)
pnpm --filter @trembus/video render HeroPromo out/hero-promo.mp4

# a single still frame (fast smoke test)
pnpm --filter @trembus/video still HeroPromo out/hero.png --frame=60
```

Renderable compositions live in [`src/Root.tsx`](src/Root.tsx); each is a
`<Composition>` pointing at a component under `src/`.

## Conventions that make this work (the gotchas, handled)

- **Frame-driven motion, not the component's own.** Remotion screenshots a pure
  function of `useCurrentFrame()` and does **not** mock the wall clock. So Trembus
  motion (SoulCard's `transition: transform 0.55s`, EpisodeDeck's infinite
  `@keyframes`, Effigy's model-viewer `rAF`) will **not** animate correctly on its
  own — drive the beat with `interpolate()`/`spring()` on a wrapper around the real
  component (see [`HeroPromo.tsx`](src/HeroPromo.tsx)). Reuse the look; own the motion.
- **Fonts are explicit.** The library references `--tcl-font-display` (`'Cinzel', …`)
  but ships no font face, so a headless render box would fall back to a generic serif.
  `Root.tsx` calls `loadFont()` from `@remotion/google-fonts/Cinzel` (render-blocking)
  so the existing token resolves to the intended face.
- **Theme per composition.** Set `data-theme="dark"` on the composition's root element;
  `tokens.dark.css`'s `[data-theme="dark"]` overrides cascade to everything inside.
- **Pin `@remotion/*` to one exact version** (currently `4.0.482`, no `^`) — all
  Remotion packages must match exactly. This is Remotion's main footgun.
- **Effigy / 3D** (`@google/model-viewer`) is the one component that can't be
  frame-seeked without a custom three.js/pose-by-frame adapter — render it as a still
  and animate the surrounding token chrome.

## Licensing note

Remotion is **source-available** (not OSI open source): free for individuals and
for-profit companies of up to 3 people; a paid Company License applies at 4+
employees ($25/seat·mo Creators, $0.01/render Automators, Enterprise from $500/mo).
See <https://www.remotion.dev/docs/license>.
