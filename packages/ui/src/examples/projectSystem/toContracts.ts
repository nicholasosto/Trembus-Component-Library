/**
 * The bridge the schema's §6 anticipates: one `ProjectEntity[]` → the Visual-Grammar
 * contracts that `@trembus` components already consume. Pure + deterministic; every
 * node, edge, and tally derives from the entities — nothing is authored twice.
 *
 *   toHubContract       → Hub      (rollup of all five kinds — schema §6 "rollup")
 *   toLineageContract   → Lineage  (the links[] governance graph — schema §5/§6)
 *   toSwimlaneContract  → Swimlane (sessions laned by their `agent` tag — schema §6)
 *
 * All cross-package imports here are TYPE-ONLY (erased under verbatimModuleSyntax), so
 * this adapter has no runtime dependency on either library — only the story renders the
 * components.
 */
import type { EntityKind, ProjectEntity } from './projectEntity';
import type { HubContract, HubDomain, HubDomainKind } from '../../index';
import type { SwimlaneContract, SwimlaneLaneKind, SwimlaneStatus } from '../../index';
// Tier-2 Lineage lives in @trembus/viz; ui doesn't depend on it, so this demo (which
// spans both packages, like a real consumer would) reaches its public types by source path.
import type { GraphContract, GraphEdge, GraphNode, LineageTone } from '../../../../viz/src/index';

// ── small text helpers ────────────────────────────────────────────────────────
const cap = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);
const compact = (t: string, n: number): string =>
  t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
/** Drop a leading "0001 — " / "M3 — " / "Steel City — " title prefix. */
const stripLead = (t: string): string =>
  t.replace(/^(\d{3,4}|M\d|Steel City)\s*[—–-]\s*/i, '').trim();

const tally = (statuses: string[]): string => {
  const counts = new Map<string, number>();
  for (const s of statuses) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([s, n]) => `${n} ${s}`)
    .join(' · ');
};

/** Lifecycle word → the shared tone ontology (works across all five kinds' enums). */
function statusTone(status: string): LineageTone {
  const s = status.toLowerCase();
  if (['accepted', 'complete', 'completed', 'ship'].includes(s)) return 'success';
  if (['active', 'build'].includes(s)) return 'accent';
  if (['draft', 'qualify', 'proposed', 'design'].includes(s)) return 'info';
  if (['deferred', 'blocked'].includes(s)) return 'warning';
  if (['rejected', 'superseded'].includes(s)) return 'danger';
  return 'neutral'; // planned · shelved · archive · unknown
}

const INFLIGHT = new Set(['active', 'build', 'qualify', 'draft']);

// ── Hub: the rollup of all five kinds ───────────────────────────────────────────
const HUB_META: Record<EntityKind, { name: string; sub: string; dk: HubDomainKind }> = {
  decision: { name: 'Decisions', sub: 'ADRs · governance', dk: 'shipped' },
  pipeline: { name: 'Pipeline', sub: 'milestone build plans', dk: 'current' },
  session: { name: 'Sessions', sub: 'work logs', dk: 'current' },
  report: { name: 'Reports', sub: 'milestone retros', dk: 'shipped' },
  roadmap: { name: 'Roadmap', sub: 'horizons', dk: 'planned' },
};

export function toHubContract(entities: ProjectEntity[]): HubContract {
  const domains: HubDomain[] = [
    {
      id: 'project',
      pos: 'center',
      kind: 'center',
      tag: '_project/',
      name: 'Soul Steel',
      sub: 'planning graph',
      status: `${entities.length} entities`,
      note: 'Five planning-artifact kinds, one ProjectEntity contract: Identity · State · Relation.',
    },
  ];
  for (const kind of Object.keys(HUB_META) as EntityKind[]) {
    const items = entities.filter((e) => e.kind === kind);
    const breakdown = tally(items.map((e) => e.status));
    const meta = HUB_META[kind];
    domains.push({
      id: kind,
      kind: meta.dk,
      tag: String(items.length),
      name: meta.name,
      sub: meta.sub,
      status: breakdown,
      note: `${items.length} ${kind} ${items.length === 1 ? 'entity' : 'entities'} — ${breakdown}`,
    });
  }
  const inflight = entities.filter((e) => INFLIGHT.has(e.status.toLowerCase())).length;
  return {
    view: 'hub',
    brand: 'Soul Steel',
    tagline: '_project/ system',
    sub: 'planning graph · derived live from the canonical ProjectEntity contract',
    stats: [
      { label: 'Entities', value: entities.length },
      { label: 'In flight', value: inflight },
      { label: 'Milestones', value: 5 },
    ],
    domains,
  };
}

// ── Lineage: the links[] graph (auto-scopes to the connected governance spine) ───
const FOLDER_KIND: Record<string, EntityKind> = {
  decisions: 'decision',
  sessions: 'session',
  reports: 'report',
  pipeline: 'pipeline',
  roadmap: 'roadmap',
};

/** Collision-proof node id (the viz Tier-2 discipline): namespace by kind so two
 *  entities that share a filename stem across folders can never collide. */
