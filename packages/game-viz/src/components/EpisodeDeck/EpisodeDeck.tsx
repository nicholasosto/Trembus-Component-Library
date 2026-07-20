import { useState } from 'react';
import { cx } from '../../internal/cx';
import { vars } from '../../internal/vars';
import './EpisodeDeck.css';

/**
 * `EpisodeDeck` — a roman-numeral chapter/episode list in the Trembus
 * liturgical-gothic idiom: each episode is a focusable row showing its numeral,
 * title, code (S01 · EP 01), and release state (Watch / Now streaming / a locked
 * release date). It is the Hub/RunHistory interaction spine: controlled or
 * uncontrolled `selectedId` (+ `defaultSelectedId` + `onSelect`), and selecting a
 * row announces it in an `aria-live` inspector.
 *
 * Theatrical surface, accessible spine: each row is a real HTML `<button>` whose
 * accessible name encodes numeral + title + code + state (the visible glyphs are
 * `aria-hidden` so the name is read once, cleanly); tone-coding always pairs with
 * a word. Lead job is afford-action.
 */
export type EpisodeState = 'available' | 'streaming' | 'locked';
export type EpisodeDeckTone = 'accent' | 'danger' | 'info' | 'success' | 'warning';

export interface Episode {
  /** Stable id for selection; falls back to a collision-proof synthetic id (`ep${i}`). */
  id?: string;
  /** Index glyph; if omitted a Roman numeral is derived from position. */
  numeral?: string;
  /** Episode title, e.g. "THE INVOCATION". */
  title: string;
  /** Sub-code, e.g. "S01 · EP 01". */
  code?: string;
  /** Release state (default `available`). */
  state?: EpisodeState;
  /** For `locked` episodes, the release date label, e.g. "APR 26". */
  releaseAt?: string;
  /** Optional synopsis surfaced in the inspector on selection. */
  synopsis?: string;
}

export interface EpisodeDeckContract {
  view?: 'episode-deck';
  /** Masthead eyebrow above the title, e.g. "The Reliquary". */
  brand?: string;
  /** Mono code line in the masthead, e.g. "SEASON I". */
  code?: string;
  /** Deck heading; also the accessible name of the episode group. */
  title?: string;
  /** Support line beneath the heading. */
  caption?: string;
  /** The episodes, in airing order (missing numerals derive from position). */
  episodes: Episode[];
}

export interface EpisodeDeckProps {
  /** The deck contract — masthead + episodes. */
  data: EpisodeDeckContract;
  /** Controlled selected episode id. */
  selectedId?: string;
  /** Uncontrolled initial selection. */
  defaultSelectedId?: string;
  /** Called with the episode id when a row is selected. */
  onSelect?: (id: string) => void;
  /** Accent tone for selection + the streaming pulse (default `accent`). */
  tone?: EpisodeDeckTone;
  className?: string;
}

const TONE_VAR: Record<EpisodeDeckTone, string> = {
  accent: 'var(--tcl-accent)',
  danger: 'var(--tcl-status-danger)',
  info: 'var(--tcl-status-info)',
  success: 'var(--tcl-status-success)',
  warning: 'var(--tcl-status-warning)',
};

// Tone painted as TEXT (the "Watch"/"Now streaming" word, the header code) must
// stay legible: gold (`accent`) as text fails AA on a light surface, so accent
// text falls back to --tcl-text (the Badge precedent). The selection rail, the
// numeral, and tints keep the full tone via TONE_VAR.
const TONE_TEXT: Record<EpisodeDeckTone, string> = { ...TONE_VAR, accent: 'var(--tcl-text)' };

const ROMAN: ReadonlyArray<readonly [number, string]> = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];
function toRoman(n: number): string {
  let out = '';
  let v = n;
  for (const [val, sym] of ROMAN) {
    while (v >= val) {
      out += sym;
      v -= val;
    }
  }
  return out || '—';
}

const STATE_WORD: Record<EpisodeState, string> = {
  available: 'Watch',
  streaming: 'Now streaming',
  locked: 'Locked',
};

