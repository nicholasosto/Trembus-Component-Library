# @trembus/ui — guide for Claude

Web React component library (NOT Roblox — that's the separate `@trembus/rbx-ui`).
First-principles UX: tokens → primitives → components, each carrying a machine-checked
"3 UI jobs" contract (Reveal State / Afford Action / Acknowledge Input).

## Commands

- `pnpm run validate` — the full gate: lint → typecheck → check:contracts → test → build →
  verify:exports → build:storybook. Run before declaring work done.
  NOTE: it is `validate`, not `ci` (pnpm reserves the `ci` command).
- `pnpm test` — unit tests (jsdom + axe), runs anywhere.
  `pnpm test:stories` runs stories in a real browser and needs
  `pnpm exec playwright install chromium` first.
- `pnpm dev` — Storybook (docs + playground) on :6006.
- `pnpm check:contracts` — enforce the 3-jobs contract per component.

## Visual preview — Claude drives Storybook live

Boot Storybook through the **Claude_Preview MCP**, not Bash: `preview_start({name:'storybook'})`
reads `.claude/launch.json` (`storybook dev -p 6006 --ci`) and serves on :6006; then
`preview_screenshot` / `preview_snapshot` / `preview_click` / `preview_eval` /
`preview_console_logs` drive it. Eyeball a component here before the `validate` gate.

- **Theme**: global `theme` (`light|dark`) → `data-theme` on `<html>` (`.storybook/preview.tsx`).
  Force dark by navigating with `&globals=theme:dark`.
- **Story ids** slugify the title — `components-button--states`, `visualizations-hub--default`.
- **Responsive**: `preview_resize` mobile/tablet/desktop presets.

## Adding a component — the canonical 5-file shape

Fastest path: `node .claude/skills/new-component/scaffold.mjs <Name>` (the `/new-component`
skill). It scaffolds the shape below and wires the barrel.

Every component in `src/components/<Name>/` has EXACTLY:
`<Name>.tsx · <Name>.css · <Name>.contract.ts · <Name>.stories.tsx · <Name>.test.tsx`

- Export it from `src/index.ts` (the barrel); `contract.name` must equal the directory name.
- `scripts/check-contracts.ts` enforces the shape + that each of the three jobs names a real
  exported story. Use the story names `Default` / `States` / `Interaction`.

## Example pages (multi-component compositions)

Pages that group several components together are NOT library components — they have no single
"3 jobs" contract. Put them in `src/examples/`, **not** `src/components/` (the contract checker
scans every `src/components/<Name>/` dir and would fail the gate demanding a contract). A plain
`<Name>.stories.tsx` there is all you need — no contract / css / test files; Storybook still
finds it via the `src/**/*.stories.tsx` glob. Title them `Examples/*` and compose from the public
barrel (`../index`) so the example exercises the real consumer API. See
`src/examples/Dashboard.stories.tsx`.

## Conventions

- **Tokens only**: components reference `var(--tcl-*)` — never hardcode a hex. Component CSS
  lives in `@layer tcl.components`. Tokens are defined once in `src/styles/tokens.*.css`;
  light is the default, dark via `[data-theme="dark"]`.
- **TypeScript**: `verbatimModuleSyntax` is on → use `import type { … }` for type-only
  imports. `noUncheckedSideEffectImports` is on → CSS imports rely on `src/global.d.ts`.
- **Accessibility**: every component test asserts
  `expect(await a11yViolations(container)).toEqual([])` using `src/test/a11y.ts` — it disables
  page-level axe rules (region / landmark / page-has-heading-one) that false-positive on
  isolated fragments and portals. `.storybook/preview.tsx` disables the same rules for the
  browser a11y gate.
- **Compose from primitives**: `Box` (Surface), `Stack`/`Inline` (Relation), `Text` (Mark),
  `Pressable` (Affordance — owns the interaction FSM → `data-state`). Compound components use
  `Object.assign(Root, { Sub })`. `asChild` uses `src/utils/Slot`.
- Labeled controls (Input/Textarea/Select) share `src/internal/field` (FieldShell +
  useFieldIds) — one source of truth for label/description/error wiring.

## Gotchas (learned the hard way — don't rediscover these)

- **Storybook + a required prop + a render-only story** → Storybook's types STILL demand
  `args`. Put a default in the meta `args` (e.g. Dialog/Select/Tooltip/Hub).
- **jsx-a11y**: keep interaction handlers off a container with a composite role (e.g.
  `tablist`/`menu`) — put them on the focusable children.
- **Portals render synchronously** (no deferred `useEffect` mount) so a parent's focus/measure
  effect sees the node on the same commit (see `src/utils/Portal.tsx`).
- **attw**: this is an ESM-only package — `verify:exports` runs with `--profile esm-only` and
  excludes the `./styles.css` entrypoint.
- **Viz datum ids — never fall back to the label.** Use `id ?? \`s${i}\``(index), NOT`id ?? label`. Duplicate labels/names with no id collide → wrong inspector target, double
  selection rings, duplicate React keys. Recurred in LineChart/Donut/Heatmap — same fix each time.
- **Forced viz domains must clamp.** A forced `min`/`max` (or band/target) can invert the scale or
  push points/lines outside the plot box. Guard `hi <= lo`, swap inverted pairs, SVG `clipPath` the
  series, and skip overlay buttons whose value is out of domain (no phantom clickables).
- **A clamped meter must clamp everywhere.** Clamp the value ONCE and feed the same number to the
  needle, readout, `aria-valuenow` AND `aria-valuetext` — else a screen reader announces two
  different values for out-of-range input (Gauge).
- **`color-mix(in oklab, <tone> N%, var(--tcl-surface-sunken))`** is the tokens-only way to make a
  continuous intensity scale (Heatmap); for cell text over arbitrary mixes use `var(--tcl-text)` +
  a `var(--tcl-bg)` halo so it stays legible on both dark and bright cells, in both themes.
- **Inline text on a SOLID tone fill uses the tone's `-fg` token, not `var(--tcl-text)`.** The
  status tokens are AA-tuned for white in light theme and dark-fg in dark theme, so a solid-tone
  cell (Treemap) must set its text to `var(--tcl-status-<tone>-fg)` / `var(--tcl-accent-fg)` — plain
  `--tcl-text` fails contrast on the darker light-theme tones. Custom hex fills can't map to a tone
  fg → fall back to `--tcl-text` + the `--tcl-bg` halo above.
- **A clamped bar must clamp its label too.** If a bar's width is capped (`clampPct`), the % it
  prints must clamp to the same ceiling — else an out-of-order/non-monotonic datum shows e.g. "150%"
  next to a full bar (Funnel: conversion vs top, and "% retained"). Size bars against the largest
  datum (not strictly the first) so a zero/low reference can't collapse every bar to empty.

## Visualizations

Data-driven viz components (e.g. `Hub`) consume the **Trembus Visual Grammar** JSON contracts
(schemas at `…/Project-Spaces/LLM-Agent-Development/canonical/kits/visual-grammar/schema/`).
Mirror the schema as a TS type so ONE contract renders in both the static HTML kit and React.
Title these `Visualizations/*` in Storybook. Tier-1 (deterministic layout, no heavy deps) lives
here; Tier-2 (flow/topology graphs needing a layout engine) is planned for a sibling
`@trembus/viz` package.

**The Tier-1 viz spine** (Hub · BarChart · LineChart · DonutChart · Heatmap): lead job is
_reveal-state_, but afford/acknowledge are real — each datum is a focusable **HTML `<button>`**
(not an SVG node) carrying the accessible name, driven by controlled/uncontrolled `selectedId`
(+ `defaultSelectedId` + `onSelect`), with an `aria-live` **inspector** revealing the selected
datum. The SVG/grid is decorative (`aria-hidden`); when points live inside an SVG (LineChart),
overlay HTML buttons positioned by `%` over a `preserveAspectRatio` chart so axis text never
distorts and selection stays accessible. **Gauge** (`role=meter` + `aria-valuetext`) and
**Sparkline** (`role=img`/decorative) are the presentational exceptions — they declare
afford/acknowledge as "presentational" like Badge/Skeleton and may name their third story
descriptively (`Labeled`/`Zones`); the checker only requires the contract to point at a real story.
