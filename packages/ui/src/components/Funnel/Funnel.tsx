import { useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import { clampPct, toneVar, vars } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import './Funnel.css';

/**
 * `Funnel` — a descending conversion chart (e.g. Booked → Approved → Pending).
 * Each stage is a horizontal bar sized against the top stage and a focusable
 * button (the Hub/BarChart interaction spine); selecting one reveals its value,
 * conversion versus the top, and the drop from the previous stage in a live
 * inspector. It consumes a Trembus Visual Grammar **funnel contract** so one
 * authored shape draws in both the static HTML kit and React.
 */
export type FunnelTone = FillBarTone;

export interface FunnelStage {
  /** Stable id for selection; falls back to the stage index. */
  id?: string;
  /** Stage label — the conversion step. */
  label: string;
  /** Magnitude (non-negative). */
  value: number;
  /** Color-coded tone for the bar (default `accent`). */
  tone?: FunnelTone;
  /** Explicit bar color (hex) — overrides `tone`. */
  color?: string;
  /** Inspector detail shown when this stage is selected. */
  note?: string;
}

export interface FunnelContract {
  view?: 'funnel';
  brand?: string;
  code?: string;
  title?: string;
  caption?: string;
  /** Unit suffix appended to every value label (e.g. `%`, `k`). */
  unit?: string;
  stages: FunnelStage[];
}

export interface FunnelProps {
  data: FunnelContract;
  /** Controlled selected stage id. */
  selectedId?: string;
  defaultSelectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

/** Stable, collision-proof stage key: explicit id, else the stage index. */
const idOf = (s: FunnelStage, i: number): string => s.id ?? `s${i}`;
const fmt = (v: number, unit?: string): string => `${Math.round(v * 100) / 100}${unit ?? ''}`;
/** A percentage, rounded to a whole number for the labels. */
const pctOf = (v: number, base: number): number => (base > 0 ? Math.round((100 * v) / base) : 0);
/**
 * A conversion percentage for display, clamped to [0,100]: a funnel treats its
 * reference stage as 100%, so an out-of-order stage can never print a >100%
 * label that contradicts a bar already capped at full width.
 */
const convOf = (v: number, base: number): number => Math.min(100, pctOf(v, base));

export function Funnel({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  className,
}: FunnelProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultSelectedId);
  const selectedId = selProp ?? internal;
  const select = (id: string): void => {
    if (selProp === undefined) setInternal(id);
    onSelect?.(id);
  };

  const { stages, unit } = data;

  // Conversions are measured against the top (first) stage — the funnel
  // reference (a non-negative floor keeps a stray negative from inverting it).
  const topValue = useMemo(() => Math.max(0, stages[0]?.value ?? 0), [stages]);
  const topLabel = stages[0]?.label ?? 'top';
  // Bars are sized against the largest stage so they stay visible (and never
  // exceed the track) even when the data is non-monotonic or the top stage is 0.
  const scaleBase = useMemo(
    () => Math.max(topValue, 0, ...stages.map((s) => Math.max(0, s.value))),
    [stages, topValue],
  );

  const selectedIndex = stages.findIndex((s, i) => idOf(s, i) === selectedId);
  const selected = selectedIndex >= 0 ? stages[selectedIndex] : undefined;
  const prev = selectedIndex > 0 ? stages[selectedIndex - 1] : undefined;

  return (
    <div className={cx('tcl-funnel', className)}>
      {(data.code || data.title || data.caption || data.brand) && (
        <header className="tcl-funnel__header">
          {data.brand && <p className="tcl-funnel__brand">{data.brand}</p>}
          {data.code && <p className="tcl-funnel__code">{data.code}</p>}
          {data.title && <p className="tcl-funnel__title">{data.title}</p>}
          {data.caption && <p className="tcl-funnel__caption">{data.caption}</p>}
        </header>
      )}

      <div className="tcl-funnel__stages" role="group" aria-label={data.title ?? 'Funnel'}>
        {stages.map((s, i) => {
          const id = idOf(s, i);
          const v = Math.max(0, s.value);
          const pct = clampPct(v, 0, scaleBase);
          const pctTop = convOf(v, topValue);
          const isSelected = id === selectedId;
          const barColor = s.color ?? toneVar(s.tone ?? 'accent');
          return (
            <button
              key={id}
              type="button"
              className={cx('tcl-funnel__stage', isSelected && 'is-selected')}
              aria-pressed={isSelected}
              aria-label={`${s.label}: ${fmt(v, unit)}, ${pctTop}% of ${topLabel}`}
              onClick={() => select(id)}
            >
              <span className="tcl-funnel__label" title={s.label}>
                {s.label}
              </span>
              <span className="tcl-funnel__track">
                <span
                  className="tcl-funnel__bar"
                  style={vars({ '--pct': `${pct}%`, '--bar-color': barColor })}
                />
              </span>
              <span className="tcl-funnel__readout">
                <span className="tcl-funnel__value">{fmt(v, unit)}</span>
                <span className="tcl-funnel__conv">{pctTop}%</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="tcl-funnel__inspector" aria-live="polite">
        {selected ? (
          <>
            <p className="tcl-funnel__inspector-title">
              {selected.label}
              <span className="tcl-funnel__inspector-value">
                {' · '}
                {fmt(Math.max(0, selected.value), unit)} ·{' '}
                {convOf(Math.max(0, selected.value), topValue)}% of {topLabel}
              </span>
            </p>
            {prev && (
              <p className="tcl-funnel__inspector-drop">
                {(() => {
                  const cur = Math.max(0, selected.value);
                  const base = Math.max(0, prev.value);
                  const drop = base - cur;
                  return drop > 0
                    ? `Down ${fmt(drop, unit)} (${pctOf(drop, base)}%) from ${prev.label}`
                    : `No drop from ${prev.label} (${convOf(cur, base)}% retained)`;
                })()}
              </p>
            )}
            {selected.note && <p className="tcl-funnel__inspector-note">{selected.note}</p>}
          </>
        ) : (
          <p className="tcl-funnel__inspector-hint">Select a stage to inspect its conversion.</p>
        )}
      </div>
    </div>
  );
}
