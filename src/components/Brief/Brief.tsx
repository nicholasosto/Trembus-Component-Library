import { useId, useState } from 'react';
import { cx } from '../../utils/cx';
import './Brief.css';

/**
 * `Brief` — renders an agent-instruction or planning document (CLAUDE.md,
 * AGENTS.md, a plan, a spec) as a structured, navigable visual.
 *
 * It consumes a Trembus Visual Grammar **brief contract** (`view: 'brief'`),
 * designed as a near-isomorphism of the source markdown's own outline: a titled
 * doc + meta pills + an ordered list of `kind`-tagged sections. That shape lets
 * an LLM "generator" transcribe a doc into the contract almost mechanically.
 *
 * The contract is deliberately permissive so a partial or slightly-off
 * generation still renders: every field but item `text` is optional, list items
 * accept a bare string OR an object, and an unknown section `kind` degrades to
 * prose. Lenient parse, strict render.
 */
export type BriefKind = 'claude' | 'agents' | 'plan' | 'spec' | (string & {});

export type SectionKind =
  | 'prose'
  | 'rules'
  | 'commands'
  | 'checklist'
  | 'phases'
  | 'artifacts'
  | 'boundaries'
  | 'decisions'
  | 'reference';

export type Severity = 'info' | 'warn' | 'danger' | (string & {});

/** A list item — a bare string is the common case; the object adds optional facets. */
export type BriefItem =
  | string
  | {
      text: string;
      /** Secondary text: a command's gloss, an artifact's purpose, a rule's rationale. */
      desc?: string;
      /** Free-text status, shown as a trailing chip. */
      status?: string;
      /** Checklist emphasis. */
      severity?: Severity;
      /** A pointer (path or url) — a mono chip, or a link when it's an http(s) url. */
      ref?: string;
      /** Decisions: the chosen option for this `text` (the question/title). */
      choice?: string;
    };

export interface BriefSection {
  id?: string;
  /** Section heading (the markdown `##`). Falls back to the kind label if omitted. */
  heading?: string;
  /** How to render the items. Unknown/omitted → 'prose'. */
  kind?: SectionKind;
  /** Lead-in prose shown under the heading, before items. */
  note?: string;
  /** Prose body (alternative to items for `kind: 'prose'`). */
  body?: string;
  items?: BriefItem[];
}

export interface BriefMeta {
  label: string;
  value: string | number;
  /** Pill accent (hex). */
  tone?: string;
}

export interface BriefContract {
  view?: 'brief';
  /** Doc archetype — drives the header glyph + accent. */
  kind?: BriefKind;
  /** Gold mono code-title, e.g. 'claude.trembus-ui'. */
  id?: string;
  /** Human title (the `#` H1). Falls back to `id`. */
  title?: string;
  /** The intro paragraph. */
  summary?: string;
  /** Header pills (status / updated / owner / version). */
  meta?: BriefMeta[];
  sections?: BriefSection[];
}

export interface BriefProps {
  data: BriefContract;
  /** Section ids collapsed initially (everything expanded otherwise). */
  defaultCollapsed?: string[];
  className?: string;
}

const KIND_LABEL: Record<string, string> = {
  claude: 'Claude',
  agents: 'Agents',
  plan: 'Plan',
  spec: 'Spec',
};

const SECTION_LABEL: Record<string, string> = {
  prose: 'Notes',
  rules: 'Rules',
  commands: 'Commands',
  checklist: 'Checklist',
  phases: 'Phases',
  artifacts: 'Artifacts',
  boundaries: 'Boundaries',
  decisions: 'Decisions',
  reference: 'Reference',
};

type ItemObject = Exclude<BriefItem, string>;

/** Normalize a string|object item to the object form — the single coercion point. */
function asItem(item: BriefItem): ItemObject {
  return typeof item === 'string' ? { text: item } : item;
}

/** A known section kind, or 'prose' for anything unrecognized. */
function resolveKind(kind: string | undefined): SectionKind {
  return kind && kind in SECTION_LABEL ? (kind as SectionKind) : 'prose';
}

function isUrl(ref: string): boolean {
  return /^https?:\/\//.test(ref);
}

function RefChip({ value }: { value: string }) {
  return isUrl(value) ? (
    <a className="tcl-brief__chip" href={value} rel="noreferrer">
      {value}
    </a>
  ) : (
    <code className="tcl-brief__chip">{value}</code>
  );
}

function Desc({ text }: { text: string }) {
  return <span className="tcl-brief__desc"> — {text}</span>;
}

