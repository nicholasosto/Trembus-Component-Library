/**
 * `sessionToBrief` — the SESSION work-log template for the Brief component.
 *
 * A deterministic (model-free) mapping from a project-system session entity record
 * — ProjectEntity frontmatter + the canonical 8/9-section scaffold shared by
 * Project-System, Asset-Studio, and Roblox-Development-Studio — onto a
 * `BriefContract`, choosing a purpose-built Brief sub-component per section and
 * lifecycle-aware visual indicators:
 *
 *   Goal                        → the header `summary` (the doc's intro slot)
 *   Success Criteria            → `checklist` — success (met) once completed, info while in flight
 *   Source References           → `reference` — link/path chips; frontmatter `links[]` join with their rel as a status chip
 *   Decisions                   → `decisions` — bold-lead bullets become "lead → resolution"
 *   First-Principles Candidates → `decisions` — the records' own "observation → disposition" arrow grammar
 *   Outputs                     → `artifacts` — artifact + pointer chip
 *   Blockers                    → `checklist` — danger rows; a lone "none" renders as a success all-clear
 *   Next Action                 → `checklist` single spotlight row — warn while the session is live, info once closed
 *   Handoff Notes               → `prose`
 *   (anything else)             → `reference` rows / `prose` — ad-hoc sections degrade, never break
 *
 * Scaffold placeholders (`<artifact produced>` …) render as an italic "not yet
 * recorded" note instead of content, feed the header's `filled n/m sections`
 * progress pill, and are reported in `pending` — so an in-flight session *shows*
 * its in-flightness. Status drives the tone of the status pill and the auto
 * `defaultCollapsed` folding (closed sessions fold their historical middle;
 * live ones stay open).
 */
import type { BriefContract, BriefItem, BriefMeta, BriefSection } from '../../index';

export type SessionStatus = 'planned' | 'active' | 'blocked' | 'completed' | 'shelved';

export interface SessionBriefOptions {
  /** Entity id (the filename stem) — rendered as the doc id. */
  id?: string;
  /** Project space name — a meta pill, so cross-space collections stay attributed. */
  space?: string;
  /** `'auto'` (default): status-aware initial folding. `'none'`: everything open. */
  collapse?: 'auto' | 'none';
}

export interface SessionBrief {
  data: BriefContract & { sections: BriefSection[] };
  /** Pass to `<Brief defaultCollapsed>` — review-mode folding for closed sessions. */
  defaultCollapsed: string[];
  status: SessionStatus | (string & {});
  /** Canonical sections present but still holding scaffold placeholders. */
  pending: string[];
}

// ── lifecycle → tone (token custom properties; the meta pill takes any CSS color) ──
const STATUS_TONE: Record<string, string> = {
  planned: 'var(--tcl-status-neutral)',
  active: 'var(--tcl-accent)',
  blocked: 'var(--tcl-status-danger)',
  completed: 'var(--tcl-status-success)',
  shelved: 'var(--tcl-status-warning)',
};

/** Canonical scaffold headings → stable section ids (also the fold/pending vocabulary). */
const CANONICAL: Record<string, string> = {
  goal: 'goal',
  'success criteria': 'criteria',
  'source references': 'references',
  decisions: 'decisions',
  'first-principles candidates': 'first-principles',
  'first principles candidates': 'first-principles',
  outputs: 'outputs',
  blockers: 'blockers',
  'next action': 'next-action',
  'handoff notes': 'handoff',
};

const IN_FLIGHT = new Set(['planned', 'active', 'blocked']);

// ── inline text helpers ─────────────────────────────────────────────────────────
/** Strip the inline markdown the Brief renders as plain text (links keep their label). */
function clean(s: string): string {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]*)\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_\(([^)]+)\)_/g, '($1)')
    .trim();
}

/** A wholly-unfilled scaffold placeholder: `<artifact produced>`, `<blocker, or "none">`… */
function isPlaceholder(s: string): boolean {
  return /^<[^<>]+>$/.test(s.trim());
}

/** First pointer in the text: a markdown-link target, a `[[wiki-link]]`, or a LEADING
 *  path-ish code span — a span mid-sentence is a mention, not a pointer, and would
 *  otherwise chip noise like the `decision/` in "fixed 5 broken `decision/` links". */
function extractRef(s: string): string | undefined {
  const md = s.match(/\[[^\]]+\]\(([^)]+)\)/);
  if (md) return md[1];
  const wiki = s.match(/\[\[([^\]]+)\]\]/);
  if (wiki) return wiki[1];
  const code = s.match(/^(?:\*\*)?`([^`\s]*[/.][^`\s]*)`/); // has a / or . → path-like
  if (code) return code[1];
  return undefined;
}

