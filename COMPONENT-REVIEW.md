# Component review — 2026-07-25

A one-time audit of the library **as a set**: 60 contracted components across `@trembus/ui`,
`@trembus/viz` and `@trembus/game-viz`, added one or two at a time. The question was whether
pairs that look alike — `Meter` / `Progress` was the prompt — are one component wearing two
names.

**Headline: zero merges.** Every family passes the tests below, and the boundaries are already
documented. The debt is one level down — the same _code_ repeated where a canonical version
already exists — plus one naming collision and one doc-vs-reality drift.

This file is the durable record. `Examples/Component Review` in Storybook renders the same
verdicts through the library's own `Brief` + `DecisionMap`.

---

## The method

Three tests per family, in order. A family only reaches the next test if it passes the previous.

1. **Intent** — do they answer _different consumer questions_? If a consumer staring at both
   can't tell which to reach for, they are one component (or the docs lie).
2. **Semantics** — do they need _different ARIA / DOM_? If merging would force the consumer to
   choose an ARIA role or element, the split is load-bearing. Choosing semantics for the
   consumer is the library's job.
3. **Duplication** — is the _same code_ in both? If yes, and 1–2 passed, extract a shared
   internal. **Do not merge.**

### When duplication is not debt

`cx` exists three times — [ui](packages/ui/src/utils/cx.ts) ·
[viz](packages/viz/src/internal/cx.ts) · [game-viz](packages/game-viz/src/internal/cx.ts) —
behaviourally **identical**, each carrying a comment explaining why the copy exists (keeps
`viz` free of any `ui` dependency; keeps component internals import-light). `vars` likewise.

That is deliberate and it stays. A five-line leaf util duplicated on purpose beats a
cross-package coupling. Duplication is debt when it is **stateful, divergent, or has a
canonical version that was never adopted** — which is exactly what §2 lists.

---

## 1 · Family verdicts

| Family          | Members                                                                      | Verdict                                  |
| --------------- | ---------------------------------------------------------------------------- | ---------------------------------------- |
| **Fill bars**   | `Meter` · `Progress` · `Gauge`                                               | **Keep** — and reword one variant (§1.1) |
| **Charts**      | `BarChart` · `Funnel` · `Treemap` · `DonutChart` · `LineChart` · `Sparkline` | **Keep** — harden `Treemap`'s boundary   |
| **Collections** | `Table` · `VirtualAssetGrid` · `FolderTree` · viz `Tree`                     | **Keep**                                 |
| **Bars**        | `Toolbar` · `CommandBar` · `NavBar` · `Breadcrumb`                           | **Keep**                                 |
| **Overviews**   | ui `Hub` · viz `SystemMap` · viz `Strata`                                    | **Keep**                                 |
| **Process**     | `Timeline` · `Swimlane` · `RunHistory` · game-viz `Chronicle`                | **Keep**                                 |
| **Status**      | `Badge` · `Callout` · `EmptyState` · `DataStatusBar`                         | **Keep**                                 |
| **Frames**      | game-viz `MediaFrame` · `Effigy` · `EpisodeDeck` · `Reliquary` · `SoulCard`  | **Keep** — but resolve the drift (§3.1)  |

Every member of every family already names its near-neighbours _with the reason_, including
across package lines (`FolderTree` → viz `Tree`; `Hub` → viz `Lineage` / `SystemMap`; `Strata`
→ ui `DonutChart` / `Treemap`; game-viz `Reliquary` → ui `Card` / `Box`). The intent test is
passed by construction, not by assertion.

Composition already does the work a merge would: `RunHistory` builds on `Table`, `Chronicle`
skins `Timeline`, `Constellation` skins viz `TalentTree`, `CommandBar` renders `Toolbar` +
`Menu`, `MediaFrame` delegates loadable models to `Effigy`.

### 1.1 · `Meter` / `Progress` — already the target state

Both are ~50-line wrappers over **`FillBarShell`**
([fillbar.tsx](packages/ui/src/internal/fillbar.tsx)): track geometry, `aria-value*` plumbing,
icon chip, value label and tone→token mapping are one implementation. What differs is what
should — `role="progressbar"` (advancing toward completion) vs `role="meter"` (a measurement in
a known range), plus the variants each needs.

