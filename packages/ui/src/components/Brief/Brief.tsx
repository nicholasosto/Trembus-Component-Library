import { useCallback, useId, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { cx } from '../../utils/cx';
import { vars } from '../../internal/fillbar';
import { useElementSize } from '../../internal/useElementSize';
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
export type BriefKind = 'claude' | 'agents' | 'plan' | 'spec' | 'session' | (string & {});

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

export type Severity = 'info' | 'warn' | 'danger' | 'success' | (string & {});

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
  /** The brief contract to render. Produce one by hand, via `parseBrief`, or via `fromMarkdown`. */
  data: BriefContract;
  /** Heading rank for the document title (default `2`); section headings use the next rank. */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Section ids collapsed initially (everything expanded otherwise). */
  defaultCollapsed?: string[];
  className?: string;
  /** Render a drag/keyboard resize handle on the inline-end edge (window-splitter pattern). */
  resizable?: boolean;
  /** Controlled width in px — pair with `onWidthChange`. */
  width?: number;
  /** Uncontrolled starting width in px; omit to start at the CSS default width. */
  defaultWidth?: number;
  /** Fires with the clamped px width on drag moves, keyboard steps, and resets to `defaultWidth` (a reset to the CSS default width is silent). */
  onWidthChange?: (width: number) => void;
  /** Resize floor in px (default `360` — keeps a readable measure). An inverted min/max pair swaps. */
  minWidth?: number;
  /** Resize ceiling in px (default `1200`); commits are also capped to the live container width. */
  maxWidth?: number;
}

type HeadingLevel = NonNullable<BriefProps['headingLevel']>;

const HEADING_TAG: Record<HeadingLevel, `h${HeadingLevel}`> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
};