/** Split "lead — gloss" when an em-dash separates a short lead from its explanation. */
function dashSplit(s: string): { text: string; desc?: string } {
  const m = s.match(/^(.{2,80}?)\s+[—–]\s+(.+)$/);
  return m ? { text: m[1].trim(), desc: m[2].trim() } : { text: s };
}

/** Split the authored "**lead** (qualifier): rest" decision/output idiom. */
function boldSplit(s: string): { lead: string; rest: string } | null {
  const m = s.match(/^\*\*([^*]+)\*\*\s*(\([^)]*\))?\s*(?:[—–:-]\s*)?(.*)$/);
  if (!m) return null;
  const lead = clean(m[2] ? `${m[1]} ${m[2]}` : m[1]);
  const rest = clean(m[3] ?? '').replace(/^[,;]\s*/, '');
  return { lead, rest };
}

// ── record parsing ──────────────────────────────────────────────────────────────
interface RawSection {
  heading: string;
  lead: string[]; // prose paragraphs before any bullet (blank-line separated)
  items: string[]; // bullet texts, wrapped continuations joined
}

interface ParsedRecord {
  title?: string;
  status: string;
  updated?: string;
  lastActive?: string;
  kos: string[];
  links: { rel: string; target: string }[];
  statusNote?: string;
  sections: RawSection[];
}

function parseRecord(markdown: string): ParsedRecord {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const rec: ParsedRecord = { status: 'planned', kos: [], links: [], sections: [] };
  let i = 0;

  if (lines[0]?.trim() === '---') {
    let inLinks = false;
    for (i = 1; i < lines.length && lines[i].trim() !== '---'; i++) {
      const line = lines[i];
      const link = line.match(/^\s*-\s*\{\s*rel:\s*([\w-]+)\s*,\s*target:\s*([^}]+?)\s*\}/);
      if (inLinks && link) {
        rec.links.push({ rel: link[1], target: link[2].trim() });
        continue;
      }
      inLinks = false;
      const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
      if (!kv) continue;
      const [, key, value] = kv;
      if (key === 'title') rec.title = value.replace(/^"|"$/g, '').trim();
      else if (key === 'status') rec.status = value.trim();
      else if (key === 'updated') rec.updated = value.trim();
      else if (key === 'links') inLinks = true;
      else if (key === 'tags') {
        const la = value.match(/last-active:\s*([\d:T-]+)/);
        if (la) rec.lastActive = la[1];
        const kos = value.match(/kos:\s*"([^"]*)"/);
        if (kos)
          rec.kos = kos[1]
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean);
      }
    }
    i++;
  }

  let current: RawSection | null = null;
  let para: string[] = [];
  const flushPara = () => {
    if (current && para.length) current.lead.push(para.join(' '));
    para = [];
  };

  for (; i < lines.length; i++) {
    const line = lines[i];
    if (/^#\s+/.test(line)) continue; // H1 duplicates the frontmatter title
    const statusLine = line.match(
      /^>\s*\*\*Status:\*\*\s*\w+\s*(?:\([^)]*\))?\s*(?:[—–-]\s*(.+))?$/,
    );
    if (statusLine) {
      if (statusLine[1]) rec.statusNote = clean(statusLine[1]);
      continue; // duplicates frontmatter status; only the annotation is new information
    }
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      flushPara();
      current = { heading: clean(h2[1]), lead: [], items: [] };
      rec.sections.push(current);
      continue;
    }
    if (!current) continue;
    const bullet = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      flushPara();
      current.items.push(bullet[1]);
    } else if (line.trim() === '') {
      flushPara();
    } else if (current.items.length) {
      current.items[current.items.length - 1] += ' ' + line.trim(); // wrapped continuation
    } else {
      para.push(line.trim());
    }
  }
  flushPara();
  return rec;
}

// ── per-section builders ────────────────────────────────────────────────────────
/** Live items after dropping scaffold placeholders; `pending` = nothing real survived.
 *  Lead prose is only ever DISPLAYED (note/body/summary), so it comes back cleaned;
 *  items keep their raw markdown for the ref/bold/arrow extractors. */
function liveItems(raw: RawSection): { items: string[]; lead: string[]; pending: boolean } {
  const items = raw.items.filter((t) => !isPlaceholder(t));
  const lead = raw.lead.filter((t) => !isPlaceholder(t)).map(clean);
  return { items, lead, pending: items.length === 0 && lead.length === 0 };
}

