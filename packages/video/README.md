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

# render the "Add a Component" animated tutorial (~35s, 1080p)
pnpm --filter @trembus/video render AddComponentTutorial out/add-component-tutorial.mp4

# render the Command-Center workflow demo (~23s, 1080p)
pnpm --filter @trembus/video render WorkflowDemo out/workflow-demo.mp4

# a single still frame (fast smoke test)
pnpm --filter @trembus/video still HeroPromo out/hero.png --frame=60
```

Renderable compositions live in [`src/Root.tsx`](src/Root.tsx); each is a
`<Composition>` pointing at a component under `src/`.

## Tutorials — `AddComponentTutorial` ([`src/tutorial/`](src/tutorial/))

A worked example of a **teaching video**: nine scenes that walk through the
canonical five-file shape, built from a small reusable kit. The code on screen is
the **real output** of `.claude/skills/new-component/scaffold.mjs Tag`, so a viewer
can follow along verbatim.

- **Animated code** — [`CodeBlock.tsx`](src/tutorial/CodeBlock.tsx) uses
  [`prism-react-renderer`](https://github.com/FormidableLabs/prism-react-renderer)
  (synchronous — no async highlighter/WASM to stall a headless render) and reveals
  characters as a pure function of `useCurrentFrame()`. Not-yet-typed glyphs render
  at `opacity: 0` so the panel never reflows. **There is no `@remotion/code`
  package** — the official "animated code" path is the Code Hike template; Prism is
  the lighter, render-safe choice.
- **Scene transitions** — `@remotion/transitions` `<TransitionSeries>` with
  `fade` / `slide` / `wipe`. Each scene declares the transition that precedes it
  (`scene.enter`); the composition flattens that into the alternating
  Sequence/Transition children. Total length is **derived** (`totalDurationInFrames`
  in [`script.ts`](src/tutorial/script.ts)) so the `<Composition>` never drifts.
- **Captions** — authored as `@remotion/captions` `Caption`s (ms timing,
  interoperable with SRT/Whisper). [`Captions.tsx`](src/tutorial/Captions.tsx)
  resolves the active caption against the **local** scene frame, so each scene owns
  its own track (two briefly overlap during a transition — by design).
- **Content vs. presentation** — the whole script (scene order, code, captions,
  durations) is data in [`script.ts`](src/tutorial/script.ts); the scenes in
  [`scenes.tsx`](src/tutorial/scenes.tsx) just render it. Swap the script to make a
  different tutorial without touching the motion code.

## Product demos — `WorkflowDemo` ([`src/workflow/`](src/workflow/))

A **product-walkthrough** style demo: one persistent "command center" app shell in
which a user runs `/new workflow createKPI` (a ⌘K palette), a workflow diagram is
added, then `/start workflow` runs it — the steps light up one by one and a run
record appears. Unlike the tutorial (scene cuts via `TransitionSeries`), this is a
**single continuous screen** where every phase is derived from the global frame
([`timeline.ts`](src/workflow/timeline.ts) — phase markers + an `execState(frame)`).

The headline: the diagram and the log are the **real `@trembus/ui` components**
([`Swimlane`] and [`RunHistory`]), not mock-ups — which is why the package now also
imports `@trembus/ui/styles.css` (the libs must be **built**; `WorkflowDemo` resolves
their `dist/`).

- **Frame-driven component state** — the README rule ("own the motion, reuse the
  look") applies to *data*, not just transforms. [`data.ts`](src/workflow/data.ts)
  rebuilds the `SwimlaneContract` every frame so each step's `status`
  (`pending → active → done`) and the selected step (which lights its connector
  edges) are a pure function of `execState(frame)`. The same progress drives the
  `RunRecord` from `running` (live step tally) to `succeeded` (duration + output
  chips). One clock, two real components in lock-step.
- **The ⌘K palette** ([`CommandModal.tsx`](src/workflow/CommandModal.tsx)) is
  presentational — the orchestrator feeds it the typewriter text, caret blink, and
  the accent "Enter" flash.
- **`RunHistory` calls `Date.now()`** for its relative timestamps; captured once at
  module load (`BOOT` in `data.ts`) so the run reads "just now" without per-frame
  drift.

[`Swimlane`]: ../ui/src/components/Swimlane/Swimlane.tsx
[`RunHistory`]: ../ui/src/components/RunHistory/RunHistory.tsx

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