**Merging them would hand the consumer an ARIA-role decision.** That is a regression, not a
simplification. This pair is the yardstick for the rest of the library: _shared internal, two
semantic faces, cross-documented boundary._

### 1.2 · The one real naming collision: `Meter variant="threshold"` vs `Gauge`

`Meter`'s own docs call its `threshold` variant **"a gauge"** in four places
(`Meter.tsx:31`, `Meter.tsx:53`, and twice in the stories) — while `Gauge` is a separate
component. Both carry `role="meter"`, so **the semantics test does not separate them**. Only
the shape does: a linear track that recolours as the value crosses markers, vs a 180° dial with
a needle and colored bands.

The shape difference is legitimate — a linear meter fits a table row where a dial cannot — so
this is a **wording fix, not a code fix**:

- Stop describing the variant as "a gauge". Call it what it is: _recolour-on-crossing_.
- Make **shape** the deciding factor in both components' near-neighbour lines, since ARIA
  cannot be.

Action: 4 doc edits in `Meter`, one line in `Gauge`.

---

## 2 · Duplication to extract (no boundary question, no API change)

| #   | Duplication                                                                                                        | Scale                                             | Canonical version                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Controlled/uncontrolled **selection trio** (`selectedId` / `defaultSelectedId` / `onSelect`) inlined per component | **12** ui components                              | [useControllableSelection.ts](packages/viz/src/internal/useControllableSelection.ts) — its JSDoc says it _"mirrors the inlined pattern the @trembus/ui Tier-1 viz repeated per component."_ Extracted in `viz`, never back-ported. |
| 2   | Hand-rolled **`aria-live` readout / inspector**                                                                    | 17 sites, **not actually duplication** — see §2.2 | n/a                                                                                                                                                                                                                                |
| 3   | Hand-rolled **roving tabindex**                                                                                    | 8 places                                          | none. `FolderTree` ↔ `VirtualAssetGrid` are near-copies; the other six have genuinely different keyboard models.                                                                                                                   |

**1 — selection.** Port the hook to `packages/ui/src/internal/useSelection.ts`. Classify the 12
call sites _before_ touching them and adopt only where the inlined logic is identical.
`DecisionMap` (seeds `decided` > `recommended`, freezes `lockedId`), `FolderTree` (tri-state
checkbox set) and `VirtualAssetGrid` (2D roving over `flatItems`) are expected to diverge —
leave those inline with a one-line comment so the next reader doesn't "fix" them.

### 2.2 · The `aria-live` finding did not survive contact with the code — no extraction

The plan called for a shared `inspector.tsx` carrying `CommandBar`'s keyed-span re-announce.
Reading the 17 sites killed it. **Recorded so nobody re-opens it:**

- **11 are visible inspector panels** (`Hub` · `BarChart` · `LineChart` · `DonutChart` ·
  `Heatmap` · `Treemap` · `Funnel` · `Timeline` · `Swimlane` · `DecisionMap` · `RunHistory`).
  The _only_ thing they share is `<div aria-live="polite">`. The contents are entirely
  per-component — titles, stats, output links, consequence cascades — and each carries its own
  `__inspector-*` classes. A shared wrapper would hoist one element and one attribute while
  fighting eleven CSS namespaces. That is not an abstraction, it is a detour.
- **2 are SR-only announcers** (`FolderTree` · `VirtualAssetGrid`) — three genuinely identical
  lines. Below the extraction threshold, same judgement as `cx` above.
- **The re-announce fix cannot be generalised.** It needs an _activation counter_ — an event
  saying "the user acted", distinct from "the value changed". `CommandBar` has one because
  invoking a command is a repeatable action. A selection inspector has no such event:
  `FolderTree`'s message is derived from filter state each render, so an identical repeat
  produces no mutation and no counter can be inferred from the value alone. Threading a nonce
  into 11 components would add a wrapper `<div>` and remount the inspector subtree on every
  selection, to fix only the case where a user re-clicks the datum that is already selected.
  Cost exceeds benefit; **deferred deliberately, not forgotten.**

The reusable knowledge is already captured where it will be read: the "an `aria-live` readout
does NOT re-announce identical text" gotcha in `CLAUDE.md` / `AGENTS.md` (added with ui 0.10.0).
New components with a genuinely repeatable action must apply it; selection inspectors need not.