/** Render a section's items according to its (resolved) kind. */
function SectionBody({ kind, section }: { kind: SectionKind; section: BriefSection }) {
  const items = (section.items ?? []).map(asItem);

  if (kind === 'prose') {
    const paras = section.body ? section.body.split(/\n{2,}/) : items.map((it) => it.text);
    return (
      <>
        {paras.map((p, i) => (
          <p key={i} className="tcl-brief__prose">
            {p}
          </p>
        ))}
      </>
    );
  }

  if (kind === 'rules') {
    return (
      <ol className="tcl-brief__rules">
        {items.map((it, i) => (
          <li key={i} className="tcl-brief__rule">
            <span className="tcl-brief__rule-text">{it.text}</span>
            {it.desc && <Desc text={it.desc} />}
          </li>
        ))}
      </ol>
    );
  }

  if (kind === 'commands') {
    return (
      <ul className="tcl-brief__list">
        {items.map((it, i) => (
          <li key={i} className="tcl-brief__command">
            <code className="tcl-brief__code">{it.text}</code>
            {it.desc && <span className="tcl-brief__command-desc">{it.desc}</span>}
          </li>
        ))}
      </ul>
    );
  }

  if (kind === 'checklist') {
    return (
      <ul className="tcl-brief__list">
        {items.map((it, i) => (
          <li key={i} className="tcl-brief__check" data-severity={it.severity ?? 'info'}>
            <span className="tcl-brief__check-glyph" aria-hidden="true" />
            <span className="tcl-brief__check-text">
              {it.text}
              {it.desc && <Desc text={it.desc} />}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (kind === 'phases') {
    // A light plan: ordered phases with a status pip (done | active | pending).
    return (
      <ol className="tcl-brief__list tcl-brief__phases">
        {items.map((it, i) => (
          <li key={i} className="tcl-brief__phase" data-status={it.status ?? 'pending'}>
            <span className="tcl-brief__phase-pip" aria-hidden="true" />
            <span className="tcl-brief__phase-text">
              {it.text}
              {it.desc && <Desc text={it.desc} />}
            </span>
            {it.status && <span className="tcl-brief__phase-status">{it.status}</span>}
          </li>
        ))}
      </ol>
    );
  }

  if (kind === 'decisions') {
    return (
      <ul className="tcl-brief__list">
        {items.map((it, i) => (
          <li key={i} className="tcl-brief__decision">
            <span className="tcl-brief__decision-title">{it.text}</span>
            {it.choice && (
              <span className="tcl-brief__decision-choice">
                <span className="tcl-brief__arrow" aria-hidden="true">
                  →{' '}
                </span>
                {it.choice}
              </span>
            )}
          </li>
        ))}
      </ul>
    );
  }

  // artifacts | boundaries | reference — text (+ desc) with a pointer chip.
  return (
    <ul className="tcl-brief__list">
      {items.map((it, i) => (
        <li key={i} className="tcl-brief__ref">
          <span className="tcl-brief__ref-main">
            <span className="tcl-brief__ref-text">{it.text}</span>
            {it.desc && <Desc text={it.desc} />}
          </span>
          {it.ref && <RefChip value={it.ref} />}
          {it.status && <span className="tcl-brief__status">{it.status}</span>}
        </li>
      ))}
    </ul>
  );
}

export function Brief({ data, defaultCollapsed, className }: BriefProps) {
  const uid = useId();
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(defaultCollapsed));

  const toggle = (id: string): void =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const kind = data.kind ?? 'spec';
  const title = data.title ?? data.id ?? 'Untitled';
  const sections = data.sections ?? [];

  return (
    <article className={cx('tcl-brief', className)} data-kind={kind} aria-label={title}>
      <header className="tcl-brief__header">
        <div className="tcl-brief__kindrow">
          <span className="tcl-brief__kind">{KIND_LABEL[kind] ?? kind}</span>
          {data.id && <span className="tcl-brief__id">{data.id}</span>}
        </div>
        <h2 className="tcl-brief__title">{title}</h2>
        {data.summary && <p className="tcl-brief__summary">{data.summary}</p>}
        {data.meta && data.meta.length > 0 && (
          <div className="tcl-brief__meta">
            {data.meta.map((m, i) => (
              <span
                key={i}
                className="tcl-brief__metapill"
                style={m.tone ? { borderColor: m.tone, color: m.tone } : undefined}
              >
                <span className="tcl-brief__metalabel">{m.label}</span>
                <span className="tcl-brief__metavalue">{m.value}</span>
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="tcl-brief__sections">
        {sections.length === 0 && <p className="tcl-brief__empty">No sections.</p>}
        {sections.map((s, i) => {
          const id = s.id ?? `s${i}`;
          const k = resolveKind(s.kind);
          const heading = s.heading ?? SECTION_LABEL[k];
          const open = !collapsed.has(id);
          const regionId = `${uid}-${id}`;
          return (
            <section
              key={id}
              className="tcl-brief__section"
              data-kind={k}
              data-state={open ? 'open' : 'collapsed'}
            >
              <div className="tcl-brief__section-head">
                <h3 className="tcl-brief__section-h">
                  <button
                    type="button"
                    className="tcl-brief__toggle"
                    aria-expanded={open}
                    aria-controls={regionId}
                    onClick={() => toggle(id)}
                  >
                    <span className="tcl-brief__chevron" aria-hidden="true" />
                    {heading}
                  </button>
                </h3>
                <span className="tcl-brief__section-kind">{SECTION_LABEL[k] ?? k}</span>
              </div>
              <div id={regionId} className="tcl-brief__section-body" hidden={!open}>
                {s.note && <p className="tcl-brief__note">{s.note}</p>}
                <SectionBody kind={k} section={s} />
              </div>
            </section>
          );
        })}
      </div>
    </article>
  );
}
