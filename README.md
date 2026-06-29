# Trembus Component Library

[![CI](https://github.com/nicholasosto/Trembus-Component-Library/actions/workflows/ci.yml/badge.svg)](https://github.com/nicholasosto/Trembus-Component-Library/actions/workflows/ci.yml)
[![Storybook](https://img.shields.io/badge/Storybook-live-ff4785?logo=storybook&logoColor=white)](https://nicholasosto.github.io/Trembus-Component-Library/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A React component library grounded in **first-principles UX**. Every component is
built from a small set of primitives and carries a **machine-checked contract**
proving it does the three irreducible jobs of any UI — a claude.ai-clean light theme
by default, a Trembus dark theme, a blood-dark `reliquary` theme, and zero styling
config for consumers.

> **Tokens → primitives → components.** Each component declares — in code the compiler
> and CI both check — that it can _Reveal State_, _Afford Action_, and _Acknowledge Input_.

**🔭 [Browse the live component gallery (Storybook) →](https://nicholasosto.github.io/Trembus-Component-Library/)**

## Packages

Five published packages, MIT-licensed, ESM-only, React 19. Import each package's
`./styles.css` once and you're done — no Tailwind, no build-tool config.

| Package                                         | npm                                                                                                           | What it is                                                                                                                                                                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@trembus/tokens`](packages/tokens#readme)     | [![npm](https://img.shields.io/npm/v/@trembus/tokens.svg)](https://www.npmjs.com/package/@trembus/tokens)     | The shared design-token foundation — the `var(--tcl-*)` CSS layer system (light · dark · reliquary + material presets), the type-safe token ontology, the `ComponentContract` type, and an axe a11y test helper. **React-free.** |
| [`@trembus/icons`](packages/icons#readme)       | [![npm](https://img.shields.io/npm/v/@trembus/icons.svg)](https://www.npmjs.com/package/@trembus/icons)       | The shared glyph set — tree-shakeable inline-SVG icons (node-kind / file-type marks + UI affordances) consumed by `@trembus/ui` and `@trembus/viz`. React-only — no token dep, no stylesheet.                                    |
| [`@trembus/ui`](packages/ui#readme)             | [![npm](https://img.shields.io/npm/v/@trembus/ui.svg)](https://www.npmjs.com/package/@trembus/ui)             | The component library — primitives (`Box` / `Stack` / `Text` / `Pressable`), form controls, overlays, and Tier-1 data viz. Depends on `@trembus/tokens`.                                                                         |
| [`@trembus/viz`](packages/viz#readme)           | [![npm](https://img.shields.io/npm/v/@trembus/viz.svg)](https://www.npmjs.com/package/@trembus/viz)           | Tier-2 node-link visualizations — `Tree` (hierarchy via `d3-hierarchy`) and `Lineage` (DAG via `dagre`). Tokens only — never depends on `@trembus/ui`.                                                                           |
| [`@trembus/game-viz`](packages/game-viz#readme) | [![npm](https://img.shields.io/npm/v/@trembus/game-viz.svg)](https://www.npmjs.com/package/@trembus/game-viz) | Expressive game / cinematic UI — HUD frames, character dossiers, episode decks, title plates, 3D model thumbnails. A liturgical-gothic idiom over the same contract: _theatrical surface, accessible spine_.                     |

## Quick start

```sh
pnpm add @trembus/ui react react-dom
```

Two lines wire up the whole library — import the stylesheet **once**, pick a theme:

```tsx
import '@trembus/ui/styles.css';
import { Button, Stack } from '@trembus/ui';

export function App() {
  return (
    <div className="tcl-root" data-theme="dark">
      <Stack gap="4">
        <Button tone="accent" onPress={() => console.log('pressed')}>
          Save
        </Button>
      </Stack>
    </div>
  );
}
```

```html
<!-- light is the default; opt into a theme with one attribute -->
<html data-theme="dark"></html>
<!-- light (default) · dark · reliquary -->
```

Theming is pure CSS custom properties — override any `--tcl-*` token to re-skin, or flip
`[data-theme]` for the built-in themes. Surfaces can also wear a **material** skin
(`<Box material="glass">`).

## First principles

Every component is built to satisfy the **three irreducible UI jobs**:

1. **Reveal State** — make machine/data state perceivable.
2. **Afford Action** — expose capability with a visible affordance.
3. **Acknowledge Input** — respond perceivably to every input (close the feedback loop).

…by composing a small set of **primitives** that map to the five UI primitives:

| Primitive          | Maps to    | Responsibility                                                     |
| ------------------ | ---------- | ------------------------------------------------------------------ |
| `Box`              | Surface    | bounded region: padding, surface, radius, border, z-layer (tokens) |
| `Stack` / `Inline` | Relation   | order & grouping made visual (flex over `Box`)                     |
| `Text`             | Mark       | draws glyphs; meaning comes from `as` (`h1`, `label`, …)           |
| `Pressable`        | Affordance | the one interactive element; owns the idle→hover→pressed→focus FSM |

The Affordance state machine lives once in `useAffordanceState` and is exposed as a
`data-state` attribute, so feedback is structural rather than re-implemented per component.

### The contract discipline

Each component owns a `*.contract.ts` — the single source of truth declaring how it
satisfies the three jobs and which Storybook story demonstrates each. The
`ComponentContract` type makes the three jobs non-optional (you cannot compile a contract
that omits one), and `pnpm check:contracts` verifies the named stories actually exist. The
canonical five-file shape per component is enforced:

```
src/components/<Name>/
  <Name>.tsx           # implementation (composes primitives)
  <Name>.css           # @layer tcl.components { .tcl-<name> … }  — var(--tcl-*) only
  <Name>.contract.ts   # the 3-jobs contract (single source of truth)
  <Name>.stories.tsx   # Default / States / Interaction (names match the contract)
  <Name>.test.tsx      # behavior + jest-axe (zero axe violations required)
```

## Repository layout

This is a [pnpm workspace](https://pnpm.io/workspaces). The five packages above live under
`packages/`; two non-published members ride along:

```
packages/
  tokens/      @trembus/tokens      — design-token foundation (published)
  icons/       @trembus/icons       — shared glyph / icon set  (published)
  ui/          @trembus/ui          — component library      (published)
  viz/         @trembus/viz         — Tier-2 node-link viz    (published)
  game-viz/    @trembus/game-viz    — game / cinematic UI     (published)
  video/       @trembus/video       — Remotion app that renders components to MP4 (private)
demos/
  soul-steel/  a multi-page demo site that consumes the published API (private)
.storybook/    one Storybook globs every package's stories
```

- **[`packages/video`](packages/video/README.md)** is a [Remotion](https://www.remotion.dev/)
  app that imports the real components + their `styles.css` and renders them to video — the
  whole token system runs in headless Chromium with zero re-authoring.
- **[`demos/soul-steel`](demos/soul-steel/README.md)** dog-foods the **published** API
  (bare specifiers + each package's `dist/styles.css`) across routed pages, the way a
  downstream product would.

## Development

Clone, then from the repo root:

```sh
pnpm install
pnpm dev               # Storybook (docs + playground) on :6006
pnpm run validate      # the full gate: lint → typecheck → contracts → test → build → verify:exports → storybook
```

Per-task scripts (run at the root, or scoped with `pnpm --filter @trembus/<pkg> <script>`):

```sh
pnpm test              # unit tests (jsdom + axe a11y) — runs anywhere
pnpm test:stories      # story tests in a real browser (needs: pnpm exec playwright install chromium)
pnpm typecheck
pnpm lint
pnpm build             # each package → dist/{index.js, index.d.ts, styles.css}
pnpm check:contracts   # enforce the 3-jobs contract per component
pnpm verify:exports    # publint + are-the-types-wrong
pnpm demos:check       # build the libs, then typecheck + build every demo site (consumer-API guard)
```

Adding a component? `node .claude/skills/new-component/scaffold.mjs <Name> [--pkg ui|viz|game-viz]`
scaffolds the canonical five-file shape and wires the barrel. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Nicholas Osto
