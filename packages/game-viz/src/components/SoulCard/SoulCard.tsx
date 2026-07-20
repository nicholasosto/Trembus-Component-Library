import { useState } from 'react';
import { Inline, Stack } from '@trembus/ui';
import { cx } from '../../internal/cx';
import { vars } from '../../internal/vars';
import './SoulCard.css';

/**
 * `SoulCard` — a character dossier in the Trembus liturgical-gothic idiom: an
 * eyebrow index + tone-coded state tag, a portrait, a display-serif name and
 * epithet, a definition list of stat rows (House / Bound Epoch / Integrity /
 * Weapon …), a bio, and a pull-quote. One authored `SoulCardContract` renders it.
 *
 * Optional **flip**: supply a `back` and the card gains a 3D click-to-flip
 * revealing a reverse face (extended lore, abilities, a spoiler). Theatrical
 * surface, accessible spine: the flip is a real focusable control (`aria-pressed`,
 * keyboard), the hidden face is `inert` so a screen reader never reads both at
 * once, and the spin honors `prefers-reduced-motion`. Without a `back` the card is
 * the static dossier it always was. Composes @trembus/ui primitives (Stack/Inline)
 * for layout; tone-coding always pairs with a word, never color alone.
 */
export type SoulCardTone = 'accent' | 'danger' | 'success' | 'warning' | 'info' | 'neutral';

export interface SoulStat {
  /** Row label, e.g. "HOUSE". */
  label: string;
  /** Row value, e.g. "Coven of the Cold Coast". */
  value: string;
}

/** The reverse face — author whatever the flip should reveal. */
export interface SoulCardBack {
  /** Reverse heading (display serif); defaults to the card name. */
  heading?: string;
  /** Free-text lore / abilities paragraph. */
  body?: string;
  /** Labeled rows (abilities, rites, wards…), same shape as the front stats. */
  items?: SoulStat[];
  /** A pull-quote on the reverse. */
  quote?: string;
}

export interface SoulCardContract {
  view?: 'soul-card';
  /** Eyebrow index, top-left, e.g. "SOUL · IV". */
  index?: string;
  /** State tag, top-right, e.g. "UNBOUND". */
  state?: string;
  /** Tone of the state tag (default `danger`). */
  stateTone?: SoulCardTone;
  /** Portrait image src; omit for a recessed placeholder plate. */
  portrait?: string;
  /** Portrait alt text. Omit/empty → the image is treated as decorative. */
  portraitAlt?: string;
  /** Display name, e.g. "MARA OF THE SALT". */
  name: string;
  /** Epithet line, e.g. "Saltwitch, Thirteenth of her Line". */
  epithet?: string;
  /** Stat rows. */
  stats?: SoulStat[];
  /** Free-text bio. */
  description?: string;
  /** Pull-quote rendered as a bordered blockquote. */
  quote?: string;
  /** Reverse face — supplying it makes the card flippable. */
  back?: SoulCardBack;
  /** Accent tone — epithet + quote rule + portrait bloom (default `danger`). */
  tone?: SoulCardTone;
}

export interface SoulCardProps {
  /** The dossier contract — `name` is the only required field. */
  data: SoulCardContract;
  /** Controlled flip state (only meaningful when `data.back` is set). */
  flipped?: boolean;
  /** Uncontrolled initial flip state. */
  defaultFlipped?: boolean;
  /** Called when the flip control toggles the card. */
  onFlip?: (flipped: boolean) => void;
  className?: string;
}

const TONE_VAR: Record<SoulCardTone, string> = {
  accent: 'var(--tcl-accent)',
  danger: 'var(--tcl-status-danger)',
  success: 'var(--tcl-status-success)',
  warning: 'var(--tcl-status-warning)',
  info: 'var(--tcl-status-info)',
  neutral: 'var(--tcl-text-dim)',
};

