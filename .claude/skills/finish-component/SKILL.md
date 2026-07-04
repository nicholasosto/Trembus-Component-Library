---
name: finish-component
description: Run the Trembus component quality loop on a component before declaring it done — visual verification in both themes via the Storybook preview MCP, a parallel adversarial review (conventions + bug hunt), fixes with regression tests, and the package gate. Use after implementing or substantially changing a component in packages/ui, packages/viz, or packages/game-viz (e.g. "/finish-component Strata", "finish the Gauge component", "run the quality loop on Menu").
---

# finish-component — the quality loop

The bar for "done" in this repo is NOT "tests pass". It is: **eyeballed in both themes,
adversarially reviewed by independent agents, every accepted finding fixed WITH a
regression test, and the gate green.** This skill runs that loop for one component.

## 0 · Scope

Locate `packages/{ui,viz,game-viz}/src/components/<Name>/` (5-file shape). Derive:

- the package (`@trembus/ui` | `@trembus/viz` | `@trembus/game-viz`)
- the Storybook id: title slugified — `Components/<Name>` → `components-<name>--default`,
  `Visualizations/*` → `visualizations-…`, `Game/*` → `game-…`

## 1 · Fast gate first

`pnpm --filter @trembus/<pkg> test` — do not spend preview/agent time on a component whose
unit tests are already red.

## 2 · Visual verification (Claude drives Storybook)

Boot via the preview MCP — never Bash: `preview_start({name:'storybook'})` → :6006.

- Navigate `http://localhost:6006/iframe.html?id=<story-id>&viewMode=story`; force dark with
  `&globals=theme:dark` (add `theme:reliquary` when the component ships themed chrome).
- Screenshot `Default` and `States` in BOTH light and dark. Read, don't vibe: check label
  collisions, contrast of text-on-tone, focus/selection ring distinctness, clipping.
- Exercise the primary interaction (click a datum/control) and confirm the acknowledged
  state: selection ring, inspector/live-region text, `aria-pressed`/`aria-current`.
- `preview_console_logs({level:'error'})` must be clean.
- Preview quirks (learned): a screenshot can lag a just-issued scroll/click — re-read state
  with `preview_eval` after interactions; layout may collapse to 0-width until a first
  screenshot forces paint; %-positioned overlays need their container painted.

Fix anything found (source edits, not preview hacks) and re-check before proceeding.

## 3 · Adversarial review — two agents, IN PARALLEL (one message)

1. **`component-reviewer` agent** — conventions: 5-file shape, contract names a real story
   per job, tokens-only CSS in `@layer tcl.components`, focus ring distinct from selection,
   `prefers-reduced-motion`, axe test present, barrel export + types, `import type`
   discipline, and the CLAUDE.md viz gotchas (ids never fall back to labels; never dim
   focusable controls; tone-as-text legibility; clamped/deterministic layout).
2. **`general-purpose` agent as adversarial bug-hunter** — prompt it to CONSTRUCT concrete
   inputs and trace the code, not skim: duplicate/missing/colliding ids, cycles and
   self-references, empty/single/huge datasets, forced domains and clamping, inverted
   ranges, stale controlled selection, React key collisions, label/marker overlaps,
   off-by-one layering. Require per finding: severity (blocker/should-fix/nit), the exact
   triggering input, the wrong behavior, the minimal fix; end with a ship / fix-first
   verdict. Tell it to drop suspicions that don't survive its own trace.

Feed both agents the component path, its data model, and the sibling component that is the
convention baseline (e.g. Lineage for a Tier-2 viz).

## 4 · Triage + fix

- Accept or reject each finding explicitly — rejections need a one-line reason in the report.
- **Every accepted fix lands with a regression test** that fails before / passes after.
- Duplicated findings across agents = high-confidence; prioritize them.

## 5 · Re-gate

- `pnpm --filter @trembus/<pkg> validate`
- Stories changed? Also `pnpm test:stories` (CI parity: real browser + axe; needs
  `pnpm exec playwright install chromium` once).
- Release-bound? Root `pnpm validate`.

## 6 · Report (the done-bar)

State plainly: stories verified (which themes, which interactions), findings table
(finding → fixed-with-test | rejected-because), and the exact gates that ran green. If any
leg was skipped, say so — do not declare done past a skipped leg.
