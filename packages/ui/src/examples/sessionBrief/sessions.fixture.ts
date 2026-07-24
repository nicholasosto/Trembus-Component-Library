/**
 * Real session entity records from the three project spaces, captured verbatim on
 * 2026-07-24 (plus one synthetic `blocked` sample — the only lifecycle status with
 * no real occurrence to borrow). Each record is the raw markdown of a
 * `_project/sessions/<id>.md` file: ProjectEntity frontmatter + the canonical
 * session scaffold (Goal · Success Criteria · Source References · Decisions ·
 * [First-Principles Candidates] · Outputs · Blockers · Next Action · Handoff Notes).
 *
 * Fixtures, not live reads — the story must render without the private spaces on
 * disk. Refresh by re-running the generator against the real records.
 */

export interface SessionRecord {
  /** Filename stem — the entity id (the `_project/` link target). */
  id: string;
  /** The project space the record lives in. */
  space: string;
  /** The record's raw markdown, verbatim. */
  markdown: string;
}

/** ACTIVE — mid-flight: scaffold placeholders still in Outputs/Blockers/Next Action/Handoff; wiki-link references. */
export const rdsActiveSession: SessionRecord = {
  id: '2026-07-24-tgl-flow-and-structure-nail-the-concepts',
  space: 'Roblox-Development-Studio',
  markdown: `---
title: "TGL flow and structure — nail the concepts"
status: active
updated: 2026-07-24
tags: { last-active: 2026-07-24T09:22, kos: "decisions, soul-steel, dashboards, studio-mcp" }
---

# TGL flow and structure — nail the concepts

> **Status:** active (2026-07-24)

## Goal

Nail down the concept model for TGL (Trembus-Game-Library, the Roblox Package) — its structure
(composition, granularity, namespace ownership) and its flow (how content is authored, enters the
package, gets recorded, and is consumed) — *before* executing any mechanics (ADR 0011 step 1 is
deliberately queued behind this). Part of the larger goal: finalizing the Roblox Studio
development pathway.

## Success Criteria

- The composition/granularity question (ADR [[0011-tgl-package-vs-syncback-boundary]] §4 namespace
  overload) has an answer — recorded as a decision entity or an explicit, reasoned deferral
- The authoring flow per content type (Studio-born effects vs file-born props/rigs) is agreed and
  written down, including where the package's home copy lives
- The canonical record per surface (package asset · master Assets exports · syncback repos ·
  testing-env projection) is named, with no surface left ambiguous
- Outcomes recorded via tooling (decision entity and/or engram Decisions), validate stays 0 errors

## Source References

- decisions [[0011-tgl-package-vs-syncback-boundary]] (accepted; §4 deferred) · [[0008-studio-native-lab-lane]] · [[0009-soul-steel-universe-topology]]
- engrams [[2026-07-23-rojo-packages-and-syncback-re-evaluation]] (handoff) · [[2026-07-22-current-status-report]] ("package the outputs, not the workbench")
- pipeline [[v2-effects-library-normalization]] (steps 2–4 pending: tuning walk, retire V2, promote)
- \`soul-steel-universe/crystal-sanctum/src/ServerStorage/TrembusGameLibrary/\` (effects half, flattened)
- \`roblox-testing-environment/default.project.json\` (Props/Rigs projection of the TGL namespace)
- \`~/Master-Managed/Assets/runtime/roblox/TGL-backup/TrembusGameLibrary.rbxm\` (whole-package export)

## Decisions

- Operator deleted the hub's ServerStorage backup copy of TGL to reduce confusion — the published
  asset's version history is the backup; live probe confirms hub ServerStorage is now empty
- **Grand package blessed** (Q2a): TGL is *one* package — the Roblox-side distribution of the
  master Assets library; a version bump is a library release → ADR
  [[0012-tgl-grand-package-model-and-satellite-naming]] (accepted this session)
- **Satellite rename chosen and half-executed** (Q2c): \`TGL-Preview\` applied in
  \`roblox-testing-environment/default.project.json\` (only reference in the repo); \`TGL-Staging\`
  queued as a Studio rename for the next crystal-sanctum session (0012 §3)
- ADR [[0011-tgl-package-vs-syncback-boundary]] §1 **re-aimed** via amendment note: the ignore
  rule targets the hub (\`Workspace/Trembus-Game-Library\`), not crystal-sanctum's staging, which
  stays syncback-recorded until the v16 fold-in
- \`CLAUDE.md\` TGL paragraph reconciled to the grand-package model (asset id, hub home copy,
  satellite names, re-aimed boundary)
- **2b answered**: \`00-Subpackages\` = the **incubation shelf** — dynamic test/sandbox packages
  under conceptual development. \`Part-Texture-Testing-Lab\` = materials/textures/Studio-MCP
  building-design environment; \`User-Interface-Development-Lab\` is the UI counterpart, living in
  \`StarterGui\` because it is UI-based. \`Beamaract\` identity still unconfirmed → 0012 open items
  updated

## First-Principles Candidates

- The live TGL package copy (hub \`Workspace.Trembus-Game-Library\`, PackageLink intact,
  \`rbxassetid://119571962868471\`, v15) already spans six content families + a \`00-Subpackages\`
  folder of nested packages — the docs' "effects half / props-rigs half" model described staging
  areas and projections, not the package → decision (0012 candidate)
- A package-boundary ignore rule must target where a *linked* copy actually lives (hub:
  \`Workspace/Trembus-Game-Library\`), not where flattened staging landed — ADR 0011 step 1 as
  written aims at crystal-sanctum's staging folder, and the hub's next syncback would flatten all
  ~7k package instances unprotected → decision (0011 amendment)
- Hyphenated \`Trembus-Game-Library\` (the package) vs un-hyphenated \`TrembusGameLibrary\`
  (staging/projections) is an accidental namespace pun — same words, different instances — inviting
  exactly the confusion the operator just deleted a backup over → decision
- Crystal-sanctum's \`ServerStorage.TrembusGameLibrary\` was script-built by the normalization pass
  (un-hyphenated name, no insert from the asset), so it is almost certainly a plain staging folder
  and never was the package copy — syncback's PackageLink-stripping made the two
  indistinguishable in git → decision (verify live when crystal-sanctum is next open)

## Outputs

- <artifact produced>

## Blockers

- <blocker, or “none”>

## Next Action

<the single next concrete action>

## Handoff Notes

<what the next session needs to know>
`,
};

