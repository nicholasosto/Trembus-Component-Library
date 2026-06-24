/**
 * A real snapshot of the Soul-Steel `_project/` planning graph, captured 2026-06-24 via
 * the project's own parser (`tools/lib/md.mjs`) so derivation can't drift.
 *
 * Provenance of each field:
 *   • `status` — frontmatter (sessions, which already conform) · the prose `**Status:**`
 *     header (decisions, pipeline) · inferred from milestone reality where the prose
 *     carried none, marked `ⓘ` (most reports + roadmaps — they await Phase B migration).
 *   • `links` — the cross-references that today live as prose ("Predecessor: m4-…",
 *     "resolved via 0001", "decRefs"), hand-lifted into the typed `links[]` they will
 *     carry post-Phase-B. This fixture is therefore a *Phase-B-complete projection* of
 *     today's real graph — the state the validator's migration produces.
 *   • `0004`'s status is the real off-enum word "deferred" (the decision enum is
 *     proposed·accepted·superseded·rejected) — kept verbatim to show the adapter degrade
 *     gracefully on exactly the drift the validator would flag.
 */
import type { ProjectEntity } from './projectEntity';

export const PROJECT_ENTITIES: ProjectEntity[] = [
  // ── decisions (ADRs) ──────────────────────────────────────────────────────────
  {
    kind: 'decision',
    id: '0001-m3-open-questions',
    title: '0001 — M3 Open Questions Resolution',
    status: 'accepted',
    updated: '2026-05-06',
    tags: { scope: 'steel-city' },
  },
  {
    kind: 'decision',
    id: '0002-ui-mockup-pipeline-reform',
    title: '0002 — UI Mockup Pipeline Reform: Studio MCP supersedes HTML',
    status: 'accepted',
    updated: '2026-05-13',
    tags: { scope: 'tooling' },
  },
  {
    kind: 'decision',
    id: '0003-input-contexts-by-zone-and-state',
    title: '0003 — Input contexts split by zone and match state',
    status: 'accepted',
    updated: '2026-05-24',
    tags: { scope: 'steel-city' },
  },
  {
    kind: 'decision',
    id: '0004-multi-currency-deferred',
    title: '0004 — Multi-currency (Scrip / Ether / Soul Cinders) — deferred',
    status: 'deferred', // real off-enum word (proposed amendment 2026-06-20 awaiting ratification)
    updated: '2026-06-20',
    links: [{ rel: 'references', target: 'decisions/0003-input-contexts-by-zone-and-state' }],
    tags: { scope: 'ip-wide' },
  },
  {
    kind: 'decision',
    id: '0005-slotable-items-open-taxonomy',
    title: '0005 — Open the slotable-items slot taxonomy (Category Registry)',
    status: 'accepted',
    updated: '2026-06-20',
    tags: { scope: 'ip-wide' },
  },

  // ── sessions (frontmatter already conforms) ─────────────────────────────────────
  {
    kind: 'session',
    id: '2026-05-16-decay-domain-vision-boarding',
    title: 'Decay-Domain Vision Boarding',
    status: 'shelved',
    updated: '2026-05-16',
    tags: { agent: 'neutral', milestone: 'future', scope: 'soul-steel', priority: 'low' },
  },
  {
    kind: 'session',
    id: '2026-05-16-m5-closeout-command-state',
    title: 'M5 Closeout Command State',
    status: 'active',
    updated: '2026-05-16',
    tags: { agent: 'neutral', milestone: 'M5', scope: 'steel-city', priority: 'high' },
  },
  {
    kind: 'session',
    id: '2026-05-16-m5-h-marketplace-placeholders',
    title: 'M5-H Marketplace Placeholders',
    status: 'planned',
    updated: '2026-05-16',
    tags: { agent: 'neutral', milestone: 'M5', scope: 'steel-city', priority: 'high' },
  },
  {
    kind: 'session',
    id: '2026-05-16-m5-i-closed-playtest',
    title: 'M5-I Closed Playtest',
    status: 'planned',
    updated: '2026-05-16',
    tags: { agent: 'neutral', milestone: 'M5', scope: 'steel-city', priority: 'high' },
  },
  {
    kind: 'session',
    id: '2026-05-16-m5-j-soft-launch',
    title: 'M5-J Soft Launch',
    status: 'planned',
    updated: '2026-05-16',
    tags: { agent: 'neutral', milestone: 'M5', scope: 'steel-city', priority: 'high' },
  },
  {
    kind: 'session',
    id: '2026-05-16-post-slice-retro-brain-capture',
    title: 'Post-Slice Retro and Brain Capture',
    status: 'planned',
    updated: '2026-05-16',
    tags: { agent: 'neutral', milestone: 'post-M5', scope: 'steel-city', priority: 'medium' },
  },
  {
    kind: 'session',
    id: '2026-05-20-robot-r15-rig-builder-mesh-generation',
    title: 'Robot R15 Rig Builder Mesh Generation',
    status: 'active',
    updated: '2026-05-20',
    tags: { agent: 'codex', milestone: 'future', scope: 'assets', priority: 'medium' },
  },
  {
    kind: 'session',
    id: '2026-05-26-studio-first-tgl-functional-component-flow',
    title: 'Studio-First TGL Functional Component Flow',
    status: 'active',
    updated: '2026-05-26',
    tags: { agent: 'codex', milestone: 'post-M5', scope: 'tgl-library', priority: 'medium' },
  },
  {
    kind: 'session',
    id: '2026-05-30-space-station-battle-room-prototypes',
    title: 'Space Station Battle Room Prototypes',
    status: 'active',
    updated: '2026-05-30',
    tags: { agent: 'codex', milestone: 'post-M5', scope: 'steel-city', priority: 'medium' },
  },

  // ── reports (status ⓘ inferred from milestone reality, pending Phase B) ──────────
  {
    kind: 'report',
    id: '2026-04-30-pre-m1-prep',
    title: 'Pre-M1 Prep — Session Retro',
    status: 'complete', // ⓘ
    updated: '2026-04-30',
    tags: { scope: 'steel-city' },
  },
  {
    kind: 'report',
    id: '2026-05-03-steel-city-m1-pivot-bug-fixes',
    title: 'M1 — Pivot + bug-fix sprint',
    status: 'complete', // ⓘ
    updated: '2026-05-03',
    tags: { scope: 'steel-city' },
  },
  {
    kind: 'report',
    id: '2026-05-04-steel-city-m2-content',
    title: 'M2 — Content',
    status: 'complete', // ⓘ
    updated: '2026-05-04',
    tags: { scope: 'steel-city' },
  },
  {
    kind: 'report',
    id: '2026-05-17-steel-city-m5-h-marketplace-placeholders',
    title: 'Steel City — M5-H Marketplace Placeholders',
    status: 'draft', // real prose "⬜ in progress (kickoff 2026-05-17)"
    updated: '2026-05-17',
    tags: { scope: 'steel-city' },
  },
  {
    kind: 'report',
    id: '2026-05-29-asset-hygiene-sweep',
    title: 'Asset Hygiene Sweep',
    status: 'complete', // ⓘ
    updated: '2026-05-29',
    tags: { scope: 'assets' },
  },
  {
    kind: 'report',
    id: '2026-06-10-meta-review-project-space-session-topology',
    title: 'Meta Review — Project Space + Session Topology',
    status: 'complete', // ⓘ
    updated: '2026-06-10',
    tags: { scope: 'tooling' },
  },

  // ── pipeline (the milestone delivery chain; status + edges from prose) ───────────
  {
    kind: 'pipeline',
    id: 'effects-juice-pass',
    title: 'Steel City — Effects Juice Pass (Plan)',
    status: 'design', // real prose "planned (not started)"
    updated: '2026-05-29',
    tags: { scope: 'steel-city' },
  },
  {
    kind: 'pipeline',
    id: 'inventory-acquisition-wiring',
    title: 'Steel City — Inventory & Tower Acquisition Wiring (build plan)',
    status: 'build', // real prose "scoped; Phase 0 built + verified; Phases 1–3 not started"
    updated: '2026-06-15',
    links: [
      { rel: 'predecessor', target: 'pipeline/m5-ui-ship-prep' },
      { rel: 'references', target: 'decisions/0004-multi-currency-deferred' },
      { rel: 'references', target: 'decisions/0005-slotable-items-open-taxonomy' },
    ],
    tags: { scope: 'steel-city' },
  },
  {
    kind: 'pipeline',
    id: 'm3-coop-polish',
    title: 'M3 — Co-op + Polish (Design + Implementation Plan)',
    status: 'ship', // real prose "complete (gate passed 2026-05-05)"
    updated: '2026-05-05',
    links: [{ rel: 'decided-in', target: 'decisions/0001-m3-open-questions' }],
    tags: { scope: 'steel-city' },
  },
  {
    kind: 'pipeline',
    id: 'm4-tgl-imports-map-dressing',
    title: 'M4 — TGL Imports + Map Dressing (Design + Implementation Plan)',
    status: 'build', // real prose "🟦 in progress (kickoff 2026-05-06)"
    updated: '2026-05-06',
    links: [
      { rel: 'predecessor', target: 'pipeline/m3-coop-polish' },
      { rel: 'references', target: 'decisions/0001-m3-open-questions' },
    ],
    tags: { scope: 'steel-city' },
  },
  {
    kind: 'pipeline',
    id: 'm5-ui-ship-prep',
    title: 'M5 — UI + Ship-Prep (Design + Implementation Plan)',
    status: 'ship', // real prose "complete 2026-05-23"
    updated: '2026-05-23',
    links: [
      { rel: 'predecessor', target: 'pipeline/m4-tgl-imports-map-dressing' },
      { rel: 'decided-in', target: 'decisions/0002-ui-mockup-pipeline-reform' },
    ],
    tags: { scope: 'steel-city' },
  },
  {
    kind: 'pipeline',
    id: 'tier1-towers-corrosion-disruptor',
    title: 'Steel City — Tier 1 Towers: Corrosion Sprayer + Disruptor Coil',
    status: 'ship', // real prose "built + compile-verified + playtest-verified 2026-05-30"
    updated: '2026-05-30',
    tags: { scope: 'steel-city' },
  },

  // ── roadmap (the matryoshka "inner doll" horizons; status ⓘ inferred) ────────────
  {
    kind: 'roadmap',
    id: 'inner-doll-1-asset-pipelines',
    title: 'Inner Doll 1 — Asset Pipelines & Workflows',
    status: 'active', // ⓘ
    updated: '2026-05-01',
    tags: { horizon: 'phase', scope: 'ip-wide' },
  },
  {
    kind: 'roadmap',
    id: 'inner-doll-2-steel-city-execution',
    title: 'Inner Doll 2 — Steel City Execution',
    status: 'active', // ⓘ
    updated: '2026-05-01',
    tags: { horizon: 'phase', scope: 'steel-city' },
  },
  {
    kind: 'roadmap',
    id: 'topology-refresh-plan',
    title: 'Topology Refresh — Target State + Execution Plan',
    status: 'proposed', // ⓘ
    updated: '2026-06-10',
    tags: { horizon: 'cross-domain', scope: 'tooling' },
  },
];