export function EpisodeDeck({
  data,
  selectedId: selProp,
  defaultSelectedId,
  onSelect,
  tone = 'accent',
  className,
}: EpisodeDeckProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultSelectedId);
  const selectedId = selProp ?? internal;
  const select = (id: string): void => {
    if (selProp === undefined) setInternal(id);
    onSelect?.(id);
  };

  const episodes = data.episodes ?? [];
  // Resolve a stable, collision-proof id per row (the recurring viz datum-id
  // gotcha): a duplicate EXPLICIT id is dropped (first wins) so two rows can't
  // share a selection ring or a React key; a MISSING id gets a synthetic one,
  // suffixed until it can't collide with an explicit id. Numerals on derived
  // rows count the surviving rows (no gaps).
  const rows: Array<{ ep: Episode; id: string; numeral: string }> = [];
  const seenIds = new Set<string>();
  for (let i = 0; i < episodes.length; i++) {
    const ep = episodes[i];
    let id: string;
    if (ep.id) {
      if (seenIds.has(ep.id)) continue; // explicit duplicate → first wins
      id = ep.id;
    } else {
      id = `ep${i}`;
      let n = i;
      while (seenIds.has(id)) id = `ep${i}_${++n}`;
    }
    seenIds.add(id);
    rows.push({ ep, id, numeral: ep.numeral ?? toRoman(rows.length + 1) });
  }
  const selected = rows.find((r) => r.id === selectedId);
  const hasHeader = Boolean(data.title || data.caption || data.brand || data.code);

  return (
    <div
      className={cx('tcl-episode-deck', className)}
      style={vars({ '--deck-tone': TONE_VAR[tone], '--deck-tone-text': TONE_TEXT[tone] })}
    >
      {hasHeader && (
        <header className="tcl-episode-deck__header">
          {data.brand && <p className="tcl-episode-deck__brand">{data.brand}</p>}
          {data.code && <p className="tcl-episode-deck__code">{data.code}</p>}
          {data.title && <p className="tcl-episode-deck__title">{data.title}</p>}
          {data.caption && <p className="tcl-episode-deck__caption">{data.caption}</p>}
        </header>
      )}

      <div
        className="tcl-episode-deck__list"
        role="group"
        aria-label={data.title ?? 'Episode deck'}
      >
        {rows.map(({ ep, id, numeral }) => {
          const state = ep.state ?? 'available';
          const isSelected = id === selectedId;
          const trailing =
            state === 'locked' ? (ep.releaseAt ?? STATE_WORD.locked) : STATE_WORD[state];
          const stateName =
            state === 'locked'
              ? ep.releaseAt
                ? `locked, releases ${ep.releaseAt}`
                : 'locked'
              : STATE_WORD[state];
          const name = `${numeral}. ${ep.title}${ep.code ? `, ${ep.code}` : ''}, ${stateName}`;
          return (
            <button
              key={id}
              type="button"
              className={cx('tcl-episode-deck__row', `is-${state}`, isSelected && 'is-selected')}
              aria-pressed={isSelected}
              aria-label={name}
              onClick={() => select(id)}
            >
              <span className="tcl-episode-deck__numeral" aria-hidden="true">
                {numeral}
              </span>
              <span className="tcl-episode-deck__main">
                <span className="tcl-episode-deck__row-title" aria-hidden="true">
                  {ep.title}
                </span>
                {ep.code && (
                  <span className="tcl-episode-deck__row-code" aria-hidden="true">
                    {ep.code}
                  </span>
                )}
              </span>
              <span className={cx('tcl-episode-deck__state', `is-${state}`)} aria-hidden="true">
                {state === 'streaming' && <span className="tcl-episode-deck__pulse" />}
                {trailing}
              </span>
            </button>
          );
        })}
      </div>

      <div className="tcl-episode-deck__inspector" aria-live="polite">
        {selected ? (
          <p className="tcl-episode-deck__inspector-text">
            <span className="tcl-episode-deck__inspector-ep">
              {selected.numeral} · {selected.ep.title}
            </span>
            {selected.ep.synopsis && (
              <span className="tcl-episode-deck__inspector-syn"> — {selected.ep.synopsis}</span>
            )}
          </p>
        ) : (
          <p className="tcl-episode-deck__inspector-hint">Select an episode to inspect it.</p>
        )}
      </div>
    </div>
  );
}