const PENDING_NOTE = 'Not yet recorded — session in flight.';

function pendingSection(id: string, heading: string, kind: BriefSection['kind']): BriefSection {
  return { id, heading, kind, note: PENDING_NOTE, items: [] };
}

function criteriaSection(
  raw: RawSection,
  status: string,
  pend: (id: string) => void,
): BriefSection {
  const { items, pending } = liveItems(raw);
  if (pending) {
    pend('criteria');
    return pendingSection('criteria', raw.heading, 'checklist');
  }
  const severity = status === 'completed' ? 'success' : 'info';
  return {
    id: 'criteria',
    heading: raw.heading,
    kind: 'checklist',
    items: items.map((t) => ({ text: clean(t), severity })),
  };
}

function referencesSection(
  raw: RawSection,
  links: ParsedRecord['links'],
  pend: (id: string) => void,
): BriefSection {
  const { items, lead, pending } = liveItems(raw);
  const fromBody: BriefItem[] = items.map((t) => {
    const ref = extractRef(t);
    const { text, desc } = dashSplit(clean(t));
    return { text, ...(desc ? { desc } : {}), ...(ref ? { ref } : {}) };
  });
  // Typed frontmatter edges join the same section, their rel as the trailing chip.
  const fromLinks: BriefItem[] = links.map((l) => ({
    text: l.target.split('/').pop() ?? l.target,
    ref: l.target,
    status: l.rel,
  }));
  if (pending && fromLinks.length === 0) {
    pend('references');
    return pendingSection('references', raw.heading, 'reference');
  }
  const sec: BriefSection = {
    id: 'references',
    heading: raw.heading,
    kind: 'reference',
    items: [...fromBody, ...fromLinks],
  };
  if (lead.length) sec.note = lead.join(' ');
  return sec;
}

/** Bold-lead bullets → "lead → resolution"; the FP variant splits on the records' own last "→". */
function decisionsSection(
  raw: RawSection,
  id: 'decisions' | 'first-principles',
  pend: (id: string) => void,
): BriefSection {
  const { items, lead, pending } = liveItems(raw);
  if (pending) {
    pend(id);
    return pendingSection(id, raw.heading, 'decisions');
  }
  const mapped: BriefItem[] = items.map((t) => {
    if (id === 'first-principles') {
      const arrow = t.lastIndexOf(' → ');
      if (arrow > 0) {
        const disposition = clean(t.slice(arrow + 3)).replace(/^candidate home:\s*/i, '');
        return { text: clean(t.slice(0, arrow)), choice: disposition };
      }
      return { text: clean(t) };
    }
    const bold = boldSplit(t);
    if (bold && bold.rest) return { text: bold.lead, choice: bold.rest };
    return { text: clean(t) };
  });
  const sec: BriefSection = { id, heading: raw.heading, kind: 'decisions', items: mapped };
  if (lead.length) sec.note = lead.join(' ');
  return sec;
}

function outputsSection(raw: RawSection, pend: (id: string) => void): BriefSection {
  const { items, lead, pending } = liveItems(raw);
  if (pending) {
    pend('outputs');
    return pendingSection('outputs', raw.heading, 'artifacts');
  }
  const mapped: BriefItem[] = items.map((t) => {
    const ref = extractRef(t);
    const bold = boldSplit(t);
    const base = bold
      ? { text: bold.lead, ...(bold.rest ? { desc: bold.rest } : {}) }
      : dashSplit(clean(t));
    return { ...base, ...(ref ? { ref } : {}) };
  });
  const sec: BriefSection = {
    id: 'outputs',
    heading: raw.heading,
    kind: 'artifacts',
    items: mapped,
  };
  if (lead.length) sec.note = lead.join(' ');
  return sec;
}

function blockersSection(raw: RawSection, pend: (id: string) => void): BriefSection {
  const { items, lead, pending } = liveItems(raw);
  if (pending) {
    pend('blockers');
    return pendingSection('blockers', raw.heading, 'checklist');
  }
  const texts = items.length ? items : lead;
  const allClear = texts.length === 1 && /^none\b/i.test(clean(texts[0]));
  return {
    id: 'blockers',
    heading: raw.heading,
    kind: 'checklist',
    items: texts.map((t) => ({ text: clean(t), severity: allClear ? 'success' : 'danger' })),
  };
}

