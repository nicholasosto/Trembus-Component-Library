import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { clampPct, isFillBarTone, toneVar } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import { useSelection } from '../../internal/useSelection';
import { cx } from '../../utils/cx';
import './Assay.css';

/** Tone vocabulary for criteria/verdicts — the shared fillbar/tokens ontology. */
export type AssayTone = FillBarTone;

export interface AssayCriterion {
  /** REQUIRED and unique — candidate scores reference it (duplicates: first wins). */
  id: string;
  label: string;
  /** Relative weight (any positive scale; normalized internally to Σ 1). */
  weight: number;
  /** Series tone (defaults to a cycle that reserves `danger` for penalties). */
  tone?: AssayTone;
}

export interface AssayPenalty {
  /** Why points were clawed back (e.g. `duplicate of existing`). */
  label: string;
  /** Points subtracted, in scale units (clamped ≥ 0). */
  value: number;
}

export interface AssayCandidate {
  /** REQUIRED and unique — the selection identity (duplicates: first wins). */
  id: string;
  label: string;
  /** Small mono qualifier next to the label (e.g. `dream · 2026-08-02`). */
  sub?: string;
  /** Card detail shown when the candidate is assayed. */
  summary?: string;
  /** Criterion id → score 0..1 (missing → 0, out-of-range clamps). */
  scores: Record<string, number>;
  /** Deductions applied after the weighted sum — always painted `danger`. */
  penalties?: AssayPenalty[];
}

export interface AssayBand {
  /** Upper bound of this band (in scale units); omit on the last band. */
  upTo?: number;
  /** Verdict word — always paired with the tone, never color alone. */
  label: string;
  tone?: AssayTone;
}

export interface AssayScale {
  min: number;
  max: number;
  /** Ordered verdict bands; omit for a plain numeric total. */
  bands?: AssayBand[];
}

export interface AssayContract {
  /** Masthead eyebrow above the title. */
  brand?: string;
  /** Mono code chip in the masthead. */
  code?: string;
  /** Diagram heading. */
  title?: string;
  /** Support line beneath the heading. */
  caption?: string;
  /** The rubric: weighted criteria (weights normalized internally). */
  criteria: AssayCriterion[];
  /** One candidate renders the detail card; several render the ranked board. */
  candidates: AssayCandidate[];
  /** Total domain + verdict gates (default `{ min: 0, max: 1 }`, no bands). */
  scale?: AssayScale;
  /** Provenance line under the component (e.g. `rubric brain/v1.2`). */
  rubricNote?: string;
}

export interface AssayProps {
  /** The assay contract — a weighted rubric applied to one or more candidates. */
  data: AssayContract;
  /** Controlled selected candidate id (board mode). */
  selectedId?: string;
  /** Uncontrolled initial selection. */
  defaultSelectedId?: string;
  /** Called with the candidate id when one is assayed. */
  onSelect?: (id: string) => void;
  className?: string;
}

// `danger` is deliberately absent — it is reserved for penalties (status colors
// are never spent on "series 5", per the dataviz discipline).
const TONE_CYCLE: AssayTone[] = ['accent', 'info', 'success', 'warning', 'neutral'];

