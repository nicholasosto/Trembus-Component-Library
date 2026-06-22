import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import './EmptyState.css';

/**
 * `EmptyState` — the deliberate "nothing here (yet)" placeholder: no data, an
 * awaiting/unexposed source, or a pending work-start confirmation (the PMO
 * pending tile). A glyph + title + description orient the reader; an optional
 * mono "pending source" chip names the missing feed, and an optional action slot
 * offers the next step. Distinct from `Skeleton`, which represents content that
 * is *loading*; an EmptyState represents content that is genuinely absent.
 */
export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Leading glyph/illustration; defaults to an empty-set mark. Pass `null` to hide. */
  icon?: ReactNode;
  /** Headline naming what's missing. */
  title: ReactNode;
  /** Supporting line(s) explaining why / what to do. */
  description?: ReactNode;
  /** Mono code chip naming a data source that isn't exposed yet (e.g. `wsc.pending`). */
  pendingSource?: string;
  /** Optional status pill (e.g. a `<Badge>`Awaiting WSC`</Badge>`). */
  badge?: ReactNode;
  /** Optional call-to-action (e.g. a `<Button>`). */
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  pendingSource,
  badge,
  action,
  className,
  ...rest
}: EmptyStateProps) {
  // `icon === undefined` → default glyph; `icon === null`/false → hidden.
  const glyph = icon === undefined ? '∅' : icon;
  return (
    <div className={cx('tcl-empty', className)} {...rest}>
      {badge && <span className="tcl-empty__badge">{badge}</span>}
      {glyph != null && glyph !== false && (
        <span className="tcl-empty__icon" aria-hidden="true">
          {glyph}
        </span>
      )}
      <p className="tcl-empty__title">{title}</p>
      {description != null && description !== false && (
        <p className="tcl-empty__description">{description}</p>
      )}
      {pendingSource && (
        <p className="tcl-empty__pending">
          Source not yet exposed: <code className="tcl-empty__source">{pendingSource}</code>
        </p>
      )}
      {action && <div className="tcl-empty__action">{action}</div>}
    </div>
  );
}
