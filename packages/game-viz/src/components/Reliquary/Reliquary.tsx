import type { ReactNode } from 'react';
import { cx } from '../../internal/cx';
import { vars } from '../../internal/vars';
import './Reliquary.css';

/**
 * `Reliquary` — the signature game-viz HUD frame: a bracket-cornered "reliquary"
 * that frames a portrait, card, or media block in the Trembus liturgical-gothic
 * idiom. A mono **label** (top-left) and **tag** (top-right) name the subject; a
 * row of tone-coded **status** readouts (e.g. integrity %, containment state)
 * report its operational state.
 *
 * Theatrical surface, accessible spine: the corner reticle is decorative
 * (`aria-hidden`), the label/tag/status are real perceivable text (the meaning is
 * in the WORDS, never the color alone), and the frame itself affords nothing — it
 * frames content that may. So afford/acknowledge are declared **presentational**
 * (the Badge/Skeleton precedent); lead job is reveal-state. Pass `aria-label` to
 * turn the framed content into a labelled `group` for assistive tech.
 */
export type ReliquaryStatusTone = 'accent' | 'danger' | 'success' | 'warning' | 'info' | 'neutral';

export interface ReliquaryStatus {
  /** Tone-coded readout text — keep the meaning in the words, e.g. "SOUL INTEGRITY — 34.7%". */
  label: string;
  /** Tone of the readout strip (default `neutral`). */
  tone?: ReliquaryStatusTone;
}

export interface ReliquaryProps {
  /** Top-left label tab, e.g. "SUBJECT · 001". */
  label?: ReactNode;
  /** Top-right tag tab, e.g. "THE KEPT KNIGHT". */
  tag?: ReactNode;
  /** Bottom status strips, each tone-coded. */
  status?: ReliquaryStatus[];
  /** Frame accent tone — drives the corner reticle + label tab (default `accent`). */
  tone?: ReliquaryStatusTone;
  /** When set, the framed content becomes a labelled `group` for assistive tech. */
  'aria-label'?: string;
  className?: string;
  children?: ReactNode;
}

const TONE_VAR: Record<ReliquaryStatusTone, string> = {
  accent: 'var(--tcl-accent)',
  danger: 'var(--tcl-status-danger)',
  success: 'var(--tcl-status-success)',
  warning: 'var(--tcl-status-warning)',
  info: 'var(--tcl-status-info)',
  neutral: 'var(--tcl-text-dim)',
};

// A tone painted as TEXT must stay legible: gold (`accent`) as text fails AA on a
// light surface (~1.8:1), so accent text falls back to --tcl-text — the same
// exception @trembus/ui's Badge makes. Decorative tone uses (corner reticle,
// borders, tints) keep the full tone via TONE_VAR.
const TONE_TEXT: Record<ReliquaryStatusTone, string> = { ...TONE_VAR, accent: 'var(--tcl-text)' };

export function Reliquary({
  label,
  tag,
  status,
  tone = 'accent',
  className,
  children,
  'aria-label': ariaLabel,
}: ReliquaryProps) {
  const hasStatus = Array.isArray(status) && status.length > 0;
  return (
    <div
      className={cx('tcl-reliquary', className)}
      style={vars({ '--rlq-tone': TONE_VAR[tone], '--rlq-tone-text': TONE_TEXT[tone] })}
      {...(ariaLabel ? { role: 'group', 'aria-label': ariaLabel } : {})}
    >
      {/* decorative corner reticle — geometry only, kept out of the a11y tree */}
      <span className="tcl-reliquary__bracket is-tl" aria-hidden="true" />
      <span className="tcl-reliquary__bracket is-tr" aria-hidden="true" />
      <span className="tcl-reliquary__bracket is-bl" aria-hidden="true" />
      <span className="tcl-reliquary__bracket is-br" aria-hidden="true" />

      {(label != null || tag != null) && (
        <div className="tcl-reliquary__tabs">
          {label != null && <span className="tcl-reliquary__tab is-label">{label}</span>}
          {tag != null && <span className="tcl-reliquary__tab is-tag">{tag}</span>}
        </div>
      )}

      <div className="tcl-reliquary__body">{children}</div>

      {hasStatus && (
        <div className="tcl-reliquary__status">
          {status.map((s, i) => (
            <span
              key={`${i}-${s.label}`}
              className="tcl-reliquary__readout"
              style={vars({
                '--rlq-readout': TONE_VAR[s.tone ?? 'neutral'],
                '--rlq-readout-text': TONE_TEXT[s.tone ?? 'neutral'],
              })}
            >
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
