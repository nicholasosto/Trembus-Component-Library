import type { ReactNode } from 'react';
import { Inline, Pressable, Stack } from '@trembus/ui';
import { cx } from '../../internal/cx';
import { vars } from '../../internal/vars';
import './CinematicHero.css';

/**
 * `CinematicHero` — the landing title plate in the Trembus liturgical-gothic
 * idiom: a kicker (format · episodes · season), a giant fill+outline display
 * title, an italic tagline with one accent highlight, a call-to-action row, and a
 * row of accolades. One authored `CinematicHeroContract` drives it.
 *
 * Theatrical surface, accessible spine: the title lines are real text (the
 * outlined line is `-webkit-text-stroke`, still readable), decorative glyphs are
 * `aria-hidden`, the CTAs are real focusable controls — buttons via the
 * @trembus/ui `Pressable` affordance primitive, or `<a>` when an `href` is given —
 * and any glow honors `prefers-reduced-motion`. Lead job is reveal-state.
 */
export type CinematicHeroTone = 'accent' | 'danger' | 'info' | 'success' | 'warning';

export interface HeroTitleLine {
  text: string;
  /** Render as an outlined (stroked) line instead of a solid fill. */
  outline?: boolean;
}

export interface HeroAction {
  label: string;
  /** When set the action is a real `<a href>`; omit for a button (`onPress`). */
  href?: string;
  /** Trailing meta inside the control, e.g. "2:14 · trailer". */
  meta?: string;
  /** Visual weight (default `primary`). */
  variant?: 'primary' | 'secondary';
  /** Decorative leading glyph (aria-hidden), e.g. "▶". */
  icon?: ReactNode;
  /** Button press handler (ignored when `href` is set). */
  onPress?: () => void;
}

export interface HeroAccolade {
  /** Headline value, e.g. "IX · X", "★★★★★", "UNHOLY". */
  value: string;
  /** Attribution, e.g. "THE RELIQUARY". */
  source?: string;
}

export interface CinematicHeroContract {
  view?: 'cinematic-hero';
  /** Eyebrow line, e.g. "AN ANIMATED LITURGY · VI EPISODES · AUTUMN MMXXVI". */
  kicker?: string;
  /** Display title — a string, or lines (some `outline`d) for the fill+outline treatment. */
  title: string | HeroTitleLine[];
  /** Italic tagline. */
  tagline?: string;
  /** A substring of `tagline` to render in the accent tone. */
  highlight?: string;
  /** Call-to-action row. */
  actions?: HeroAction[];
  /** Accolade row. */
  accolades?: HeroAccolade[];
  /** Accent tone — outline stroke, highlight, primary CTA, kicker dot (default `accent`). */
  tone?: CinematicHeroTone;
}

export interface CinematicHeroProps {
  /** The hero contract — `title` is the only required field. */
  data: CinematicHeroContract;
  className?: string;
}

const TONE_VAR: Record<CinematicHeroTone, string> = {
  accent: 'var(--tcl-accent)',
  danger: 'var(--tcl-status-danger)',
  info: 'var(--tcl-status-info)',
  success: 'var(--tcl-status-success)',
  warning: 'var(--tcl-status-warning)',
};
const TONE_FG: Record<CinematicHeroTone, string> = {
  accent: 'var(--tcl-accent-fg)',
  danger: 'var(--tcl-status-danger-fg)',
  info: 'var(--tcl-status-info-fg)',
  success: 'var(--tcl-status-success-fg)',
  warning: 'var(--tcl-status-warning-fg)',
};
// Tone painted as TEXT (the tagline highlight) must stay legible: gold (`accent`)
// as text fails AA on a light surface, so accent text falls back to --tcl-text
// (the Badge precedent). The outline stroke + kicker dot keep the full tone.
const TONE_TEXT: Record<CinematicHeroTone, string> = { ...TONE_VAR, accent: 'var(--tcl-text)' };

function renderTagline(text: string, highlight?: string): ReactNode {
  if (!highlight) return text;
  const idx = text.indexOf(highlight);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="tcl-cinematic-hero__hl">{highlight}</span>
      {text.slice(idx + highlight.length)}
    </>
  );
}

function HeroCta({ action }: { action: HeroAction }) {
  const cls = cx('tcl-cinematic-hero__cta', `is-${action.variant ?? 'primary'}`);
  const inner = (
    <>
      {action.icon != null && (
        <span className="tcl-cinematic-hero__cta-icon" aria-hidden="true">
          {action.icon}
        </span>
      )}
      <span className="tcl-cinematic-hero__cta-label">{action.label}</span>
      {action.meta != null && <span className="tcl-cinematic-hero__cta-meta">{action.meta}</span>}
    </>
  );
  if (action.href != null) {
    return (
      <a className={cls} href={action.href}>
        {inner}
      </a>
    );
  }
  return (
    <Pressable className={cls} onPress={action.onPress}>
      {inner}
    </Pressable>
  );
}

export function CinematicHero({ data, className }: CinematicHeroProps) {
  const { kicker, title, tagline, highlight, actions, accolades, tone = 'accent' } = data;
  const lines: HeroTitleLine[] = typeof title === 'string' ? [{ text: title }] : title;
  const hasActions = Array.isArray(actions) && actions.length > 0;
  const hasAccolades = Array.isArray(accolades) && accolades.length > 0;

  return (
    <section
      className={cx('tcl-cinematic-hero', className)}
      style={vars({
        '--hero-tone': TONE_VAR[tone],
        '--hero-fg': TONE_FG[tone],
        '--hero-tone-text': TONE_TEXT[tone],
      })}
    >
      <Stack gap={5}>
        {kicker != null && (
          <p className="tcl-cinematic-hero__kicker">
            <span className="tcl-cinematic-hero__kicker-dot" aria-hidden="true" />
            {kicker}
          </p>
        )}

        <h1 className="tcl-cinematic-hero__title">
          {lines.map((line, i) => (
            <span
              key={`${i}-${line.text}`}
              className={cx('tcl-cinematic-hero__title-line', line.outline && 'is-outline')}
            >
              {line.text}
            </span>
          ))}
        </h1>

        {tagline != null && (
          <p className="tcl-cinematic-hero__tagline">{renderTagline(tagline, highlight)}</p>
        )}

        {hasActions && (
          <Inline gap={3} wrap align="center" className="tcl-cinematic-hero__ctas">
            {actions.map((a, i) => (
              <HeroCta key={`${i}-${a.label}`} action={a} />
            ))}
          </Inline>
        )}

        {hasAccolades && (
          <Inline gap={6} wrap className="tcl-cinematic-hero__accolades">
            {accolades.map((a, i) => (
              <span className="tcl-cinematic-hero__accolade" key={`${i}-${a.value}`}>
                <span className="tcl-cinematic-hero__accolade-value">{a.value}</span>
                {a.source != null && (
                  <span className="tcl-cinematic-hero__accolade-source">— {a.source}</span>
                )}
              </span>
            ))}
          </Inline>
        )}
      </Stack>
    </section>
  );
}