const clamp = (lo: number, hi: number, v: number): number => Math.min(hi, Math.max(lo, v));
const clamp01 = (v: number): number => (Number.isFinite(v) ? clamp(0, 1, v) : 0);
// One minus glyph everywhere (U+2212, matching the equation/penalty strings),
// and a snap-to-zero so a −0.04 total can never print as "-0.0".
const fmtPts = (v: number): string => {
  const n = Math.abs(v) < 0.05 ? 0 : v;
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}`;
};

interface CleanCriterion {
  id: string;
  label: string;
  /** Authored weight (for the ×0.30 tag). */
  weight: number;
  /** Normalized weight (Σ 1) — the geometry input. */
  wn: number;
  tone: AssayTone;
}

interface CleanBand {
  upTo: number | undefined;
  label: string;
  tone: AssayTone;
}

interface Contribution {
  criterion: CleanCriterion;
  score: number;
  /** Points in scale units: wn × score × (max − min). */
  pts: number;
}

interface CleanCandidate {
  id: string;
  label: string;
  sub?: string;
  summary?: string;
  contributions: Contribution[];
  penalties: AssayPenalty[];
  penaltyTotal: number;
  /** Total before penalties, clamped to the scale. */
  gross: number;
  /** Final total, clamped to the scale. */
  total: number;
  band: CleanBand | undefined;
}

interface Sanitized {
  criteria: CleanCriterion[];
  candidates: CleanCandidate[];
  /** Ranked view of `candidates` (total desc, stable). */
  ranked: CleanCandidate[];
  min: number;
  max: number;
  bands: CleanBand[];
  weightSum: number;
  normalized: boolean;
}

// Single sanitize pass — pure and total, never throws: dedup first-wins, ids
// required, weights/scores/penalties laundered finite and clamped, weights
// normalized to Σ 1, totals clamped into the scale, verdicts derived from bands.
function sanitizeAssay(data: AssayContract): Sanitized {
  const rawMin = data.scale?.min;
  const rawMax = data.scale?.max;
  const min = typeof rawMin === 'number' && Number.isFinite(rawMin) ? rawMin : 0;
  const maxCandidate = typeof rawMax === 'number' && Number.isFinite(rawMax) ? rawMax : 1;
  const max = maxCandidate > min ? maxCandidate : min + 1;
  const span = max - min;

  const critById = new Map<string, CleanCriterion>();
  for (const raw of data.criteria ?? []) {
    if (!raw || typeof raw.id !== 'string' || !raw.id || critById.has(raw.id)) continue;
    const weight =
      typeof raw.weight === 'number' && Number.isFinite(raw.weight) && raw.weight > 0
        ? raw.weight
        : 0;
    critById.set(raw.id, {
      id: raw.id,
      label: typeof raw.label === 'string' && raw.label ? raw.label : raw.id,
      weight,
      wn: 0,
      // Authored JSON can carry junk tones ('constructor'!) — launder through the
      // Object.hasOwn-guarded registry instead of trusting the type.
      tone:
        raw.tone && isFillBarTone(raw.tone)
          ? raw.tone
          : TONE_CYCLE[critById.size % TONE_CYCLE.length],
    });
  }
  const criteria = [...critById.values()];
  let weightSum = criteria.reduce((a, c) => a + c.weight, 0);
  // All-zero weights degrade to an equal split rather than a blank card.
  if (weightSum <= 0 && criteria.length) {
    for (const c of criteria) c.weight = 1;
    weightSum = criteria.length;
  }
  for (const c of criteria) c.wn = weightSum > 0 ? c.weight / weightSum : 0;
  const normalized = Math.abs(weightSum - 1) > 0.005;

  const bands: CleanBand[] = (data.scale?.bands ?? [])
    .filter((b) => b && typeof b.label === 'string' && b.label !== '')
    .map((b) => ({
      upTo: typeof b.upTo === 'number' && Number.isFinite(b.upTo) ? b.upTo : undefined,
      label: b.label,
      tone: b.tone && isFillBarTone(b.tone) ? b.tone : 'neutral',
    }))
    .sort((a, b) => (a.upTo ?? Infinity) - (b.upTo ?? Infinity))
    // Only ONE open-ended band is meaningful — extra undefined-upTo bands would
    // silently distort the zone flex widths, so keep the first and drop the rest.
    .filter(
      (b, i, all) => b.upTo !== undefined || all.findIndex((x) => x.upTo === undefined) === i,
    );
  const bandOf = (total: number): CleanBand | undefined =>
    bands.find((b) => b.upTo === undefined || total <= b.upTo) ?? bands[bands.length - 1];

  const seen = new Set<string>();
  const candidates: CleanCandidate[] = [];
  for (const raw of data.candidates ?? []) {
    if (!raw || typeof raw.id !== 'string' || !raw.id || seen.has(raw.id)) continue;
    seen.add(raw.id);
    const contributions: Contribution[] = criteria.map((criterion) => {
      const score = clamp01(raw.scores?.[criterion.id] ?? 0);
      return { criterion, score, pts: criterion.wn * score * span };
    });
    const penalties = (raw.penalties ?? [])
      .filter((p) => p && typeof p.label === 'string' && p.label !== '')
      .map((p) => ({
        label: p.label,
        value:
          typeof p.value === 'number' && Number.isFinite(p.value) ? clamp(0, span, p.value) : 0,
      }));
    const penaltyTotal = penalties.reduce((a, p) => a + p.value, 0);
    const gross = clamp(min, max, min + contributions.reduce((a, c) => a + c.pts, 0));
    const total = clamp(min, max, gross - penaltyTotal);
    candidates.push({
      id: raw.id,
      label: typeof raw.label === 'string' && raw.label ? raw.label : raw.id,
      sub: raw.sub,
      summary: raw.summary,
      contributions,
      penalties,
      penaltyTotal,
      gross,
      total,
      band: bandOf(total),
    });
  }

  const byInput = new Map(candidates.map((c, i) => [c.id, i]));
  const ranked = [...candidates].sort(
    (a, b) => b.total - a.total || byInput.get(a.id)! - byInput.get(b.id)!,
  );

  return { criteria, candidates, ranked, min, max, bands, weightSum, normalized };
}

function VerdictChip({ band, total }: { band: CleanBand | undefined; total: number }) {
  return (
    <span className={cx('tcl-assay__chip', band && `tcl-assay__chip--${band.tone}`)}>
      {band ? `${band.label} · ` : ''}
      {fmtPts(total)}
    </span>
  );
}

// The detail card — the n=1 layout AND the board's inspector body. Track length
// is the criterion's weight, fill is its score: ink equals contribution.
function CandidateCard({ candidate, S }: { candidate: CleanCandidate; S: Sanitized }) {
  const maxWn = Math.max(...S.criteria.map((c) => c.wn), 0.0001);
  // The printed equation must actually sum: on a non-zero-min scale the total is
  // min + Σpts − penalties, so the scale base is a real term — and a total that
  // hit the floor discloses the clamp instead of printing false arithmetic.
  const equation = [
    [
      ...(S.min !== 0 ? [`${fmtPts(S.min)} (base)`] : []),
      ...candidate.contributions.map((c) => c.pts.toFixed(1)),
    ].join(' + '),
    ...(candidate.penaltyTotal > 0 ? [`− ${candidate.penaltyTotal.toFixed(1)}`] : []),
  ].join(' ');
  const floored = candidate.gross - candidate.penaltyTotal < S.min - 1e-9;
  return (
    <div className="tcl-assay__card">
      <div className="tcl-assay__card-head">
        <span className="tcl-assay__card-label">{candidate.label}</span>
        {candidate.sub && <span className="tcl-assay__card-sub">{candidate.sub}</span>}
        <VerdictChip band={candidate.band} total={candidate.total} />
      </div>
      {candidate.summary && <p className="tcl-assay__card-summary">{candidate.summary}</p>}

      <div className="tcl-assay__rows">
        {candidate.contributions.map(({ criterion, score, pts }) => (
          <div key={criterion.id} className="tcl-assay__row">
            <span className="tcl-assay__row-label">
              {criterion.label}{' '}
              <span className="tcl-assay__weight">×{criterion.weight.toFixed(2)}</span>
            </span>
            <span className="tcl-assay__track-lane">
              <span
                className="tcl-assay__track"
                style={{ width: `${(criterion.wn / maxWn) * 100}%` }}
              >
                <span
                  className="tcl-assay__fill"
                  style={{ width: `${score * 100}%`, background: toneVar(criterion.tone) }}
                />
              </span>
            </span>
            <span className="tcl-assay__pts">{fmtPts(pts)}</span>
          </div>
        ))}
        {candidate.penalties.map((p, i) => (
          <div key={i} className="tcl-assay__row tcl-assay__row--penalty">
            <span className="tcl-assay__row-label">{p.label}</span>
            <span className="tcl-assay__penalty-mark" aria-hidden="true" />
            <span className="tcl-assay__pts">−{p.value.toFixed(1)}</span>
          </div>
        ))}
      </div>

      {S.bands.length > 0 && (
        <div className="tcl-assay__scale">
          <div className="tcl-assay__scale-bar">
            {S.bands.map((b, i) => {
              const from = i === 0 ? S.min : (S.bands[i - 1].upTo ?? S.min);
              const to = b.upTo ?? S.max;
              const width = clampPct(to, S.min, S.max) - clampPct(from, S.min, S.max);
              return (
                <span
                  key={`${b.label}-${i}`}
                  className={cx('tcl-assay__zone', `tcl-assay__zone--${b.tone}`)}
                  style={{ width: `${width}%` }}
                >
                  {/* a sliver zone can't fit its word — the verdict chip still carries it */}
                  {width >= 8 ? b.label : ''}
                </span>
              );
            })}
            <span
              className="tcl-assay__marker"
              style={{ left: `${clampPct(candidate.total, S.min, S.max)}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      <p className="tcl-assay__foot">
        {equation} = {fmtPts(candidate.total)}
        {floored ? ` (floored at ${fmtPts(S.min)})` : ''}
        {candidate.band ? ` → ${candidate.band.label}` : ''} · weights Σ {S.weightSum.toFixed(2)}
        {S.normalized ? ' (normalized)' : ''}
      </p>
    </div>
  );
}

