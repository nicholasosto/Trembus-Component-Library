import type { HTMLAttributes, ReactNode } from 'react';
import type { StatusTone } from '../../tokens/tokens.types';
import { cx } from '../../utils/cx';
import './DataStatusBar.css';

/**
 * `DataStatusBar` — the context strip that frames a data view (a KPI grid, a
 * report, a dashboard). It answers two questions at a glance: *can I trust this
 * data right now?* and *what parameters produced it?*
 *
 * - **Reveal state (lead):** a color-coded status dot + label (live / stale /
 *   loading / error / partial / paused), a freshness readout, and scope metrics
 *   (record count, coverage…) sit in a `role="status"` live region — flip the
 *   `status` prop and a screen reader announces the change.
 * - **Afford action:** each active parameter is a chip; pass `onRemoveFilter` to
 *   give every chip a remove button, and `onRefresh` for a re-pull control.
 * - **Acknowledge input:** removing a chip or refreshing fires the callback so the
 *   host updates the data; the live region re-announces the new status.
 *
 * Presentational by default — with no `onRemoveFilter`/`onRefresh` it is a static
 * read-out (like `Badge`/`Callout`), still carrying the live status region.
 */
export type DataStatus = 'live' | 'stale' | 'loading' | 'error' | 'partial' | 'paused';

export type DataChipTone = StatusTone | 'accent';

export interface DataFilter {
  /** Stable id — used for React keys + the remove callback. Falls back to the
   *  index, NEVER the label (duplicate labels would collide). */
  id?: string;
  /** Parameter name, e.g. "Period". */
  label: string;
  /** Applied value, e.g. "Q2 FY26". */
  value: ReactNode;
  /** Chip accent (default `neutral`); use `accent` for the primary parameter. */
  tone?: DataChipTone;
}

export interface DataMetric {
  /** Stable id — falls back to the index, never the label. */
  id?: string;
  /** Unit/dimension, e.g. "records". */
  label: string;
  /** Scalar, e.g. "1,284". */
  value: ReactNode;
}

export interface DataStatusBarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Freshness/health of the data (default `live`). Drives the dot + live region. */
  status?: DataStatus;
  /** Override the default status word (e.g. "Streaming" instead of "Live"). */
  statusLabel?: ReactNode;
  /** Dataset name shown at the start of the bar (e.g. "Delivery KPIs"). */
  title?: ReactNode;
  /** Machine timestamp for the `<time>` element (ISO string / epoch ms / Date). */
  updatedAt?: string | number | Date;
  /** Human freshness text, e.g. "Updated 4m ago". Rendered inside `<time>` when
   *  `updatedAt` is also set, otherwise as plain text. */
  updatedLabel?: ReactNode;
  /** Scope metrics — record counts, coverage, anything quantifying the slice. */
  metrics?: ReadonlyArray<DataMetric>;
  /** The active parameters/filters that scoped this data. */
  filters?: ReadonlyArray<DataFilter>;
  /** When set, every chip gains a remove button that calls this with the filter. */
  onRemoveFilter?: (id: string, filter: DataFilter) => void;
  /** Builds the remove button's accessible name (default "Remove {label} filter"). */
  removeFilterLabel?: (filter: DataFilter) => string;
  /** When set, renders a refresh button that calls this; disabled while loading. */
  onRefresh?: () => void;
  /** Accessible name + text for the refresh button (default "Refresh"). */
  refreshLabel?: ReactNode;
  /** Accessible name for the whole region (default "Data status"). */
  'aria-label'?: string;
  /** Compact height + tighter spacing for embedding above dense tables. */
  dense?: boolean;
}

/** status → tone + default word. The single source for color + text. */
const STATUS_META: Record<DataStatus, { tone: DataChipTone; label: string }> = {
  live: { tone: 'success', label: 'Live' },
  stale: { tone: 'warning', label: 'Stale' },
  loading: { tone: 'info', label: 'Loading' },
  error: { tone: 'danger', label: 'Error' },
  partial: { tone: 'warning', label: 'Partial' },
  paused: { tone: 'neutral', label: 'Paused' },
};

