# Motion spike — should there be a `@trembus/motion`?

**Status:** spike complete, **recommendation: do not create the package yet.**
**Date:** 2026-07-28 · **Dependency under test:** `motion@12.42.2` (the package
formerly published as `framer-motion`)

This is a throwaway prototype living in `demos/soul-steel/src/motion/`. It exists
because `demos/*` sits **off** the `validate` gate, so it can carry a third-party
dependency and be deleted at zero cost. Nothing in `packages/*` was touched — the
diff for this spike contains **zero** library files.

Run it: `pnpm demos:check` from the repo root, then
`pnpm --filter @trembus-demo/soul-steel dev` and open
[`/motion`](http://localhost:5174/motion).

---

## What it cost

Measured by building `demos/soul-steel` before and after, then a third build with
the `/motion` lab route removed to separate the library from the demo page:

| Build                          | app chunk    | gzip          | delta          |
| ------------------------------ | ------------ | ------------- | -------------- |
| Baseline (no Motion)           | 390.85 kB    | **126.08 kB** | —              |
| + Motion, wired into 4 routes  | 521.86 kB    | **169.23 kB** | **+43.15 kB**  |
| + the `/motion` lab route      | 540.52 kB    | **175.02 kB** | +5.79 kB       |

**Motion costs +43 kB gz here**, not the ~34 kB usually quoted — that figure is
for the React bundle alone, and this spike also pulls `AnimatePresence`,
`useMotionValue` / `useTransform` / `animate`, `motion.create`, `whileInView` and
`whileHover`. `LazyMotion` + `domAnimation` would cut it, at the cost of every
call site becoming `<m.div>` inside a feature provider.

For scale: `game-viz` already ships a **1.6 MB** `model-viewer` chunk. Size alone
is not the argument against this dependency. The findings below are.

---

## What the spike verified

Verified live in the browser (see `/motion`, "The token bridge" panel): the CSS →
JS bridge parses the **real** computed values off `:root` —
`--tcl-dur-fast → 0.12s`, `--tcl-ease-calm → [0.22, 0.61, 0.36, 1]`,
`--tcl-ease-exit → [0.4, 0, 1, 1]`.

Verified by DOM assertion: the `AnimatedNumber` a11y split (`aria-hidden` digits +
a clipped `.tcl-sr-only` true value), and that `.card-link--motion` resolves to
`transition: border-color 140ms` with `transform` correctly excluded.

Verified standalone in Node (16/16 checks — `variants.ts` type-imports Motion but
has **no runtime dependency** on it, so it tests without a DOM): every travel
direction, the token fallback path, and all three reduced-motion collapses.

**Not verified:** the animations themselves, visually. The Browser pane in this
session never composited — `document.visibilityState` stayed `"hidden"` and
`requestAnimationFrame` fired **0 times in 5 seconds** while `setInterval` kept
ticking. Motion is entirely rAF-driven, so nothing could move. The logic is
verified; the *look* needs a human with a real browser window. That is the one
gap in this report.

---

## Findings

### 1. The primitives are already motion-ready — recipes beat wrappers

`Box`, `Stack` and `Inline` are polymorphic (`as: ElementType`) and spread their
rest props ([Box.tsx:105](../../packages/ui/src/primitives/Box/Box.tsx:105)). So
this works today, with no library change and no extra DOM node:

```tsx
<Stack as={motion.div} gap={4} variants={staggerVariants()} initial="hidden" animate="visible">
  <Box as={motion.div} variants={revealVariants()} surface="raised" p={6}>…</Box>
</Stack>
```

Every `Box` prop survives. Compare the wrapper form, which inserts a `<div>` per
item and makes the *wrapper* — not the `Box` — the layout child. Both forms are
on `/motion`, side by side.

**This is the load-bearing finding.** The thing worth packaging is the variant
factories and the token bridge, not components.

### 2. Reduced motion moves from CSS to JS, and nothing catches a miss

Every existing motion guard in the library is a `prefers-reduced-motion` media
query the browser enforces for free (19 files do this). A JS runtime never sees
it: each animation must thread `useReducedMotion()` through by hand, and **axe
cannot detect a missed one**. The gate goes quiet exactly where it currently
protects us. This is the single largest cost of adopting a JS animation runtime,
and it is a permanent discipline, not a migration step.

### 3. A CSS `transition` on a property Motion writes will fight it

`.card-link` had `transition: transform 140ms ease` for its hover lift. Motion
writes `transform` as an inline style, and CSS transitions apply to inline
changes too — so every animation frame would run Motion's tween *and* a second
140ms CSS tween. The fix is to strip `transform` from the CSS transition and move
the hover to `whileHover` (`.card-link--motion` in `app.css`). Once an element is
Motion-driven, its transform-based CSS states have to move to JS as well.

### 4. Stagger orchestration is severed by a child that drives itself

Motion cascades by propagating variant *state* down the tree, and that only works
while the child leaves `initial`/`animate` unset. A `<Reveal>` that always drove
itself would render fine alone and silently ignore its `<Stagger>` parent — the
bug reads as "stagger does nothing". Hence `StaggerContext`: `Reveal` checks
whether it is being orchestrated and steps back. Any real package needs this, and
it is not obvious.

### 5. `motion.create()` must be hoisted

Animating a *component* rather than a DOM tag (react-router's `Link`) needs
`motion.create(Link)`, which mints a new component type per call — calling it in
render gives React a different type each pass and remounts the subtree. See
[Home.tsx](src/routes/Home.tsx).

### 6. Route transitions are the weakest case for the dependency

Wrapping `<Outlet />` in `<AnimatePresence>` is broken with a react-router **data
router**: the exiting copy still renders `<Outlet />`, and `<Outlet />` resolves
to the *current* route — so the element supposedly animating the old page out is
already showing the new page's content. `PageTransition` is therefore enter-only.

Meanwhile react-router v7 supports the **View Transitions API** natively via
`<NavLink viewTransition>`, which captures real old/new frames at the browser
level. Cross-fading pages is one prop and zero bytes of JS.

### 7. Exit is the only thing CSS genuinely cannot do

An exit animation requires a removed node to outlive its own unmount. No
stylesheet can defer a React unmount — `@starting-style` covers enter, and
`transition-behavior: allow-discrete` covers `display`, but neither holds a node
past its removal. `<Presence>` on `/motion` (and the Episodes inspector) is the
one effect on the whole site with no CSS equivalent.

### 8. `mode="wait"` couples visible content to an animation frame

Discovered by accident, while chasing what looked like a bug in `Presence`: with
`AnimatePresence mode="wait"`, if the exit animation cannot run, the incoming
content never mounts. In a hidden document rAF never fires, so React state says
one thing and the DOM shows another until the tab is refocused. It self-heals,
and nobody reads a hidden tab — but it is a difference in *kind* from CSS, where
the swap is a render and the animation is only decoration. If a swap can be
driven by a timer or a socket rather than a click, do not use `mode="wait"`.

### 9. The head-to-head is a wash for the common case

The staggered on-mount reveal — by far the most-wanted effect — is
indistinguishable between the two columns on `/motion`. The CSS version is one
`@keyframes` rule plus `animation-delay: calc(var(--i) * var(--tcl-dur-fast))`.
The Motion version is 43 kB.

### 10. `AnimatedNumber` never found a real home

It is exercised only in the lab. Wiring the spike into the four real routes,
there was no honest place for a tweened counter — the hero's accolades are
strings inside a game-viz contract, not values this could drive. Worth noting
rather than manufacturing a use case for it.

---

## Recommendation

**Do not create `@trembus/motion` yet.** Of everything built here, exactly one
effect (finding 7) needed the dependency, and no library component currently
needs it in a way CSS cannot already do — `Dialog`, `Menu`, `Toast`, `Tooltip`
and `Skeleton` all animate in CSS today and none of them are worse for it.

Adopting it would buy one capability and permanently cost the reduced-motion
guarantee that a media query gives for free (finding 2).

**If that changes** — a component genuinely needs exit choreography or a
shared-layout transition — then ship the small thing, not the big one:

- `tokens.ts` + `variants.ts` only. Pure objects, ~2 kB, **zero runtime
  dependency** (the Motion import is type-only), `motion` as a **peer** —
  which it must be regardless, since `MotionConfig`/`LayoutGroup` context and
  two copies of the runtime do not mix.
- **No wrapper components.** Finding 1 means they add DOM and API surface for
  something `as={motion.div}` already does, and a `<MotionBox>` shadowing `Box`
  is exactly the API duplication that would make the package a mistake.

Until then this stays a demo. The code is kept — deleting it would throw away the
answer along with the question.
