# demos/* — demo sites

Moved here from the root `CLAUDE.md` (lines 143–165 of the 2026-08-11 revision) on 2026-09-09 so it loads only when working under this directory. `AGENTS.md` (the Codex twin) still carries the old copy.

## Demo sites (multi-page apps)

A **demo site** is a real consuming app — multiple **routed** pages, an app shell, navigation,
root-level theme — exercising the components the way a downstream product does (which neither
Storybook nor the `Examples/*` single-canvas stories cover). They live under the top-level
**`demos/*`** workspace glob (NOT `packages/`), each a private Vite + react-router SPA. First one
shipped: `demos/soul-steel/` (composes all three packages; see its `README.md`).

- **Consume the PUBLISHED API only** — import the bare specifiers (`@trembus/ui`, `@trembus/viz`,
  `@trembus/game-viz`) + each package's `./styles.css`, never deep/relative `packages/*/src` paths.
  ui/viz styles.css bundle the full `@trembus/tokens` layer system; game-viz's (0.4.0+) carries
  only its own component CSS — so ALL three style entries get imported, and the libs must be
  **built** first (the demo resolves their `dist/`) — that's the point: it dog-foods the real
  consumer surface.
- **Off the `validate` gate**, like `packages/video`: living under `demos/` keeps it invisible to
  `scripts/check-contracts.ts` (scoped to `packages/{ui,viz,game-viz}`); it's in the root
  `eslint`/`prettier` ignores; and its scripts are named OFF the gated set (`dev` / `build:site` /
  `preview` / `tc`, not `build` / `test` / `typecheck`) so `pnpm -r <gated>` skips it.
- **Dog-food check** is deliberate + separate: `pnpm demos:check` (root) builds the three libs, then
  `tc` + `build:site` every demo. Run it (or a dedicated CI job) to catch consumer-facing API breaks
  without letting a WIP demo page block a library release.
- Preview live via the Claude_Preview MCP — `.claude/launch.json` has a `soul-steel` config
  (`preview_start({name:'soul-steel'})` → :5174). Same `data-theme` + `.tcl-root` wrapper as Storybook.
