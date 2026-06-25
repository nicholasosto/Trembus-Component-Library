# Contributing to the Trembus Component Library

Thanks for your interest! This is a [pnpm workspace](https://pnpm.io/workspaces) of
React component packages built on one idea: **tokens → primitives → components**, where
every component carries a machine-checked contract proving it does the three irreducible
jobs of any UI — _Reveal State_, _Afford Action_, _Acknowledge Input_.

## Getting set up

Requires Node ≥ 20 and [pnpm](https://pnpm.io) (the repo pins a version via
`packageManager`).

```sh
git clone https://github.com/nicholasosto/Trembus-Component-Library.git
cd Trembus-Component-Library
pnpm install
pnpm dev               # Storybook (docs + playground) on http://localhost:6006
```

## The gate

Before opening a PR, run the full gate from the repo root — CI runs the same steps:

```sh
pnpm run validate
# lint → typecheck → check:contracts → test → build → verify:exports → build:storybook
```

You can scope individual steps to one package with
`pnpm --filter @trembus/<pkg> <script>` (e.g. `pnpm --filter @trembus/ui test`).

## Adding a component

Use the scaffolder — it generates the canonical five-file shape and wires the package
barrel so the new component passes `validate` out of the box:

```sh
node .claude/skills/new-component/scaffold.mjs <Name> [--pkg ui|viz|game-viz]
```

`--pkg` defaults to `ui` (titled `Components/*` in Storybook); `viz` titles
`Visualizations/*`, `game-viz` titles `Game/*`. Every component lives in
`packages/<pkg>/src/components/<Name>/` with **exactly** these five files:

```
<Name>.tsx           # implementation (composes primitives)
<Name>.css           # @layer tcl.components { .tcl-<name> … }  — var(--tcl-*) only
<Name>.contract.ts   # the 3-jobs contract (single source of truth; contract.name === dir name)
<Name>.stories.tsx   # stories named Default / States / Interaction
<Name>.test.tsx      # behavior + jest-axe
```

Export it from `packages/<pkg>/src/index.ts`. `pnpm check:contracts` enforces the shape
and that each of the three jobs names a real exported story.

## Conventions

- **Tokens only.** Components reference `var(--tcl-*)` — never hardcode a hex. Component
  CSS lives in `@layer tcl.components`. Tokens are defined once in `@trembus/tokens`.
- **Accessibility is non-negotiable.** Every component test asserts
  `expect(await a11yViolations(container)).toEqual([])`. Decorative chrome is
  `aria-hidden`; interactive elements are real focusable controls; tone-coding is always
  paired with a word; motion sits behind `prefers-reduced-motion`.
- **Compose from primitives** (`Box`, `Stack`/`Inline`, `Text`, `Pressable`). Compound
  components use `Object.assign(Root, { Sub })`.
- **TypeScript.** `verbatimModuleSyntax` is on → use `import type { … }` for type-only
  imports.
- **Package boundaries.** `@trembus/viz` depends on `@trembus/tokens` only (never on
  `@trembus/ui`). `@trembus/game-viz` builds on `@trembus/ui`. Keep it that way.

There's a longer architectural tour in [`CLAUDE.md`](CLAUDE.md) (written for the AI
assistant, but accurate and useful for humans too).

## Pull requests

- Branch off `main`, keep PRs focused, and make sure `pnpm run validate` is green.
- Describe **what** changed and **why**; if it's a component, note how it satisfies the
  three jobs.
- New behavior needs a test (and, for a fix, a regression test).

## License

By contributing, you agree your contributions are licensed under the project's
[MIT License](LICENSE).