/**
 * Assay — a weighted-rubric evaluation: criteria tracks sized by weight and
 * filled by score (ink = contribution), penalties clawed back in danger red,
 * and a banded verdict scale. One candidate renders the detail card; several
 * render a ranked board where selecting a row assays it — the inspector IS the
 * card. Lead job is reveal-state: "the user can see why a candidate was
 * admitted, traced, or rejected", as a component.
 */
export function Assay({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: AssayProps) {
  const S = useMemo(() => sanitizeAssay(data), [data]);
  const [selectedId, select] = useSelection(selProp, defaultSelectedId, onSelect);
  const [rovingId, setRovingId] = useState<string | undefined>(() => selProp ?? defaultSelectedId);
  const previousSelectedIdProp = useRef(selProp);
  const rowEls = useRef(new Map<string, HTMLButtonElement>());

  // Re-seed the tab stop only when the external selectedId value actually
  // changes, so a controlled parent that hasn't accepted onSelect can't yank it
  // (the Strata rule, via Hub/TalentTree).
  useLayoutEffect(() => {
    if (previousSelectedIdProp.current === selProp) return;
    previousSelectedIdProp.current = selProp;
    setRovingId(selProp);
  }, [selProp]);

  const rankedIds = S.ranked.map((c) => c.id);
  const tabbableId = rankedIds.includes(rovingId ?? '')
    ? rovingId
    : selectedId && rankedIds.includes(selectedId)
      ? selectedId
      : rankedIds[0];

  const onRowKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number): void => {
    let next: number | undefined;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      next = Math.min(index + 1, S.ranked.length - 1);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      next = Math.max(index - 1, 0);
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = S.ranked.length - 1;
    }
    if (next === undefined) return;
    event.preventDefault();
    const id = S.ranked[next].id;
    setRovingId(id);
    select(id);
    rowEls.current.get(id)?.focus();
  };

  const selected = S.candidates.find((c) => c.id === selectedId);
  const single = S.candidates.length === 1 ? S.candidates[0] : undefined;

  return (
    <div className={cx('tcl-assay', className)}>
      {(data.brand || data.code || data.title || data.caption) && (
        <div className="tcl-assay__head">
          {data.brand && <span className="tcl-assay__brand">{data.brand}</span>}
          {data.code && <span className="tcl-assay__code">{data.code}</span>}
          {data.title && <span className="tcl-assay__title">{data.title}</span>}
          {data.caption && <span className="tcl-assay__caption">{data.caption}</span>}
        </div>
      )}

      {S.candidates.length === 0 || S.criteria.length === 0 ? (
        <p className="tcl-assay__empty">Nothing to assay — provide criteria and candidates.</p>
      ) : single ? (
        <CandidateCard candidate={single} S={S} />
      ) : (
        <>
          <div className="tcl-assay__legend">
            {S.criteria.map((c) => (
              <span key={c.id} className="tcl-assay__legend-item">
                <span
                  className="tcl-assay__legend-dot"
                  style={{ background: toneVar(c.tone) }}
                  aria-hidden="true"
                />
                {c.label} ×{c.weight.toFixed(2)}
              </span>
            ))}
            {S.ranked.some((c) => c.penalties.length > 0) && (
              <span className="tcl-assay__legend-item">
                <span
                  className="tcl-assay__legend-dot tcl-assay__legend-dot--penalty"
                  aria-hidden="true"
                />
                penalty
              </span>
            )}
          </div>

          <div className="tcl-assay__board" role="group" aria-label={data.title ?? 'Assay board'}>
            {S.ranked.map((c, index) => {
              const isSelected = c.id === selectedId;
              let running = S.min;
              return (
                <button
                  key={c.id}
                  ref={(el) => {
                    if (el) rowEls.current.set(c.id, el);
                    else rowEls.current.delete(c.id);
                  }}
                  type="button"
                  className={cx(
                    'tcl-assay__brow',
                    S.bands.length === 0 && 'tcl-assay__brow--no-verdict',
                    isSelected && 'is-selected',
                  )}
                  aria-pressed={isSelected}
                  aria-label={`${c.label}, ${fmtPts(c.total)}${c.band ? `, ${c.band.label}` : ''}, rank ${index + 1}`}
                  tabIndex={c.id === tabbableId ? 0 : -1}
                  onClick={() => {
                    setRovingId(c.id);
                    select(c.id);
                  }}
                  onKeyDown={(event) => onRowKeyDown(event, index)}
                >
                  <span className="tcl-assay__rank">{index + 1}</span>
                  <span className="tcl-assay__brow-label">{c.label}</span>
                  <span className="tcl-assay__bar">
                    {S.bands.map(
                      (b, i) =>
                        b.upTo !== undefined && (
                          <span
                            key={i}
                            className="tcl-assay__gate"
                            style={{ left: `${clampPct(b.upTo, S.min, S.max)}%` }}
                          />
                        ),
                    )}
                    {c.contributions.map(({ criterion, pts }) => {
                      const from = running;
                      running += pts;
                      return (
                        <span
                          key={criterion.id}
                          className="tcl-assay__seg"
                          style={{
                            left: `${clampPct(from, S.min, S.max)}%`,
                            width: `${clampPct(running, S.min, S.max) - clampPct(from, S.min, S.max)}%`,
                            background: toneVar(criterion.tone),
                          }}
                        />
                      );
                    })}
                    {c.penaltyTotal > 0 && (
                      <span
                        className="tcl-assay__seg tcl-assay__seg--penalty"
                        style={{
                          left: `${clampPct(c.total, S.min, S.max)}%`,
                          width: `${clampPct(c.gross, S.min, S.max) - clampPct(c.total, S.min, S.max)}%`,
                        }}
                      />
                    )}
                  </span>
                  <span className="tcl-assay__total">{fmtPts(c.total)}</span>
                  {c.band && (
                    <span className={cx('tcl-assay__chip', `tcl-assay__chip--${c.band.tone}`)}>
                      {c.band.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="tcl-assay__inspector">
            <div className="tcl-assay__inspector-live" aria-live="polite" aria-atomic="true">
              {selected ? (
                <p className="tcl-assay__inspector-line">
                  {selected.label}: {fmtPts(selected.total)}
                  {selected.band ? `, ${selected.band.label}` : ''}
                  {selected.penaltyTotal > 0
                    ? `. Penalty −${selected.penaltyTotal.toFixed(1)}: ${selected.penalties
                        .map((p) => p.label)
                        .join(', ')}.`
                    : '.'}
                </p>
              ) : (
                <p className="tcl-assay__inspector-hint">Select a candidate to assay it.</p>
              )}
            </div>
            {selected && <CandidateCard candidate={selected} S={S} />}
          </div>
        </>
      )}

      {data.rubricNote && <p className="tcl-assay__rubric-note">{data.rubricNote}</p>}
    </div>
  );
}
