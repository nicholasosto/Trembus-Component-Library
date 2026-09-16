# packages/video — Remotion gotchas

Moved here from the root `CLAUDE.md` (lines 60–72 of the 2026-08-11 revision) on 2026-09-09 so it loads only when working under this directory. `AGENTS.md` (the Codex twin) still carries the old copy.

**Motion / video — `@trembus/video`** (`packages/video/`, private, **not a published library**) is a
**Remotion** app that renders the real components to video: a composition `import`s the actual
`@trembus/game-viz` component **and** the ui / viz / game-viz `styles.css` entries, so the whole
`@layer`/`var(--tcl-*)`/`color-mix` token system renders in headless Chromium with zero re-authoring
(verified — a `CinematicHero` promo renders at full fidelity). It sits **outside the `pnpm validate`
gate** (no `*.contract.ts`, no axe): its scripts are named off the gated set
(`studio`/`render`/`still`/`tc`) so `pnpm -r` skips it, and `packages/video` is excluded from the root
`eslint`/`prettier` scope. **Remotion gotchas:** drive motion off `useCurrentFrame()` — it does NOT
mock the wall clock, so the components' own CSS transitions / `model-viewer` rAF won't animate
(reuse the look, own the motion in frame-space); load `--tcl-font-display` explicitly (the repo ships
no Cinzel face — use `@remotion/google-fonts`); set `data-theme` per composition; pin all
`@remotion/*` to ONE exact version. Remotion is **source-available** (free ≤3 people, paid Company
License at 4+). See `packages/video/README.md`.
