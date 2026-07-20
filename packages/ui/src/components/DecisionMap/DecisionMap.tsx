import { useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { cx } from '../../utils/cx';
import { clampPct, toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import './DecisionMap.css';

/**
 * `DecisionMap` — ONE open decision, the moment **before** the call: the
 * question, 2–5 option cards, the assistant's recommendation (which option,
 * how strongly, why), per-option confidence, and — the point — each option's
 * downstream consequence cascade (first- and second-order effects with a
 * likelihood word on every edge). It complements the Visual Grammar
 * `decision-tree` ledger (locked calls, after the fact) and Brief's
 * `decisions` section (question → choice): those record outcomes; this maps
 * the choice space while it is still open.
 *
 * Deterministic layout (no engine) → Tier-1 viz spine. Lead job reveal-state,
 * but afford/acknowledge are real: each option card is one focusable
 * `<button>` whose accessible name is a composed sentence carrying the data
 * (label · recommended + strength · confidence · effort · door type ·
 * consequence tally), driven by controlled/uncontrolled `selectedId`
 * (+ `defaultSelectedId` + `onSelect`), with an `aria-live` inspector
 * revealing the selected option. Card internals are decorative; the cascade
 * below is real semantic nested lists.
 *
 * The contract is LLM-robust (lenient parse, strict render — the Brief
 * philosophy): everything but `title`/`options[].label` is optional, unknown
 * enum strings degrade to safe defaults (strength → `moderate`, likelihood →
 * `likely`, tone → `neutral`, effort/reversibility/horizon → chip omitted),
 * an unresolvable `recommendation.optionId`/`decidedId` is ignored, and the
 * component never throws on malformed data.
 */
export type DecisionMapTone = FillBarTone;

/** Decision lifecycle — `open` (default) or `decided`. */
export type DecisionMapStatus = 'open' | 'decided';

/** How strongly the assistant recommends its pick (default `moderate`). */
export type DecisionMapStrength = 'lean' | 'moderate' | 'strong';

/** How likely a consequence is to materialize (default `likely`). */
export type DecisionMapLikelihood = 'certain' | 'likely' | 'possible' | 'unlikely';

/** When a consequence lands; the chip renders only when present. */
export type DecisionMapHorizon = 'immediate' | 'near' | 'later';

/** Implementation-effort word chip. */
export type DecisionMapEffort = 'low' | 'medium' | 'high';

/** Door type: two-way (`reversible`), expensive two-way (`costly`), or `one-way`. */
export type DecisionMapReversibility = 'reversible' | 'costly' | 'one-way';

export interface DecisionMapConsequence {
  /** Stable key; falls back to the option id + index path (NEVER the label). */
  id?: string;
  /** What happens. */
  label: string;
  /** Optional elaboration under the label. */
  detail?: string;
  /** Valence: success=benefit · danger=risk · warning=caution · info=note · neutral/omitted=plain. */
  tone?: DecisionMapTone;
  /** Likelihood word — always rendered (default `likely`); `possible`/`unlikely` also draw a dashed rail. */
  likelihood?: DecisionMapLikelihood;
  /** Time-horizon chip (`immediate` · `near` · `later`). */
  horizon?: DecisionMapHorizon;
  /** Second-order downstream chain — nested list; the visual indent caps at depth 3, data never dropped. */
  then?: DecisionMapConsequence[];
}

export interface DecisionMapOption {
  /** Stable id for selection; falls back to the index (`o0`, `o1`, … — NEVER the label). */
  id?: string;
  /** Option name. */
  label: string;
  /** One-line pitch under the label. */
  summary?: string;
  /** Card accent tone (default `neutral`); accent painted as text falls back to `--tcl-text` ink. */
  tone?: DecisionMapTone;
  /** Effort word chip. */
  effort?: DecisionMapEffort;
  /** Door-type word chip. */
  reversibility?: DecisionMapReversibility;
  /** Assistant's confidence in its assessment of THIS option, 0–100 (clamped once, used everywhere). */
  confidence?: number;
  /** First-order downstream consequences; chain deeper via `then`. */
  consequences?: DecisionMapConsequence[];
}

export interface DecisionMapRecommendation {
  /** The recommended option's resolved id (explicit id, or its `o${index}` fallback). Unknown → ignored. */
  optionId: string;
  /** Recommendation strength (default `moderate`). */
  strength?: DecisionMapStrength;
  /** Why — revealed in the inspector when the recommended option is selected. */
  rationale?: string;
  /** Assistant's confidence in the recommendation itself, 0–100. */
  confidence?: number;
}

export interface DecisionMapContract {
  view?: 'decision-map';
  /** The open question, e.g. "Where should session state live?". */
  title: string;
  /** 1–2 sentence framing under the title. */
  context?: string;
  /** Default `open`; inferred `decided` when omitted but `decidedId` resolves to a real option. */
  status?: DecisionMapStatus;
  /** When decided: the winning option's resolved id. */
  decidedId?: string;
  /** When decided: the closing note (inspector shows it when the chosen option is selected). */
  decidedNote?: string;
  /** The assistant's pick: which option, how strongly, why, with what confidence. */
  recommendation?: DecisionMapRecommendation;
  /** 2–5 typical; each renders as one selectable card. */
  options: DecisionMapOption[];
}

export interface DecisionMapProps {
  /**
   * The decision contract. When one mounted instance is reused across
   * DIFFERENT decisions (index-fallback ids like `o0` recur), `key` the
   * component by decision identity or control `selectedId` — the uncontrolled
   * seed below is mount-only, like any default.
   */
  data: DecisionMapContract;
  /** Controlled selected option id. */
  selectedId?: string;
  /**
   * Uncontrolled initial selection. When omitted (and uncontrolled), the
   * selection auto-seeds to the DECIDED option (`decidedId`, when it resolves)
   * — the ledger leads with what was chosen — else to
   * `recommendation.optionId`, so the recommended path's consequences are
   * visible on first paint. Seeding happens on mount only, like any default.
   */
  defaultSelectedId?: string;
  /** Called with the option id when a card is selected. */
  onSelect?: (id: string) => void;
  className?: string;
}

/** Stable, collision-proof key: explicit id, else the index (NEVER the label). */
const optionIdOf = (o: DecisionMapOption, i: number): string => o.id ?? `o${i}`;

/** Card letter — A, B, C, …; past Z falls back to the 1-based number. */
const letterOf = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : `#${i + 1}`);

/** Accent painted as TEXT fails AA on light surfaces → fall back to --tcl-text; other tones keep their hue. */
const toneInk = (tone: DecisionMapTone): string =>
  tone === 'accent' ? 'var(--tcl-text)' : toneVar(tone);

// Whitelist-or-omit: LLM-emitted contracts may carry unknown enum strings at
// runtime; render a safe default (or nothing) rather than garbage — never throw.
const TONES: readonly DecisionMapTone[] = [
  'accent',
  'info',
  'success',
  'warning',
  'danger',
  'neutral',
];
const STRENGTHS: readonly DecisionMapStrength[] = ['lean', 'moderate', 'strong'];
const LIKELIHOODS: readonly DecisionMapLikelihood[] = ['certain', 'likely', 'possible', 'unlikely'];
const EFFORTS: readonly DecisionMapEffort[] = ['low', 'medium', 'high'];
const DOORS: readonly DecisionMapReversibility[] = ['reversible', 'costly', 'one-way'];
const HORIZONS: readonly DecisionMapHorizon[] = ['immediate', 'near', 'later'];

const oneOf = <T extends string>(
  allowed: readonly T[],
  value: string | undefined,
): T | undefined =>
  value !== undefined && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;

const normTone = (t: string | undefined): DecisionMapTone => oneOf(TONES, t) ?? 'neutral';
const normStrength = (s: string | undefined): DecisionMapStrength =>
  oneOf(STRENGTHS, s) ?? 'moderate';
const normLikelihood = (l: string | undefined): DecisionMapLikelihood =>
  oneOf(LIKELIHOODS, l) ?? 'likely';

/** Clamp ONCE (0–100, rounded); this single number feeds the bar width, the printed %, and the aria sentence. */
const pctOf = (confidence: number | undefined): number | undefined =>
  typeof confidence === 'number' && Number.isFinite(confidence)
    ? Math.round(clampPct(confidence, 0, 100))
    : undefined;

const DOOR_WORD: Record<DecisionMapReversibility, string> = {
  reversible: 'reversible',
  costly: 'costly to reverse',
  'one-way': 'one-way door',
};

/** Valence word paired with the tone rail — tone color never carries meaning alone. */
const VALENCE_WORD: Partial<Record<DecisionMapTone, string>> = {
  success: 'benefit',
  danger: 'risk',
  warning: 'caution',
  info: 'note',
};

type TallyBucket = 'benefit' | 'caution' | 'risk' | 'note';

interface ConsequenceTally {
  total: number;
  benefit: number;
  caution: number;
  risk: number;
  note: number;
}

/**
 * Consequence valence tone. `accent` is an OPTION tone, not a valence — an
 * accent rail would ride with no paired word — so it folds to `neutral` here.
 */
const consequenceToneOf = (t: string | undefined): DecisionMapTone => {
  const tone = normTone(t);
  return tone === 'accent' ? 'neutral' : tone;
};

/** Count the FULL consequence tree (all `then` descendants) by valence bucket. */
function tallyOf(items: readonly DecisionMapConsequence[] | undefined): ConsequenceTally {
  const t: ConsequenceTally = { total: 0, benefit: 0, caution: 0, risk: 0, note: 0 };
  const walk = (list: readonly DecisionMapConsequence[] | undefined): void => {
    (list ?? []).forEach((c) => {
      t.total += 1;
      const tone = consequenceToneOf(c.tone);
      if (tone === 'success') t.benefit += 1;
      else if (tone === 'danger') t.risk += 1;
      else if (tone === 'warning') t.caution += 1;
      else t.note += 1; // info · neutral (incl. folded accent) → plain notes
      walk(c.then);
    });
  };
  walk(items);
  return t;
}

const TALLY_ORDER: readonly TallyBucket[] = ['benefit', 'caution', 'risk', 'note'];

function tallyPhrase(t: ConsequenceTally): string {
  if (t.total === 0) return 'no consequences mapped';
  const parts = TALLY_ORDER.filter((b) => t[b] > 0).map(
    (b) => `${t[b]} ${b}${t[b] === 1 ? '' : 's'}`,
  );
  return `${t.total} consequence${t.total === 1 ? '' : 's'}: ${parts.join(', ')}`;
}

/**
 * Collision-proof resolved ids, first occurrence wins: explicit id (else the
 * `o${i}` index fallback), suffixed until unused. Duplicate ids from an
 * LLM-emitted contract must not double-select or collide React keys — and a
 * `recommendation.optionId`/`decidedId` pointing at a duplicated id resolves
 * to its first holder only.
 */
function resolvedIdsOf(data: DecisionMapContract): string[] {
  const used = new Set<string>();
  return (data.options ?? []).map((o, i) => {
    let id = optionIdOf(o, i);
    while (used.has(id)) id += '-dup';
    used.add(id);
    return id;
  });
}

const resolveIdIn = (ids: readonly string[], target: string | undefined): string | undefined =>
  target !== undefined && ids.includes(target) ? target : undefined;

/** The uncontrolled auto-seed: the decided option first (the ledger leads with the chosen), else the recommendation. */
function seedIdOf(data: DecisionMapContract): string | undefined {
  const ids = resolvedIdsOf(data);
  return resolveIdIn(ids, data.decidedId) ?? resolveIdIn(ids, data.recommendation?.optionId);
}

interface OptionModel {
  id: string;
  letter: string;
  option: DecisionMapOption;
  tone: DecisionMapTone;
  pct: number | undefined;
  tally: ConsequenceTally;
  effort: DecisionMapEffort | undefined;
  doorWord: string | undefined;
  isRecommended: boolean;
  isChosen: boolean;
  sentence: string;
}

interface DecisionModel {
  options: OptionModel[];
  decided: boolean;
  strength: DecisionMapStrength;
  recPct: number | undefined;
}

function buildModel(data: DecisionMapContract): DecisionModel {
  const raw = data.options ?? [];
  const ids = resolvedIdsOf(data);
  const recommendedId = resolveIdIn(ids, data.recommendation?.optionId);
  const chosenId = resolveIdIn(ids, data.decidedId);
  const decided =
    data.status === 'decided' || (data.status === undefined && chosenId !== undefined);
  const strength = normStrength(data.recommendation?.strength);
  const recPct = pctOf(data.recommendation?.confidence);

  const options: OptionModel[] = raw.map((option, i) => {
    const id = ids[i];
    const tone = normTone(option.tone);
    const pct = pctOf(option.confidence);
    const tally = tallyOf(option.consequences);
    const effort = oneOf(EFFORTS, option.effort);
    const door = oneOf(DOORS, option.reversibility);
    const isRecommended = id === recommendedId;
    const isChosen = id === chosenId;

    const lead = `Option ${letterOf(i)}: ${option.label}${
      isRecommended ? ` — recommended, ${strength}` : ''
    }${isChosen ? ' — chosen' : ''}`;
    const sentence = [
      lead,
      pct !== undefined ? `confidence ${pct}%` : undefined,
      effort ? `effort ${effort}` : undefined,
      door ? DOOR_WORD[door] : undefined,
      tallyPhrase(tally),
    ]
      .filter(Boolean)
      .join('; ');

    return {
      id,
      letter: letterOf(i),
      option,
      tone,
      pct,
      tally,
      effort,
      doorWord: door ? DOOR_WORD[door] : undefined,
      isRecommended,
      isChosen,
      sentence,
    };
  });

  return { options, decided, strength, recPct };
}

/** One consequence tier — real semantic lists; indent styling caps at depth 3 (content never dropped). */
function renderChain(
  items: readonly DecisionMapConsequence[],
  depth: number,
  optionId: string,
  path: string,
): ReactElement {
  return (
    <ul className="tcl-decision-map__chain" data-depth={depth}>
      {items.map((c, i) => {
        const likelihood = normLikelihood(c.likelihood);
        const tone = consequenceToneOf(c.tone);
        const horizon = oneOf(HORIZONS, c.horizon);
        const valence = VALENCE_WORD[tone];
        return (
          <li
            key={c.id ?? `${optionId}-c${path}${i}`}
            className="tcl-decision-map__consequence"
            data-likelihood={likelihood}
            style={vars({
              '--consequence-tone': toneVar(tone),
              '--consequence-ink': toneInk(tone),
            })}
          >
            <span className="tcl-decision-map__consequence-row">
              <span className="tcl-decision-map__chip" data-kind="likelihood">
                {likelihood}
              </span>
              <span className="tcl-decision-map__consequence-label">{c.label}</span>
              {valence && (
                <span className="tcl-decision-map__chip" data-kind="valence">
                  {valence}
                </span>
              )}
              {horizon && (
                <span className="tcl-decision-map__chip" data-kind="horizon">
                  {horizon}
                </span>
              )}
            </span>
            {c.detail && <span className="tcl-decision-map__consequence-detail">{c.detail}</span>}
            {c.then && c.then.length > 0
              ? renderChain(c.then, depth + 1, optionId, `${path}${i}-`)
              : null}
          </li>
        );
      })}
    </ul>
  );
}

export function DecisionMap({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: DecisionMapProps) {
  const [internal, setInternal] = useState<string | undefined>(
    () => defaultSelectedId ?? seedIdOf(data),
  );
  const selectedId = selProp ?? internal;
  const select = (id: string): void => {
    if (selProp === undefined) setInternal(id);
    onSelect?.(id);
  };

  const model = useMemo(() => buildModel(data), [data]);
  const { options, decided } = model;
  const hasOptions = options.length > 0;
  const selected = options.find((o) => o.id === selectedId);
  const chain = selected?.option.consequences ?? [];

  return (
    <div className={cx('tcl-decision-map', className)} data-status={decided ? 'decided' : 'open'}>
      <header className="tcl-decision-map__header">
        <div className="tcl-decision-map__heading">
          <p className="tcl-decision-map__title">{data.title ?? 'Decision'}</p>
          {data.context && <p className="tcl-decision-map__context">{data.context}</p>}
        </div>
        <span className="tcl-decision-map__status" data-status={decided ? 'decided' : 'open'}>
          {decided ? 'Decided' : 'Open decision'}
        </span>
      </header>

      {hasOptions ? (
        <>
          <div
            className="tcl-decision-map__options"
            role="group"
            aria-label={data.title ?? 'Decision'}
          >
            {options.map((o) => {
              const isSelected = o.id === selectedId;
              return (
                <button
                  key={o.id}
                  type="button"
                  className={cx('tcl-decision-map__option', isSelected && 'is-selected')}
                  data-recommended={o.isRecommended || undefined}
                  data-chosen={o.isChosen || undefined}
                  style={vars({
                    '--option-tone': toneVar(o.tone),
                    '--option-ink': toneInk(o.tone),
                    ...(o.pct !== undefined ? { '--value': `${o.pct}%` } : {}),
                  })}
                  aria-pressed={isSelected}
                  aria-label={o.sentence}
                  onClick={() => select(o.id)}
                >
                  <span className="tcl-decision-map__topline">
                    <span className="tcl-decision-map__letter">{o.letter}</span>
                    {o.isChosen && (
                      <span className="tcl-decision-map__chip" data-kind="chosen">
                        Chosen
                      </span>
                    )}
                  </span>
                  {o.isRecommended && (
                    <span className="tcl-decision-map__ribbon" data-strength={model.strength}>
                      <span aria-hidden="true">★ </span>
                      Recommended — {model.strength}
                    </span>
                  )}
                  <span className="tcl-decision-map__label" title={o.option.label}>
                    {o.option.label}
                  </span>
                  {o.option.summary && (
                    <span className="tcl-decision-map__summary">{o.option.summary}</span>
                  )}
                  {o.pct !== undefined && (
                    <span className="tcl-decision-map__confidence">
                      <span className="tcl-decision-map__confidence-track">
                        <span className="tcl-decision-map__confidence-fill" />
                      </span>
                      <span className="tcl-decision-map__confidence-value">{o.pct}%</span>
                    </span>
                  )}
                  {(o.effort || o.doorWord) && (
                    <span className="tcl-decision-map__chips">
                      {o.effort && (
                        <span className="tcl-decision-map__chip" data-kind="effort">
                          effort {o.effort}
                        </span>
                      )}
                      {o.doorWord && (
                        <span className="tcl-decision-map__chip" data-kind="door">
                          {o.doorWord}
                        </span>
                      )}
                    </span>
                  )}
                  {o.tally.total > 0 && (
                    <span className="tcl-decision-map__tally">
                      {TALLY_ORDER.filter((b) => o.tally[b] > 0).map((b) => (
                        <span key={b} className="tcl-decision-map__tally-item" data-bucket={b}>
                          {o.tally[b]} {b}
                          {o.tally[b] === 1 ? '' : 's'}
                        </span>
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="tcl-decision-map__cascade">
            {selected ? (
              <>
                <p className="tcl-decision-map__cascade-title">
                  Consequences — Option {selected.letter}: {selected.option.label}
                </p>
                {chain.length > 0 ? (
                  renderChain(chain, 0, selected.id, '')
                ) : (
                  <p className="tcl-decision-map__none">No consequences mapped yet.</p>
                )}
              </>
            ) : (
              <p className="tcl-decision-map__cascade-hint">
                Select an option to trace its consequences.
              </p>
            )}
          </div>

          <div className="tcl-decision-map__inspector" aria-live="polite">
            {selected ? (
              <>
                <p className="tcl-decision-map__inspector-title">
                  Option {selected.letter} — {selected.option.label}
                </p>
                {selected.option.summary && (
                  <p className="tcl-decision-map__inspector-note">{selected.option.summary}</p>
                )}
                {selected.isRecommended && (
                  <p className="tcl-decision-map__inspector-rec">
                    Recommended — {model.strength}
                    {model.recPct !== undefined && ` (confidence ${model.recPct}%)`}
                    {data.recommendation?.rationale && `: ${data.recommendation.rationale}`}
                  </p>
                )}
                {selected.isChosen && data.decidedNote && (
                  <p className="tcl-decision-map__inspector-decided">{data.decidedNote}</p>
                )}
                <p className="tcl-decision-map__inspector-tally">
                  {selected.pct !== undefined && `confidence ${selected.pct}% · `}
                  {tallyPhrase(selected.tally)}
                </p>
              </>
            ) : (
              <p className="tcl-decision-map__inspector-hint">
                Select an option to inspect the recommendation and its consequences.
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="tcl-decision-map__empty">No options mapped yet.</p>
      )}
    </div>
  );
}