// Tone painted as TEXT (epithet, state tag) must stay legible: gold (`accent`) as
// text fails AA on a light surface, so accent text falls back to --tcl-text (the
// Badge precedent). Decorative tone uses (quote rule, portrait bloom) keep the
// full tone via TONE_VAR.
const TONE_TEXT: Record<SoulCardTone, string> = { ...TONE_VAR, accent: 'var(--tcl-text)' };

function StatRows({ items }: { items: SoulStat[] }) {
  return (
    <dl className="tcl-soul-card__stats">
      {items.map((s, i) => (
        <div className="tcl-soul-card__stat" key={`${i}-${s.label}`}>
          <dt className="tcl-soul-card__stat-label">{s.label}</dt>
          <dd className="tcl-soul-card__stat-value">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SoulCard({
  data,
  flipped: flipProp,
  defaultFlipped,
  onFlip,
  className,
}: SoulCardProps) {
  const {
    index,
    state,
    stateTone = 'danger',
    portrait,
    portraitAlt,
    name,
    epithet,
    stats,
    description,
    quote,
    back,
    tone = 'danger',
  } = data;
  const hasStats = Array.isArray(stats) && stats.length > 0;
  const flippable = back != null;

  const [internalFlipped, setInternalFlipped] = useState(defaultFlipped ?? false);
  const flipped = flippable ? (flipProp ?? internalFlipped) : false;
  const toggleFlip = (): void => {
    const next = !flipped;
    if (flipProp === undefined) setInternalFlipped(next);
    onFlip?.(next);
  };

  return (
    <article
      className={cx('tcl-soul-card', flippable && 'is-flippable', className)}
      style={vars({ '--soul-tone': TONE_VAR[tone], '--soul-tone-text': TONE_TEXT[tone] })}
      data-flipped={flippable && flipped ? '' : undefined}
    >
      <div className="tcl-soul-card__flipper">
        {/* ── FRONT (the dossier, unchanged) ── */}
        <div
          className="tcl-soul-card__face is-front"
          inert={flippable && flipped ? true : undefined}
        >
          {(index != null || state != null) && (
            <Inline justify="between" align="center" gap={3} className="tcl-soul-card__head">
              <span className="tcl-soul-card__index">{index}</span>
              {state != null && (
                <span
                  className="tcl-soul-card__state"
                  style={vars({ '--soul-state': TONE_TEXT[stateTone] })}
                >
                  {state}
                </span>
              )}
            </Inline>
          )}

          {portrait != null ? (
            <img className="tcl-soul-card__portrait" src={portrait} alt={portraitAlt ?? ''} />
          ) : (
            <div className="tcl-soul-card__portrait is-empty" aria-hidden="true" />
          )}

          <Stack gap={1} className="tcl-soul-card__id">
            <h3 className="tcl-soul-card__name">{name}</h3>
            {epithet != null && <p className="tcl-soul-card__epithet">{epithet}</p>}
          </Stack>

          {hasStats && <StatRows items={stats} />}

          {description != null && <p className="tcl-soul-card__desc">{description}</p>}

          {quote != null && <blockquote className="tcl-soul-card__quote">{quote}</blockquote>}
        </div>

        {/* ── BACK (the reverse, only when authored) ── */}
        {flippable && (
          <div className="tcl-soul-card__face is-back" inert={flipped ? undefined : true}>
            {index != null && <span className="tcl-soul-card__index">{index}</span>}
            <h3 className="tcl-soul-card__name">{back.heading ?? name}</h3>
            {back.body != null && <p className="tcl-soul-card__desc">{back.body}</p>}
            {back.items != null && back.items.length > 0 && <StatRows items={back.items} />}
            {back.quote != null && (
              <blockquote className="tcl-soul-card__quote">{back.quote}</blockquote>
            )}
          </div>
        )}
      </div>

      {flippable && (
        <button
          type="button"
          className="tcl-soul-card__flip"
          aria-pressed={flipped}
          aria-label={flipped ? `Show the front of ${name}` : `Show the reverse of ${name}`}
          onClick={toggleFlip}
        >
          <span aria-hidden="true">⟲</span>
        </button>
      )}
    </article>
  );
}
