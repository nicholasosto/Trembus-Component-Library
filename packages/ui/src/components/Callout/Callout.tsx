import type { HTMLAttributes, ReactNode } from 'react';
import type { StatusTone } from '../../tokens/tokens.types';
import { cx } from '../../utils/cx';
import './Callout.css';

/**
 * `Callout` — a tone-tinted banner that draws the eye to a contextual message
 * (info / success / warning / danger / neutral / accent). It pairs the color-coded
 * ontology (like `Badge`) with a raised, padded surface (like `Card`): a left
 * accent rail + tone icon reveal the status, while the body can carry inline
 * `<code>` and links. When `onDismiss` is set it gains a close button — the
 * afford/acknowledge jobs.
 */
export type CalloutTone = StatusTone | 'accent';

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Status/intent — the color-coded ontology (default `info`). */
  tone?: CalloutTone;
  /** Bold lead line above the body. */
  title?: ReactNode;
  /** Leading glyph; defaults to a per-tone icon. Pass `null` to hide it. */
  icon?: ReactNode;
  /** When set, renders a close button that calls this on click. */
  onDismiss?: () => void;
  /** Accessible name for the dismiss button (default "Dismiss"). */
  dismissLabel?: string;
  children?: ReactNode;
}

const DEFAULT_ICON: Record<CalloutTone, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  danger: '⚠',
  neutral: 'ℹ',
  accent: 'ℹ',
};

export function Callout({
  tone = 'info',
  title,
  icon,
  onDismiss,
  dismissLabel = 'Dismiss',
  className,
  children,
  ...rest
}: CalloutProps) {
  // `icon === undefined` → default glyph; `icon === null`/false → hidden.
  const glyph = icon === undefined ? DEFAULT_ICON[tone] : icon;
  return (
    <div className={cx('tcl-callout', `tcl-callout--${tone}`, className)} {...rest}>
      {glyph != null && glyph !== false && (
        <span className="tcl-callout__icon" aria-hidden="true">
          {glyph}
        </span>
      )}
      <div className="tcl-callout__content">
        {title != null && title !== false && <p className="tcl-callout__title">{title}</p>}
        {children != null && children !== false && (
          <div className="tcl-callout__body">{children}</div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          className="tcl-callout__dismiss"
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </div>
  );
}
