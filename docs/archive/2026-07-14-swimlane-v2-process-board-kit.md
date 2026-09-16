---
title: 'Swimlane v2 — process-board kit for the command centers'
date: 2026-07-14
source: 'external' # filed from the Project-System workspace (Processes-view revamp)
category: 'other' # component work: @trembus/ui + @trembus/icons
status: accepted # new | accepted | declined
tags: [swimlane, run-history, icons, command-center]
---

## Idea

A readability + extensibility pass on `@trembus/ui`'s **Swimlane** (plus two glyphs in
`@trembus/icons`), driven by daily use in two consuming command centers. Five requests,
roughly in priority order — all must be **non-breaking** (0.x minor):

1. **Lane headers: icon-only kind glyphs.** Today the lane head renders an 8px dot + the raw
   uppercased kind word (`HUMAN` / `SYSTEM` / `TOOL`) — `Swimlane.tsx:289-306`. Replace both
   with a per-kind glyph from `@trembus/icons` (already a dependency of ui):
   `human → user` · `system → server` · `tool → wrench` (new glyph) · `ai → sparkle` (new
   glyph; `robot` also fine) · `neutral → none`. The kind name moves to a `title` tooltip +
   `aria-label` so nothing is lost to assistive tech; the lane label gets the freed width.

2. **Card readability + parametrized geometry.** Step labels/details are single-line ellipsis
   clips at a fixed 140×60px card (`.tcl-swimlane__step-label` / `__step-detail`), and only the
   label has a hover `title` (`Swimlane.tsx:384` — `detail` has none). Asks:
   - label wraps to 2 lines; `detail` gains a `title` tooltip;
   - taller default-feel cells to fit the wrap;
   - the module-level geometry constants (`COL_W 168 / CELL_W 140 / LANE_H 88 / CELL_H 60 /
PAD 14`, `Swimlane.tsx:96-101`) parametrized — CSS custom properties (`--tcl-swimlane-*`)
     or a `density`/`size` prop — **defaulting to today's metrics** so existing consumers render
     unchanged. Note the constants are shared with the SVG connector layout (`buildLayout`,
     `:132-204`), so the parametrization has to feed both.

3. **A per-step marker/annotation slot on the card** — a small badge region consumers can fill
   (e.g. "this step realizes decision 0013" or a file-op glyph) without forking the card markup.
   A render-prop or a light `markers?: { id, glyph, title }[]` field both work.

4. **`RunOutput.op?: 'create' | 'modify' | 'delete'`** on the RunHistory output type, with the
   `OutputChip` (`RunHistory.tsx:376-390`) rendering a git-style `+` / `~` / `−` glyph prefix
   when present. The consuming apps already author `op` on step/run outputs and render it in
   their step-detail drawers; this brings the run-inspector chips into the same language.

5. _(Optional)_ **Barrel-export `applyRun`** — both consumer apps hand-copy the same
   run-over-definition replay from the `Examples/SwimlaneRuns` page (`applyRun.ts`). One
   canonical export removes two drifting copies.

## Context

Two consumers are waiting on this, both rendering the project-system emitted contract
(`workflows` + `runs` facets) as a Processes surface:

- **Project-System Command Center** (`Project-Spaces/Project-System/apps/command-center`, on
  `@trembus/ui ^0.2.0` — will jump straight to the new minor). Its 2026-07-14 Processes/Decisions
  revamp shipped app-side: a non-reflowing right-overlay step drawer, "Decided in" decision chips,
  and git-style file-op output rows. The lane-header dots/kind-words and the clipped card text are
  the remaining readability items, and they live in the kit.
- **Astrix Operations command center** (`Project-Spaces/Astrix-Systems/Operations/command-center`,
  `@trembus/ui ^0.6.0`). Ports the same design once this ships, so it lands in final form.

The step-marker slot (3) is the deferred option from Project-System decision 0013 ("extend
`@trembus/ui` `SwimlaneStep` … only warranted if a second consumer needs in-kit ref rendering")
— the second consumer now exists.

## Notes

- House rules honored: per-component 3-jobs contract + jest-axe (`CONTRIBUTING.md`), root
  Keep-a-Changelog entries per package, ship via the `/release` skill (`RELEASING.md`, pnpm-only
  publish).
- Suggested versions: `@trembus/ui 0.8.0` (from 0.7.0) + `@trembus/icons 0.2.0` (from 0.1.0 —
  adds `wrench` + `sparkle`/`robot` to `monochrome.tsx`/`registry.tsx`).
- Back-compat is the hard constraint on (1) and (2): default geometry unchanged, kind word only
  moves into tooltip/aria (it was `aria-hidden` decoration anyway — the actor name each step
  announces comes from the step button's `aria-label`, untouched).
- When published: Project-System bumps `apps/command-center` to `^0.8.0` (clear
  `node_modules/.vite` + restart dev server), then the Astrix port follows.