const nodeId = (e: Pick<ProjectEntity, 'kind' | 'id'>): string => `${e.kind}/${e.id}`;

function nodeLabel(e: ProjectEntity): string {
  if (e.kind === 'decision') return `${e.id.slice(0, 4)} · ${compact(stripLead(e.title), 20)}`;
  const milestone = e.id.match(/^m(\d)/i);
  const prefix = milestone ? `M${milestone[1]} ` : '';
  return prefix + compact(stripLead(e.title), 22);
}

export function toLineageContract(entities: ProjectEntity[]): GraphContract {
  const resolve = (target: string): ProjectEntity | undefined => {
    const slash = target.indexOf('/');
    if (slash < 0) return undefined; // milestone marker / external ref — not a node
    const kind = FOLDER_KIND[target.slice(0, slash)];
    const stem = target.slice(slash + 1);
    return kind ? entities.find((e) => e.kind === kind && e.id === stem) : undefined;
  };

  const edges: GraphEdge[] = [];
  const used = new Set<string>();
  for (const e of entities) {
    for (const link of e.links ?? []) {
      const t = resolve(link.target);
      if (!t) continue; // drop dangling / external targets gracefully (the validator flags them)
      const self = nodeId(e);
      const other = nodeId(t);
      let edge: GraphEdge | undefined;
      switch (link.rel) {
        case 'predecessor': // T precedes E → forward delivery edge T → E
          edge = { from: other, to: self, label: 'then' };
          break;
        case 'successor':
          edge = { from: self, to: other, label: 'then' };
          break;
        case 'decided-in': // the governing decision enables the work
          edge = { from: other, to: self, label: 'decided-in', dashed: true };
          break;
        case 'references':
          edge =
            t.kind === 'decision'
              ? { from: other, to: self, label: 'references', dashed: true }
              : { from: self, to: other, label: 'references', dashed: true };
          break;
        case 'supersedes':
          edge = { from: self, to: other, label: 'supersedes', tone: 'danger' };
          break;
        case 'superseded-by':
          edge = { from: other, to: self, label: 'superseded-by', tone: 'danger' };
          break;
        default:
          edge = undefined; // milestone / implements → external, no node edge
      }
      if (!edge) continue;
      edges.push(edge);
      used.add(edge.from);
      used.add(edge.to);
    }
  }

  const nodes: GraphNode[] = entities
    .filter((e) => used.has(nodeId(e)))
    .map((e) => ({
      id: nodeId(e),
      label: nodeLabel(e),
      kind: e.kind,
      tone: statusTone(e.status),
      sub: cap(e.status),
      note: `${cap(e.kind)} — ${e.title}`,
    }));

  return {
    view: 'lineage',
    title: 'Decision → Milestone Governance',
    caption:
      'ADRs feed the M3 → M4 → M5 → inventory delivery spine — every edge is a real _project/ link',
    direction: 'TB',
    nodes,
    edges,
  };
}

// ── Swimlane: sessions laned by their `agent` tag ────────────────────────────────
const AGENT_KIND: Record<string, SwimlaneLaneKind> = {
  human: 'human',
  claude: 'ai',
  codex: 'ai',
  neutral: 'neutral',
};
const SESSION_STATUS: Record<string, SwimlaneStatus> = {
  completed: 'done',
  active: 'active',
  planned: 'pending',
  blocked: 'blocked',
  shelved: 'skipped',
};
const MS_RANK: Record<string, number> = { M5: 0, 'post-M5': 1, future: 2 };

export function toSwimlaneContract(entities: ProjectEntity[]): SwimlaneContract {
  const sessions = entities.filter((e) => e.kind === 'session');
  const agents = [...new Set(sessions.map((s) => String(s.tags?.agent ?? 'neutral')))];
  const lanes = agents.map((a) => ({
    id: a,
    label: cap(a),
    kind: AGENT_KIND[a] ?? 'neutral',
  }));
  const sorted = sessions
    .slice()
    .sort(
      (a, b) =>
        (MS_RANK[String(a.tags?.milestone)] ?? 9) - (MS_RANK[String(b.tags?.milestone)] ?? 9) ||
        a.updated.localeCompare(b.updated),
    );
  // Per-lane column so every lane starts flush-left (a global counter would push the
  // codex lane off to the right). Sessions are independent work items, not a handoff
  // chain, so `to: []` suppresses the default sequential connector.
  const laneCol = new Map<string, number>();
  const steps = sorted.map((s) => {
    const lane = String(s.tags?.agent ?? 'neutral');
    const col = laneCol.get(lane) ?? 0;
    laneCol.set(lane, col + 1);
    return {
      id: s.id,
      lane,
      col,
      label: compact(s.title, 22),
      status: SESSION_STATUS[s.status] ?? 'pending',
      detail: String(s.tags?.milestone ?? ''),
      note: `${s.title} — scope: ${s.tags?.scope ?? 'n/a'} (${s.status})`,
      to: [],
    };
  });
  return {
    view: 'swimlane',
    title: 'Sessions by agent',
    caption: 'neutral planning vs codex execution, ordered M5 → post-M5 → future',
    lanes,
    steps,
  };
}