**3 — roving.** Investigate only. Extract a core hook _only if_ `FolderTree` and
`VirtualAssetGrid` genuinely match on inspection; otherwise document the recipe and stop. Do
not force one hook across eight keyboard models — `Menu`'s submenu routing, `Toolbar`'s
rove-then-fall-through, `Hub`'s hex geometry and `Timeline`'s de-overlapped axis are not the
same problem.

---

## 3 · Drift and coverage gaps

### 3.1 · game-viz does not compose `ui` the way the docs claim

`CLAUDE.md` / `AGENTS.md` state game-viz "composes `Box`/`Stack`/`Inline`/`Text`/`Pressable`".
Reality — 5 of 8 do:

| Composes `ui`                                                                         | Imports only its own `cx`/`vars`       |
| ------------------------------------------------------------------------------------- | -------------------------------------- |
| `Chronicle` · `CinematicHero` · `MediaFrame` · `SoulCard` · `Constellation` (via viz) | `Reliquary` · `Effigy` · `EpisodeDeck` |

This is where "recombine" genuinely applies. `Reliquary` is the clearest case: 109 lines of TSX
and 107 of CSS to frame a panel, whose own docs say the boundary against ui `Card` / `Box` is
**idiom, not capability**. Built on `Box` + `material` it would shrink and the idiom boundary
would become honest. Either adopt the primitives or correct the claim in both twin files.

### 3.2 · 26 of 52 public names have no consumer proof

Never used by any in-repo consumer (23 files across `demos/soul-steel`, `templates/pages`, and
both `examples/` dirs): `AudioWaveform` · `Breadcrumb` · `Checkbox` · `CommandBar` · `Dialog` ·
`DonutChart` · `EmptyState` · `FolderTree` · `Funnel` · `Gauge` · `Heatmap` · `IconButton` ·
`LineChart` · `Menu` · `Pressable` · `Progress` · `RadioGroup` · `Skeleton` · `Sparkline` ·
`Spinner` · `Tabs` · `Textarea` · `Toast` · `Tooltip` · `Treemap` · `VirtualAssetGrid`.

Not a delete list — Storybook stories and unit tests cover them all. It is a list of APIs no
_real page_ has stress-tested, which is a different kind of confidence. Feed it into future
example/demo choices.

### 3.3 · Near-neighbour guidance: one soft boundary, not seven missing ones

An initial sweep reported seven components with no "not for X — use Y" line. **That was a
measurement error** — it grepped only for the literal phrases `not for` / `not when`, while the
library legitimately varies the wording: "Not a nav menu (`NavBar`)" (`SkipLink`), "Pure display
of a dependency graph → `Lineage`" (`TalentTree`), "Anywhere else: use ui `Timeline` directly"
(`Chronicle`, `Constellation`), "A single known medium deserves its dedicated surface instead:"
(`MediaFrame`).

Re-checked against all the phrasings the library actually uses: **60 of 60 name a
near-neighbour.** Coverage is complete.

One boundary is genuinely soft: **`Treemap`** offers a preference ("for a handful of slices a
`DonutChart` reads faster") but never says what it is _not_ for — while `BarChart`, `DonutChart`
and `Funnel` all name `Treemap` in hard terms. Worth one sentence for symmetry.

---

## 4 · Nothing to deprecate

Phase 4 of the plan — queue the breaking decisions — is **empty**. No public component needs to
be merged or removed. Every name currently on npm keeps its meaning.

---

## 5 · Checks that came back clean

Recorded so they are not re-run from scratch:

- **Every story's `Job:` label agrees with its contract's job→story mapping**, across all 60
  components. (An earlier sweep appeared to show 22 mismatches; that was a measurement error —
  the label names the job a story _demonstrates_, which the contract maps, not the component's
  lead job.)
- **Near-neighbour coverage is 60/60** — every component names at least one sibling and why.
  (An earlier sweep said 53/60; also a measurement error — see §3.3.)
- **Two of this review's three suspected gaps dissolved on inspection** (§2.2, §3.3). Both were
  my own grep artifacts, not library defects. The pattern worth remembering: a grep for one
  phrasing measures the phrasing, not the property.
- **`FillBarShell` and `field`** are already shared correctly by their consumers; no Tier-1 viz
  component reimplements `clampPct` / `toneVar` / `vars`.