/** COMPLETED — the reference shape fully filled: markdown links, bold-lead decisions, → dispositions. */
export const psCompletedSession: SessionRecord = {
  id: '2026-07-22-commands-deep-review-remediation-and-scheduled-routines-brid',
  space: 'Project-System',
  markdown: `---
title: "Commands deep-review remediation and scheduled-routines bridge"
status: completed
updated: 2026-07-22
tags: { last-active: 2026-07-22T13:55, kos: "spec, decisions, consumers, dashboards, memory" }
---

# Commands deep-review remediation and scheduled-routines bridge

> **Status:** completed (2026-07-22)

## Goal

Close out a deep review of the command surface — remediate the drift it found — and extend the
session lifecycle with a propose-only lane that spots recurring toil worth becoming a standing
scheduled routine.

## Success Criteria

- \`node tools/validate.mjs\` reports 0 errors and 0 warnings.
- \`npm test\` green, including an extended \`init-config.mjs\` self-test asserting the new \`cadence\` tag.
- \`node tools/check-consumer-drift.mjs\` green across all registered consumers.
- \`diff -r examples/soul-steel-demo/.claude templates/consumer/.claude\` is empty (the fixture gate the
  port pipeline claimed but could not actually satisfy).
- ADR 0017, a \`session-lifecycle-and-bridge\` feature entity, and the deep-review report all exist and
  are linked.
- The upgraded \`/end\` sweep runs its own new Automation-candidates lane over this session.

## Source References

- [Port pipeline](../pipeline/port-session-lifecycle-self-improvement-bridge.md) — the 2026-07-21 lifecycle + bridge build record.
- [Spec](../../docs/spec/schema.md) — §3 · §4a · §4b · §7a · §7b · §8.
- The five command files: \`.claude/commands/{start,end}.md\`, \`templates/consumer/.claude/commands/{start,end,reflect}.md\`.
- \`apps/command-center/src/workflows.ts\` — the empty \`SCHEDULED_IDS\` group awaiting a contract signal.

## Decisions

- Routine detection is **two-stage**: \`/end\` records candidates per-session into the First-Principles
  export queue under a new \`routine\` home token; \`/reflect\` aggregates the window and emits the actual
  proposals. A single session cannot establish recurrence — that is the whole reason for stage two.
- An **accepted** routine is recorded as a workflow entity carrying a registered \`cadence\` tag. That is
  the contract signal the Command Center's empty \`SCHEDULED_IDS\` group has been waiting for; the hookup
  itself stays deferred to the queued runs/facet governance ADRs.
- **One merged ADR 0017** covering lifecycle + bridge + routines lane, as the port pipeline reserved
  ("do not mint two 0017s"). Runs/facets governance moves to 0018+.
- The demo fixture's \`.claude/\` gets a **full verbatim re-vendor including \`skills/\`** — it mirrors the
  complete consumer surface an adopter is told to copy, and it is never executed in place.
- \`session.render.sub\` ("8 sections") **left as-is**: \`requiredSections\` is exactly 8, and the 8-required
  / 9-scaffolded asymmetry is the documented contract, not a typo.

## First-Principles Candidates

- Parallel authoring converges on plausible-but-contradictory text; only an adversarial reader comparing
  the surfaces against each other catches it → decision (recorded in ADR 0017's Consequences)
- A mirror that is only spot-checked drifts precisely where the check does not look — the demo's command
  surface rotted silently because hook-parity compares only the \`hooks\` block → decision (a command-file
  drift axis is the natural follow-on; carried forward, not built this pass)
- Prose that instructs a reader to transcribe a placeholder is a latent bug when a downstream parser
  discriminates on that placeholder's syntax → none yet
- A doc surface with no engine watching it drifts on exactly the timescale of the work it describes → routine
- Assert the vendored mirror byte-for-byte across every consumer and the demo fixture, not just its hooks block → routine
- Re-verify the claims docs make about the consumer registry — counts, de-migrations, command enumerations — against the registry itself → routine

## Outputs

- **ADR 0017** — [session lifecycle, self-improvement bridge, and a scheduled-routines lane](../decisions/0017-session-lifecycle-self-improvement-bridge-and-a-scheduled-ro.md) (accepted).
- **Feature entity** — [session-lifecycle-and-bridge](../features/session-lifecycle-and-bridge.md) (available · optional · framework).
- **Report** — [commands deep-review](../reports/2026-07-22-commands-deep-review-remediation-and-the-scheduled-routines-.md), findings A1–A8 with evidence.
- **The routines lane**, shipped across five command files, two engines, three configs, and spec §4b.
- **\`examples/soul-steel-demo/.claude/\`** re-vendored — byte-identical to the consumer template for the first time since the 2026-07-21 port.
- Commit \`d04eff1\`; \`README.md\`, \`CLAUDE.md\`, spec §4a/§4b/§7a, and two shipped pipeline records reconciled to reality.

## Blockers

- none

## Next Action

Re-copy \`templates/consumer/.claude/\` into the three registered consumer spaces (Asset-Studio ·
Astrix-Systems · Roblox-Development-Studio) — their command surfaces now trail canonical, and the
drift check cannot see it.

## Handoff Notes

The lane was **dogfooded at close**: this session's own \`/end\` sweep ran the Automation-candidates
bullet it had just shipped and produced the three \`→ routine\` lines above. They are candidates, not
proposals — the next \`/reflect\` (run by hand here; canonical ships no \`/reflect\`) is what turns them
into routine proposals, and it needs a wider window than one session to justify any of them.

Two things a successor should know. **The drift check has a blind spot**: hook-parity compares only
the \`hooks\` block of \`settings.json\`, so command files, \`skills/\`, and \`permissions\` can rot green.
That is what happened to the demo fixture, and it is why \`[CF-2]\` (a command-file axis) exists.
**Governance renumbers**: 0017 is now taken by this merged decision, so the queued runs and facet
ADRs are 0018+.

One unexplained observation, recorded rather than papered over: \`previews/dashboards/*.json\` were
regenerated at 13:52 by something outside the engines this session ran. \`render-hub.mjs --check\` is
verifiably read-only (it exits before \`write()\`), and \`.claude/settings.json\` still wires exactly two
hooks. The emitted content is correct and in sync; the *writer* is unidentified. If it recurs, find
it before trusting an "in sync" result.
`,
};