function toDateTime(updatedAt: string | number | Date): string {
  if (updatedAt instanceof Date) return updatedAt.toISOString();
  if (typeof updatedAt === 'number') return new Date(updatedAt).toISOString();
  return updatedAt;
}

export function DataStatusBar({
  status = 'live',
  statusLabel,
  title,
  updatedAt,
  updatedLabel,
  metrics,
  filters,
  onRemoveFilter,
  removeFilterLabel = (f) => `Remove ${f.label} filter`,
  onRefresh,
  refreshLabel = 'Refresh',
  'aria-label': ariaLabel = 'Data status',
  dense = false,
  className,
  ...rest
}: DataStatusBarProps) {
  const meta = STATUS_META[status];
  const word = statusLabel ?? meta.label;
  const loading = status === 'loading';
  const hasFilters = filters != null && filters.length > 0;
  const showFresh = updatedLabel != null && updatedLabel !== false;

  return (
    <section
      className={cx(
        'tcl-data-status-bar',
        `tcl-data-status-bar--${meta.tone}`,
        dense && 'tcl-data-status-bar--dense',
        className,
      )}
      aria-label={ariaLabel}
      data-status={status}
      {...rest}
    >
      <div className="tcl-data-status-bar__lead">
        {title != null && title !== false && (
          <span className="tcl-data-status-bar__title">{title}</span>
        )}

        <span className="tcl-data-status-bar__status">
          {/* reveal-state: only the signal is a live region, so a status flip is
              announced but a ticking freshness label is not */}
          <span className="tcl-data-status-bar__signal" role="status" aria-live="polite">
            <span
              className={cx(
                'tcl-data-status-bar__dot',
                loading && 'tcl-data-status-bar__dot--pulse',
                status === 'live' && 'tcl-data-status-bar__dot--beacon',
              )}
              aria-hidden="true"
            />
            <span className="tcl-data-status-bar__status-word">{word}</span>
          </span>
          {showFresh &&
            (updatedAt != null ? (
              <time className="tcl-data-status-bar__fresh" dateTime={toDateTime(updatedAt)}>
                {updatedLabel}
              </time>
            ) : (
              <span className="tcl-data-status-bar__fresh">{updatedLabel}</span>
            ))}
        </span>

        {metrics && metrics.length > 0 && (
          <ul className="tcl-data-status-bar__metrics">
            {metrics.map((m, i) => (
              <li className="tcl-data-status-bar__metric" key={m.id ?? `m${i}`}>
                <span className="tcl-data-status-bar__metric-value">{m.value}</span>{' '}
                <span className="tcl-data-status-bar__metric-label">{m.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(hasFilters || onRefresh) && (
        <div className="tcl-data-status-bar__controls">
          {filters && filters.length > 0 && (
            <ul className="tcl-data-status-bar__filters" aria-label="Active filters">
              {filters.map((f, i) => {
                const id = f.id ?? `f${i}`;
                const tone = f.tone ?? 'neutral';
                return (
                  <li
                    className={cx(
                      'tcl-data-status-bar__chip',
                      `tcl-data-status-bar__chip--${tone}`,
                    )}
                    key={id}
                  >
                    <span className="tcl-data-status-bar__chip-label">{f.label}</span>
                    <span className="tcl-data-status-bar__chip-value">{f.value}</span>
                    {onRemoveFilter && (
                      <button
                        type="button"
                        className="tcl-data-status-bar__chip-remove"
                        aria-label={removeFilterLabel(f)}
                        onClick={() => onRemoveFilter(id, f)}
                      >
                        <span aria-hidden="true">✕</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {onRefresh && (
            <button
              type="button"
              className="tcl-data-status-bar__refresh"
              onClick={onRefresh}
              disabled={loading}
              aria-busy={loading || undefined}
            >
              <span className="tcl-data-status-bar__refresh-icon" aria-hidden="true">
                ⟳
              </span>
              {refreshLabel}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
