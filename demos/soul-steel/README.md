# `@trembus-demo/soul-steel`

A **multi-page demo site** that consumes the Trembus component library the way a
real downstream product would — through each package's **published API**
(`workspace:*` + the `./styles.css` entrypoint), across **routed pages** with an
app shell, navigation, and a light/dark theme toggle.

This is the surface that Storybook and `Examples/*` stories don't cover:
Storybook isolates one component; `Examples/*` compose several on one canvas.
A demo site is a **real app** — multiple routes, a layout shell, page
transitions, theme at the root — exercising the components as a consumer hits
them.

## Pages

| Route        | Composes                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------- |
| `/`          | `CinematicHero` (game-viz) + nav cards (`Box as={Link}`, ui)                                  |
| `/roster`    | `SoulCard` ×2 + a `Reliquary`-framed `Effigy` 3D model (game-viz)                             |
| `/episodes`  | `EpisodeDeck` (game-viz) wired to page state, beside a `Lineage` (viz) of the arc            |

The shell (`src/app/Shell.tsx`) is built from the `@trembus/ui` primitives
(`Box` / `Inline` / `Text` / `Button`) and react-router `NavLink` / `Outlet`.

## Run it

The demo consumes the **built** `dist/` of each package (its real published
artifacts), so the libraries must be built first:

```bash
# from the repo root — build the three consumed libs, then dev the site
pnpm --filter @trembus/ui --filter @trembus/viz --filter @trembus/game-viz run build
pnpm --filter @trembus-demo/soul-steel dev        # http://localhost:5174
```

Other scripts (run with `pnpm --filter @trembus-demo/soul-steel <script>`):

- `dev` — Vite dev server
- `build:site` — production build to `dist/`
- `preview` — serve the production build
- `tc` — typecheck (`tsc --noEmit`)

## Why it's off the `validate` gate

A half-built demo page should never block a `@trembus/ui` patch release, so demo
sites sit **outside** the per-component gate (no `*.contract.ts`, no axe), the
same way `packages/video` does:

- it lives under `demos/` (not `packages/`), so `scripts/check-contracts.ts`
  never scans it;
- it's in the root `eslint`/`prettier` ignore lists;
- its scripts are named **off** the gated set (`dev` / `build:site` / `tc`,
  not `build` / `test` / `typecheck`), so `pnpm -r <gated-script>` skips it.

But the dog-food value is real — a consumer-facing API break should show up as
"the demo no longer compiles." So there's a deliberate, separate check you run
on demand (and can wire into its own CI job):

```bash
pnpm demos:check    # from the repo root: builds the 3 libs, then tc + build:site every demo
```

## Adding another demo

Create `demos/<name>/` with the same shape (`package.json` private + off-gate
scripts, `vite.config.ts`, `tsconfig.json` extending `../../tsconfig.base.json`,
`index.html`, `src/`). The `demos/*` workspace glob and `demos:check` pick it up
automatically.