/** COMPLETED — carries an ad-hoc extra section ("Owner calls…") beyond the canonical scaffold. */
export const asCompletedSession: SessionRecord = {
  id: '2026-07-21-overall-review-of-the-project-space',
  space: 'Asset-Studio',
  markdown: `---
title: "Overall review of the project space"
status: completed
updated: 2026-07-21
tags: { last-active: 2026-07-21T16:30, kos: "decisions, explorer, memory, assets-library, mediums" }
---

# Overall review of the project space

> **Status:** completed (2026-07-21)

## Goal

A whole-of-space health review of Asset-Studio: corpus/validation state, dashboard-contract drift,
uncommitted repo state, and the open production threads (character factory + the five pipelines) —
surfacing what is stale, drifted, or dangling and recommending what to reconcile. Read-only
assessment by default; no production or \`_project/\` mutation beyond this engram unless approved.

## Success Criteria

- Corpus health, contract drift, and uncommitted repo state each assessed with a concrete
  disposition (reconcile now / leave / defer).
- The engram gap (session engrams stop 2026-07-11; the CLAUDE.md status log runs to 2026-07-20)
  named, with a recommendation.
- Open production threads (roguex-33 portrait batch; the two \`build\`-status reference/prop
  pipelines) triaged live-vs-stale.
- A prioritized findings list delivered.

## Source References

- \`CLAUDE.md\` — the status log (authoritative; runs to 2026-07-20)
- \`previews/dashboards/*.json\` — the emitted contracts (drift-flagged this wake)
- \`_project/roadmap/character-factory-lore-medium.md\` — the active initiative
- \`_project/pipeline/*.md\` — the five production instances

## Decisions

- Reconcile approach: regenerate contracts (done — 40 entities/59 edges/0 err), fold in any corpus-agent
  \`_project/\` fixes, rebuild the static bundle once, then a single reconciliation commit. Contracts are
  **inlined at build** (\`contract.ts\`/\`registry.ts\` \`import\` the JSON) → the committed bundle must be
  rebuilt after any contract change or it ships stale.
- The uncommitted backlog is the \`/start\`·\`/reflect\`·\`/end\` command trio + its supporting config
  (\`scaffoldSections\`, \`last-active\`/\`kos\` tag types) + an Explorer \`asset-registry\` refresh + a (stale,
  39-entity) static bundle — all authored but never committed since ≤2026-07-11.

## First-Principles Candidates

- Inline-imported contracts couple every dashboard change to a bundle rebuild → the recurring "stale
  bundle" class; runtime-fetch would dissolve it. → candidate home: decision (the already-flagged open ADR)
- Engram discipline lapsed 2026-07-12→07-20 (≈8 logged work items, 0 session engrams) while the CLAUDE.md
  status log kept going — the status log absorbed what engrams should have carried. → candidate home:
  feedback / memory
- The Roblox upload ledger is library-file-centric (hashes a local file; joins by exact \`Assets/\`-relative
  path) → live game-repo uploads with no library home aren't trackable until adopted into the library; the
  \`register\` subcommand's \`--run-id\` must be unique per call (a prior \`--dry-run\` reserves the folder). →
  candidate home: memory (extends [[roblox-upload-registration]]).

## Outputs

- Drift reconcile: regenerated planning contracts (\`graph.json\` + \`hub.json\` → 40 entities / 60 edges /
  0 err) after the corpus fixes below.
- Corpus deep-dive (background agent) → 7 reconcile-now fixes applied (validate 40/0/0):
  - Fixed **5 broken \`decision/\`→\`decisions/\`** frontmatter links (ADR 0008→0001/0002, 0007→0005,
    sessions 07-03→0008 & 07-11→0002) — were silent dangling edges, not validation errors.
  - Re-pathed \`mediums/3d.md\` to the ADR-0008 zones (\`models/<collection>/<slug>/\` +
    \`runtime/roblox/soul-steel/<cat>/<domain>/\`; added the 0008 link; \`updated\`→2026-07-21).
  - Added an "amended by 0007" banner to ADR 0005 (thumbs now gitignored / 320px, not committed / 144px).
- Reconcile landed: deleted \`background-music-audio\` (hollow scaffold) + \`example-prop-batch\` (disposable
  example); CLAUDE.md surfaced the textured-UI island (ADRs 0010/0011 + \`roblox-textured-ui-ux\` workflow +
  reference-kit pipeline) and corrected the corpus count 39→38; regenerated contracts (38 entities / 58
  edges / 0 err), refreshed the Explorer \`asset-registry\`, rebuilt the static bundle (verified it embeds
  38 entities, drops \`example-prop-batch\`, includes this session); one reconciliation commit on \`main\`.
- Icon adoption + Roblox registration (operator Studio screenshot → ledger): adopted 9 Soul-Steel UI
  icons (5 \`Status_Icon_*\` + 4 \`*_GemSlotIcon\`) from the \`trembus-master-repo-new\` archive into
  \`Assets/ui/icons/\` under asset-conventions \`_FNL\` names (\`status-*\` / \`emblem-*\`, viewed each to name
  by depiction), then registered each to its live Roblox upload via \`roblox_asset_metadata.py register\`
  (evidence from MCP \`asset_get_info\`; \`--allow-name-mismatch\` for the convention rename). Ledger 27→36;
  asset-registry rebuilt → **36/36 exact-path joins, 0 drift/orphans**; 298 thumbs baked; bundle rebuilt.

## Owner calls (surfaced by the deep-dive, awaiting decision)

- \`CLAUDE.md\` status log omits the entire **textured-UI island** (ADRs 0010/0011, the
  \`roblox-textured-ui-ux\` workflow, its reference-kit pipeline, \`example-prop-batch\`,
  \`background-music-audio\`).
- \`workflows/background-music-audio.md\` — unfilled scaffold (placeholder Purpose + template JSON).
- \`pipeline/example-prop-batch.md\` — self-flagged disposable example, pre-0008 paths, unreferenced.
- \`pipeline/roblox-textured-ui-reference-kit.md\` — real but blocked 9 days on a missing Studio symlink
  (interactive \`sudo\` relink; can't run here).
- \`mediums/image.md\` — template registry omits the \`Assets/templates/building-reference/\` zone (defer).

## Blockers

- none for this session. (External + unrelated: the \`roblox-textured-ui-reference-kit\` pilot stays
  blocked on the missing Studio \`content/trembus\` symlink — needs an owner-run interactive \`sudo\` relink.)

## Next Action

Session complete — goal met (review + reconcile committed \`af5544e\`) plus the 9-icon adoption/registration.
Optional future-session follow-ups: run the reference-kit Studio relink (the one blocked pipeline); add the
\`mediums/image\` building-reference registry row; a \`/reflect\` bridge review (the 07-12→20 engram gap). The
07-20 ledger items (9 records' \`inventory_path\` drift; hub-only \`texture-cyber-01\`) remain open.

## Handoff Notes

- Reference-kit relink (quit Studio first): \`Trembus-Technologies/tools/rbx-asset-sync.sh link\`, then
  rerun only the rendered-asset checks + capture the owner-acceptance screenshots.
- Deferred (owner call): \`mediums/image\` § Template registry omits \`Assets/templates/building-reference/\`.
- Standing structural: contracts are **inlined at build** → any \`_project/\` or registry change needs a
  bundle rebuild (\`pnpm --dir apps/command-center build\`) or the committed static site ships stale; the
  open fetch-vs-inline ADR would dissolve this class.
- Character factory: on-track — \`roguex-33-portrait\` batch written, awaiting the operator's Codex trigger.
`,
};