function nextActionSection(
  raw: RawSection,
  status: string,
  pend: (id: string) => void,
): BriefSection {
  const { items, lead, pending } = liveItems(raw);
  if (pending) {
    pend('next-action');
    return pendingSection('next-action', raw.heading, 'checklist');
  }
  const texts = items.length ? items : [lead.join(' ')];
  const severity = IN_FLIGHT.has(status) ? 'warn' : 'info';
  return {
    id: 'next-action',
    heading: raw.heading,
    kind: 'checklist',
    items: texts.map((t) => ({ text: clean(t), severity })),
  };
}

function handoffSection(raw: RawSection, pend: (id: string) => void): BriefSection {
  const { items, lead, pending } = liveItems(raw);
  if (pending) {
    pend('handoff');
    return pendingSection('handoff', raw.heading, 'prose');
  }
  const paras = [...lead, ...items.map(clean)];
  return { id: 'handoff', heading: raw.heading, kind: 'prose', body: paras.join('\n\n') };
}

/** Ad-hoc sections beyond the scaffold: reference rows when listy, prose otherwise. */
function extraSection(raw: RawSection, index: number): BriefSection {
  const { items, lead } = liveItems(raw);
  const id = `extra-${index}`;
  if (items.length === 0) {
    return { id, heading: raw.heading, kind: 'prose', body: lead.join('\n\n') };
  }
  const sec: BriefSection = {
    id,
    heading: raw.heading,
    kind: 'reference',
    items: items.map((t) => {
      const ref = extractRef(t);
      const { text, desc } = dashSplit(clean(t));
      return { text, ...(desc ? { desc } : {}), ...(ref ? { ref } : {}) };
    }),
  };
  if (lead.length) sec.note = lead.join(' ');
  return sec;
}

// ── the template ────────────────────────────────────────────────────────────────
export function sessionToBrief(markdown: string, opts: SessionBriefOptions = {}): SessionBrief {
  const rec = parseRecord(markdown);
  const status = rec.status;
  const pending: string[] = [];
  const pend = (id: string) => pending.push(id);

  let summary: string | undefined;
  const sections: BriefSection[] = [];
  let present = 0;
  let extras = 0;

  for (const raw of rec.sections) {
    const canonical = CANONICAL[raw.heading.toLowerCase()];
    if (canonical) present++;
    switch (canonical) {
      case 'goal': {
        const { lead, items, pending: goalPending } = liveItems(raw);
        if (goalPending) pend('goal');
        else summary = [...lead, ...items.map(clean)].join(' ');
        break; // the goal IS the header summary — no section
      }
      case 'criteria':
        sections.push(criteriaSection(raw, status, pend));
        break;
      case 'references':
        sections.push(referencesSection(raw, rec.links, pend));
        break;
      case 'decisions':
        sections.push(decisionsSection(raw, 'decisions', pend));
        break;
      case 'first-principles':
        sections.push(decisionsSection(raw, 'first-principles', pend));
        break;
      case 'outputs':
        sections.push(outputsSection(raw, pend));
        break;
      case 'blockers':
        sections.push(blockersSection(raw, pend));
        break;
      case 'next-action':
        sections.push(nextActionSection(raw, status, pend));
        break;
      case 'handoff':
        sections.push(handoffSection(raw, pend));
        break;
      default:
        sections.push(extraSection(raw, extras++));
    }
  }

  const meta: BriefMeta[] = [
    {
      label: 'status',
      value: status,
      ...(STATUS_TONE[status] ? { tone: STATUS_TONE[status] } : {}),
    },
  ];
  if (rec.updated) meta.push({ label: 'updated', value: rec.updated });
  if (rec.lastActive) meta.push({ label: 'last active', value: rec.lastActive.replace('T', ' ') });
  if (opts.space) meta.push({ label: 'space', value: opts.space });
  if (pending.length > 0)
    meta.push({ label: 'filled', value: `${present - pending.length}/${present} sections` });
  if (rec.kos.length) meta.push({ label: 'kos', value: rec.kos.join(' · ') });
  if (rec.statusNote) meta.push({ label: 'note', value: rec.statusNote });

  const defaultCollapsed =
    opts.collapse === 'none'
      ? []
      : IN_FLIGHT.has(status)
        ? ['references']
        : ['references', 'decisions', 'first-principles'];
  const sectionIds = new Set(sections.map((s) => s.id));

  return {
    data: {
      view: 'brief',
      kind: 'session',
      ...(opts.id ? { id: opts.id } : {}),
      ...(rec.title ? { title: rec.title } : {}),
      ...(summary ? { summary } : {}),
      meta,
      sections,
    },
    defaultCollapsed: defaultCollapsed.filter((id) => sectionIds.has(id)),
    status,
    pending,
  };
}