const KIND_LABEL: Record<string, string> = {
  claude: 'Claude',
  agents: 'Agents',
  plan: 'Plan',
  spec: 'Spec',
  session: 'Session',
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

/** Resize keyboard steps (px) and the narrow-layout threshold. */
const STEP = 16;
const STEP_LARGE = 64;
const NARROW_MAX = 480;
/** Pre-measure ARIA fallback when no width is set yet (mirrors the CSS default width). */
const FALLBACK_MEASURE = 760;

function clampNum(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function Brief({
  data,
  headingLevel = 2,
  defaultCollapsed,
  className,
  resizable = false,
  width,
  defaultWidth,
  onWidthChange,
  minWidth = 360,
  maxWidth = 1200,
}: BriefProps) {
  const uid = useId();
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(defaultCollapsed));
  const [ownWidth, setOwnWidth] = useState<number | null>(() =>
    defaultWidth !== undefined
      ? Math.round(
          clampNum(defaultWidth, Math.min(minWidth, maxWidth), Math.max(minWidth, maxWidth)),
        )
      : null,
  );
  const [dragging, setDragging] = useState(false);
  const [setSizeRef, measured] = useElementSize();
  const rootRef = useRef<HTMLElement | null>(null);
  // Container-aware ceiling + drag anchor/direction, refreshed at each interaction start.
  const boundRef = useRef(Math.max(minWidth, maxWidth));
  const dragAnchorRef = useRef(0);
  const rtlRef = useRef(false);

  const setRootRef = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      setSizeRef(node);
    },
    [setSizeRef],
  );

  const toggle = (id: string): void =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const controlled = width !== undefined;
  const widthValue = controlled ? width : ownWidth;
  // House rule: forced domains clamp, inverted pairs swap.
  const loBound = Math.min(minWidth, maxWidth);
  const hiBound = Math.max(minWidth, maxWidth);

  /** Rendered border-box width — the same space commits live in; 0 pre-layout. */
  const renderedWidth = (): number => {
    const rect = rootRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? Math.round(rect.width) : 0;
  };

  const currentWidth = (): number => widthValue ?? (renderedWidth() || FALLBACK_MEASURE);

  const isRtl = (): boolean =>
    rootRef.current !== null && getComputedStyle(rootRef.current).direction === 'rtl';

  const measureBound = (): void => {
    const parent = rootRef.current?.parentElement;
    const rect = parent?.getBoundingClientRect();
    let avail = rect && rect.width > 0 ? rect.width : 0;
    if (avail > 0 && parent) {
      // The rect is the parent's border box; the pane's containing block excludes
      // its paddings (a grid column can still be narrower — arrows self-correct below).
      const cs = getComputedStyle(parent);
      avail -= (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    }
    // Floor at the lower bound so a cramped container can't drive commits (and
    // aria-valuenow) below the declared minimum — CSS min(…, 100%) caps visually.
    boundRef.current = avail > 0 ? Math.max(loBound, Math.min(hiBound, avail)) : hiBound;
  };

  const commit = (next: number): void => {
    const clamped = Math.round(clampNum(next, loBound, boundRef.current));
    if (!controlled) setOwnWidth(clamped);
    onWidthChange?.(clamped);
  };

  const reset = (): void => {
    if (defaultWidth !== undefined) {
      measureBound();
      commit(defaultWidth);
      return;
    }
    // No defaultWidth → back to the CSS default width; silent, since there is no
    // numeric value to report until the next layout.
    if (!controlled) setOwnWidth(null);
  };

  const onResizerKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    measureBound();
    // Step from the visible width when the stored value overshoots the container
    // (End in a narrow box) so arrows never wander a dead zone above the render.
    const rendered = renderedWidth();
    const base = rendered > 0 ? Math.min(currentWidth(), rendered) : currentWidth();
    // In RTL the pane grows toward the LEFT, so the arrow senses flip.
    const step = (e.shiftKey ? STEP_LARGE : STEP) * (isRtl() ? -1 : 1);
    let next: number;
    switch (e.key) {
      case 'ArrowRight':
        next = base + step;
        break;
      case 'ArrowLeft':
        next = base - step;
        break;
      case 'Home':
        next = loBound;
        break;
      case 'End':
        next = boundRef.current;
        break;
      case 'Enter':
        e.preventDefault();
        reset();
        return;
      default:
        return;
    }
    e.preventDefault();
    commit(next);
  };

  const onResizerPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    if (dragging) return; // one pointer drives; a second grab must not re-anchor
    // Anchor so the grab point keeps its offset (width′ = w0 + pointer delta) —
    // no snap-to-edge on the first move, and direction-aware for RTL.
    const rtl = isRtl();
    rtlRef.current = rtl;
    const w = currentWidth();
    dragAnchorRef.current = rtl ? e.clientX + w : e.clientX - w;
    measureBound();
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onResizerPointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    if (!dragging) return;
    commit(rtlRef.current ? dragAnchorRef.current - e.clientX : e.clientX - dragAnchorRef.current);
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>): void => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);
  };

  const kind = data.kind ?? 'spec';
  const title = data.title ?? data.id ?? 'Untitled';
  const sections = data.sections ?? [];
  const TitleHeading = HEADING_TAG[headingLevel];
  const SectionHeading = HEADING_TAG[Math.min(6, headingLevel + 1) as HeadingLevel];

  // Dash-free suffix: section region ids are `${uid}-${sectionId}`, so a section
  // authored `id: 'doc'` can never collide with the article's own id.
  const docId = `${uid}doc`;
  const valueNow = Math.round(currentWidth());
  const sizeBucket =
    measured.width > 0 ? (measured.width < NARROW_MAX ? 'narrow' : 'regular') : undefined;

  return (
    <article
      className={cx('tcl-brief', className)}
      data-kind={kind}
      aria-label={title}
      id={resizable ? docId : undefined}
      data-resizable={resizable || undefined}
      data-dragging={dragging || undefined}
      data-size={sizeBucket}
      ref={setRootRef}
      style={
        resizable && widthValue != null
          ? vars({ '--tcl-brief-width': `${widthValue}px` })
          : undefined
      }
    >
      <header className="tcl-brief__header">
        <div className="tcl-brief__kindrow">
          <span className="tcl-brief__kind">{KIND_LABEL[kind] ?? kind}</span>
          {data.id && <span className="tcl-brief__id">{data.id}</span>}
        </div>
        <TitleHeading className="tcl-brief__title">{title}</TitleHeading>
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
                <SectionHeading className="tcl-brief__section-h">
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
                </SectionHeading>
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

      {/* APG "window splitter": a FOCUSABLE separator with aria-value* is an
          interactive widget per ARIA 1.1+; jsx-a11y's role taxonomy predates the
          pattern and misreads it as static. */}
      {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
      {resizable && (
        <div
          className="tcl-brief__resizer"
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={`Resize document — ${title}`}
          aria-controls={docId}
          aria-valuemin={Math.min(loBound, valueNow)}
          aria-valuemax={Math.max(hiBound, valueNow)}
          aria-valuenow={valueNow}
          aria-valuetext={`${valueNow} pixels`}
          data-dragging={dragging || undefined}
          onKeyDown={onResizerKeyDown}
          onDoubleClick={reset}
          onPointerDown={onResizerPointerDown}
          onPointerMove={onResizerPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <span className="tcl-brief__resizer-grip" aria-hidden="true" />
        </div>
      )}
      {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
    </article>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  Generator robustness — parseBrief (lenient validator) + fromMarkdown.
//
//  parseBrief() NEVER throws: it coerces messy/partial input into a renderable
//  BriefContract and returns actionable `issues` so a generator (or the next
//  LLM) can self-correct. fromMarkdown() turns an existing CLAUDE.md/AGENTS.md
//  into a contract deterministically — no model, no hallucination — which is
//  why "generation" almost always works for docs that already exist.
// ════════════════════════════════════════════════════════════════════════

export interface BriefIssue {
  /** Path to the offending node, e.g. "sections[2].items[0].severity". */
  path: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  got?: string;
  expected?: string;
  /** Nearest blessed value, when the input looks like a typo. */
  didYouMean?: string;
}

export interface BriefParseResult {
  /** Always renderable — lenient parse, strict render. `sections` is always present. */
  data: BriefContract & { sections: BriefSection[] };
  issues: BriefIssue[];
  /** True when no issue is an error (faithful, not merely renderable). */
  ok: boolean;
}

const KNOWN_KINDS = ['claude', 'agents', 'plan', 'spec', 'session'];
const KNOWN_SECTION_KINDS: string[] = [
  'prose',
  'rules',
  'commands',
  'checklist',
  'phases',
  'artifacts',
  'boundaries',
  'decisions',
  'reference',
];
const KNOWN_SEVERITIES = ['info', 'warn', 'danger', 'success'];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Levenshtein distance — powers the "did you mean" repair hints. */
function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

/** The closest blessed option, when it's near enough to be a likely typo. */
function closest(value: string, options: string[]): string | undefined {
  let best: string | undefined;
  let bestD = Infinity;
  for (const o of options) {
    const d = editDistance(value.toLowerCase(), o);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best !== undefined && bestD <= Math.max(2, Math.floor(best.length / 3)) ? best : undefined;
}

function normalizeItem(raw: unknown, path: string, issues: BriefIssue[]): ItemObject {
  if (typeof raw === 'string') return { text: raw };
  if (!isRecord(raw)) {
    issues.push({
      path,
      level: 'warn',
      message: 'item should be a string or object',
      got: raw === null ? 'null' : typeof raw,
      expected: 'string | object',
    });
    return { text: String(raw) };
  }
  const out: ItemObject = { text: '' };
  if (typeof raw.text === 'string') out.text = raw.text;
  else
    issues.push({
      path: `${path}.text`,
      level: 'warn',
      message: 'item missing "text"',
      expected: 'string',
    });
  if (typeof raw.desc === 'string') out.desc = raw.desc;
  if (typeof raw.status === 'string') out.status = raw.status;
  if (typeof raw.ref === 'string') out.ref = raw.ref;
  if (typeof raw.choice === 'string') out.choice = raw.choice;
  if (raw.severity !== undefined) {
    if (typeof raw.severity === 'string' && KNOWN_SEVERITIES.includes(raw.severity)) {
      out.severity = raw.severity as Severity;
    } else {
      const got = String(raw.severity);
      issues.push({
        path: `${path}.severity`,
        level: 'info',
        message: `unknown severity "${got}"`,
        got,
        expected: KNOWN_SEVERITIES.join(' | '),
        didYouMean: closest(got, KNOWN_SEVERITIES),
      });
    }
  }
  return out;
}

function normalizeSection(raw: unknown, i: number, issues: BriefIssue[]): BriefSection {
  const path = `sections[${i}]`;
  if (!isRecord(raw)) {
    issues.push({
      path,
      level: 'error',
      message: 'section must be an object',
      got: raw === null ? 'null' : typeof raw,
      expected: 'object',
    });
    return { heading: `Section ${i + 1}`, kind: 'prose' };
  }
  const out: BriefSection = {};
  if (typeof raw.id === 'string') out.id = raw.id;
  if (typeof raw.heading === 'string' && raw.heading.trim()) out.heading = raw.heading;
  else
    issues.push({
      path: `${path}.heading`,
      level: 'warn',
      message: 'section missing "heading" (falls back to the kind label)',
      expected: 'string',
    });
  if (raw.kind !== undefined) {
    const k = String(raw.kind);
    if (typeof raw.kind === 'string' && KNOWN_SECTION_KINDS.includes(raw.kind)) {
      out.kind = raw.kind as SectionKind;
    } else {
      issues.push({
        path: `${path}.kind`,
        level: 'info',
        message: `unknown section kind "${k}" (renders as prose)`,
        got: k,
        expected: KNOWN_SECTION_KINDS.join(' | '),
        didYouMean: closest(k, KNOWN_SECTION_KINDS),
      });
      out.kind = raw.kind as SectionKind; // keep authored value; the renderer degrades it to prose
    }
  }
  if (typeof raw.note === 'string') out.note = raw.note;
  if (typeof raw.body === 'string') out.body = raw.body;
  if (raw.items !== undefined) {
    if (Array.isArray(raw.items))
      out.items = raw.items.map((it, j) => normalizeItem(it, `${path}.items[${j}]`, issues));
    else
      issues.push({
        path: `${path}.items`,
        level: 'warn',
        message: '"items" should be an array',
        got: typeof raw.items,
        expected: 'array',
      });
  }
  return out;
}

function normalizeMeta(raw: unknown, issues: BriefIssue[]): BriefMeta[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    issues.push({
      path: 'meta',
      level: 'warn',
      message: '"meta" should be an array',
      got: typeof raw,
      expected: 'array',
    });
    return undefined;
  }
  const out: BriefMeta[] = [];
  raw.forEach((m, i) => {
    if (
      isRecord(m) &&
      typeof m.label === 'string' &&
      (typeof m.value === 'string' || typeof m.value === 'number')
    ) {
      const entry: BriefMeta = { label: m.label, value: m.value };
      if (typeof m.tone === 'string') entry.tone = m.tone;
      out.push(entry);
    } else {
      issues.push({
        path: `meta[${i}]`,
        level: 'info',
        message: 'meta entry needs { label, value }',
        expected: '{ label: string, value: string | number }',
      });
    }
  });
  return out.length ? out : undefined;
}

/**
 * Lenient validator: coerce any input into a renderable BriefContract and
 * report actionable issues. NEVER throws — a partially-wrong generation still
 * renders, and `issues` is the repair list for the next attempt.
 */
export function parseBrief(input: unknown): BriefParseResult {
  const issues: BriefIssue[] = [];
  let obj: unknown = input;

  if (typeof input === 'string') {
    try {
      obj = JSON.parse(input) as unknown;
    } catch {
      issues.push({
        path: '',
        level: 'error',
        message: 'input is not valid JSON',
        got: 'string',
        expected: 'JSON object',
      });
      return { data: { view: 'brief', sections: [] }, issues, ok: false };
    }
  }
  if (!isRecord(obj)) {
    issues.push({
      path: '',
      level: 'error',
      message: 'expected a brief contract object',
      got: Array.isArray(obj) ? 'array' : obj === null ? 'null' : typeof obj,
      expected: 'object',
    });
    return { data: { view: 'brief', sections: [] }, issues, ok: false };
  }

  if (obj.view !== 'brief') {
    issues.push({
      path: 'view',
      level: 'warn',
      message:
        obj.view === undefined ? 'missing "view"; defaulting to "brief"' : 'view should be "brief"',
      got: String(obj.view),
      expected: 'brief',
    });
  }

  const data: BriefContract & { sections: BriefSection[] } = { view: 'brief', sections: [] };
  if (obj.kind !== undefined) {
    if (typeof obj.kind === 'string') {
      data.kind = obj.kind;
      if (!KNOWN_KINDS.includes(obj.kind))
        issues.push({
          path: 'kind',
          level: 'info',
          message: `unrecognized kind "${obj.kind}" (renders neutral)`,
          got: obj.kind,
          expected: KNOWN_KINDS.join(' | '),
          didYouMean: closest(obj.kind, KNOWN_KINDS),
        });
    } else {
      issues.push({
        path: 'kind',
        level: 'warn',
        message: '"kind" should be a string',
        got: typeof obj.kind,
      });
    }
  }
  if (typeof obj.id === 'string') data.id = obj.id;
  if (typeof obj.title === 'string') data.title = obj.title;
  if (typeof obj.summary === 'string') data.summary = obj.summary;
  const meta = normalizeMeta(obj.meta, issues);
  if (meta) data.meta = meta;

  if (obj.sections === undefined)
    issues.push({
      path: 'sections',
      level: 'warn',
      message: 'no "sections" — nothing to render',
      expected: 'array',
    });
  else if (!Array.isArray(obj.sections))
    issues.push({
      path: 'sections',
      level: 'error',
      message: '"sections" must be an array',
      got: typeof obj.sections,
      expected: 'array',
    });
  else data.sections = obj.sections.map((s, i) => normalizeSection(s, i, issues));

  return { data, issues, ok: !issues.some((it) => it.level === 'error') };
}

/** Strip the inline markdown the Brief renders as plain text (emphasis, code, links). */
function stripInline(s: string): string {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();
}

function parseItemText(raw: string): { text: string; desc?: string; codey: boolean } {
  const s = raw.trim();
  const code = s.match(/^`([^`]+)`\s*(?:[—–-]|:)?\s*(.*)$/);
  if (code)
    return { text: code[1].trim(), desc: stripInline(code[2]).trim() || undefined, codey: true };
  const bold = s.match(/^\*\*([^*]+)\*\*\s*(?:[—–-]|:)?\s*(.*)$/);
  if (bold)
    return { text: bold[1].trim(), desc: stripInline(bold[2]).trim() || undefined, codey: false };
  const dash = s.match(/^(.+?)\s+[—–]\s+(.+)$/);
  if (dash)
    return { text: stripInline(dash[1]).trim(), desc: stripInline(dash[2]).trim(), codey: false };
  return { text: stripInline(s), codey: false };
}

function sectionFromLines(heading: string, lines: string[]): BriefSection {
  const listRe = /^\s*(?:[-*+]\s+|(\d+)[.)]\s+)(.*)$/;
  const lead: string[] = [];
  const rawItems: { text: string; numbered: boolean }[] = [];
  let inList = false;
  for (const line of lines) {
    const m = line.match(listRe);
    if (m) {
      inList = true;
      rawItems.push({ text: m[2], numbered: m[1] !== undefined });
    } else if (line.trim() === '') {
      // blank line — ignore
    } else if (!inList) {
      lead.push(line);
    } else if (rawItems.length) {
      rawItems[rawItems.length - 1].text += ' ' + line.trim(); // wrapped continuation
    }
  }
  const note = stripInline(lead.join(' ')).replace(/\s+/g, ' ').trim();

  if (rawItems.length === 0) {
    const sec: BriefSection = { heading, kind: 'prose' };
    if (note) sec.body = note;
    return sec;
  }

  const parsed = rawItems.map((it) => parseItemText(it.text));
  const codey = parsed.filter((p) => p.codey).length >= Math.ceil(parsed.length / 2);
  const hl = heading.toLowerCase();
  let kind: SectionKind = 'rules';
  if (codey) kind = 'commands';
  if (/gotcha|caveat|checklist|pitfall|warning/.test(hl)) kind = 'checklist';
  else if (/decision/.test(hl)) kind = 'decisions';
  else if (/phase|milestone|roadmap/.test(hl)) kind = 'phases';

  const items: BriefItem[] = parsed.map((p) => {
    const item: ItemObject = { text: p.text };
    if (p.desc) item.desc = p.desc;
    return item;
  });
  const sec: BriefSection = { heading, kind, items };
  if (note) sec.note = note;
  return sec;
}

/**
 * Deterministically convert a CLAUDE.md / AGENTS.md / plan markdown doc into a
 * BriefContract. Model-free: the H1 is the title, leading prose is the summary,
 * each H2 is a section whose `kind` is inferred from its content (code →
 * commands, "Gotchas" → checklist, prose → prose, …). Pair with parseBrief() to
 * validate. Imperfect kind inference is fine — the renderer degrades gracefully.
 */
export function fromMarkdown(md: string): BriefContract & { sections: BriefSection[] } {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const contract: BriefContract & { sections: BriefSection[] } = { view: 'brief', sections: [] };
  let i = 0;

  // optional YAML-ish frontmatter
  if (lines[0]?.trim() === '---') {
    let j = 1;
    const fm: string[] = [];
    while (j < lines.length && lines[j].trim() !== '---') fm.push(lines[j++]);
    if (j < lines.length) {
      for (const f of fm) {
        const m = f.match(/^(\w+):\s*(.+)$/);
        if (!m) continue;
        const v = m[2].trim();
        if (m[1] === 'kind') contract.kind = v;
        else if (m[1] === 'id') contract.id = v;
        else if (m[1] === 'title') contract.title = v;
      }
      i = j + 1;
    }
  }

  const summaryLines: string[] = [];
  const raw: { heading: string; lines: string[] }[] = [];
  let current: { heading: string; lines: string[] } | null = null;
  for (; i < lines.length; i++) {
    const line = lines[i];
    const h2 = line.match(/^##\s+(.+)$/);
    const h1 = line.match(/^#\s+(.+)$/);
    if (h2) {
      if (current) raw.push(current);
      current = { heading: stripInline(h2[1]).trim(), lines: [] };
    } else if (h1 && !contract.title) {
      contract.title = stripInline(h1[1]).trim();
    } else if (current) {
      current.lines.push(line);
    } else {
      summaryLines.push(line);
    }
  }
  if (current) raw.push(current);

  const summary = stripInline(summaryLines.join(' ')).replace(/\s+/g, ' ').trim();
  if (summary) contract.summary = summary;
  contract.sections = raw.map((s) => sectionFromLines(s.heading, s.lines));
  return contract;
}