/** SHELVED — pre-lifecycle stub (no tags), status-line annotation, reconstructed-at-close markers. */
export const psShelvedSession: SessionRecord = {
  id: '2026-06-24-extract-and-generalize-project-system-into-its-own-space',
  space: 'Project-System',
  markdown: `---
title: "Extract and generalize project-system into its own space"
status: shelved
updated: 2026-07-21
---

# Extract and generalize project-system into its own space

> **Status:** shelved (2026-07-21) — empty stub; the real retro is the 2026-06-24 report

## Goal

Extract and generalize the project-system framework out of Soul-Steel into its own space.

## Success Criteria

- _(reconstructed at close-out, 2026-07-21)_ — met: the framework lives here as its own git repo and dogfoods its own \`_project/\`.

## Source References

- [reports/2026-06-24-extract-and-generalize-the-framework-from-soul-steel](../reports/2026-06-24-extract-and-generalize-the-framework-from-soul-steel.md) — the authored retro of this work.

## Decisions

- _(reconstructed at close-out, 2026-07-21)_ — captured in the ADR ledger (\`decisions/0001-…\` onward), not here.

## Outputs

- _(reconstructed at close-out, 2026-07-21)_ — the framework repo itself; the real record is the report above. This session file was scaffolded but never authored.

## Blockers

- none

## Next Action

- none — shelved.

## Handoff Notes

_(reconstructed at close-out, 2026-07-21)_ Shelved as an empty stub: the extract-and-generalize work landed and is recorded in the 2026-06-24 report. This file predates the engram lifecycle (no \`last-active\` tag) and was surfaced as a dangling \`active\` session by the first \`/end\` sweep after the lifecycle port shipped — closed for hygiene, not resumed.
`,
};

/** SYNTHETIC — a hand-authored `blocked` sample so the lifecycle range renders completely. */
export const syntheticBlockedSession: SessionRecord = {
  id: '2026-07-24-wire-the-telemetry-heartbeat-into-the-live-dashboard',
  space: 'Roblox-Development-Studio',
  markdown: `---
title: "Wire the telemetry heartbeat into the live dashboard"
status: blocked
updated: 2026-07-24
tags: { last-active: 2026-07-24T11:05, kos: "telemetry, dashboards" }
---

# Wire the telemetry heartbeat into the live dashboard

> **Status:** blocked (2026-07-24)

## Goal

Surface the M2 studio-now heartbeat on the command-center dashboard as a live tile. (Synthetic
sample — illustrates the blocked lifecycle state; not a real record.)

## Success Criteria

- The dashboard tile shows a heartbeat younger than 60s while Studio is open.
- Validate stays at 0 errors.

## Source References

- [[2026-07-19-telemetry-m2-studio-now-heartbeat]] — the heartbeat this consumes.

## Decisions

- **Poll, don't push** — the previews site is static; the tile polls the heartbeat JSON on a 30s timer.

## Outputs

- <artifact produced>

## Blockers

- The heartbeat file lands outside the previews site's static root — the tile 404s until the emitter's output path moves or a copy step exists.
- Studio MCP session expired mid-test; needs a fresh authorization to re-verify.

## Next Action

Move the heartbeat emit path under previews/ (or add the copy step) and re-run the tile against a live Studio session.

## Handoff Notes

<what the next session needs to know>
`,
};

export const SESSION_RECORDS: SessionRecord[] = [
  rdsActiveSession,
  psCompletedSession,
  asCompletedSession,
  psShelvedSession,
  syntheticBlockedSession,
];
