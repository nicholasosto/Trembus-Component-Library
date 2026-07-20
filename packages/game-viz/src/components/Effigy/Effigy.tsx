import { useEffect, useRef, useState } from 'react';
import type { ModelViewerElement } from '../../model-viewer';
import { cx } from '../../internal/cx';
import { vars } from '../../internal/vars';
import './Effigy.css';

/**
 * `Effigy` — a 3D model thumbnail in the Trembus liturgical-gothic idiom: a
 * bracket-cornered reliquary stage framing an interactive glTF/GLB model (Google
 * `<model-viewer>`), a mono index tab, and a display-serif caption. One authored
 * `EffigyContract` renders it.
 *
 * Theatrical surface, accessible spine:
 * - the model carries `alt` as its accessible name (WCAG 1.1.1, the non-text
 *   alternative); model-viewer also manages the canvas's own keyboard a11y;
 * - the corner reticle + poster plate are decorative (`aria-hidden`);
 * - load / error is announced through an `aria-live` region (the viz-inspector
 *   precedent);
 * - idle auto-rotation is gated by `prefers-reduced-motion` AND a real focusable
 *   pause control (WCAG 2.2.2 — motion that starts automatically must be
 *   pausable);
 * - "View in your space" (AR) is a real `<button>` slotted into model-viewer.
 *
 * The ~300KB model-viewer/three.js runtime is **lazy-loaded** on mount. With
 * `reveal: 'interaction'` (the default when a poster is set) the model itself is
 * not fetched until the visitor clicks the poster — so a wall of Effigies costs
 * one poster image each until engaged. `reveal: 'auto'` fetches it lazily when the
 * stage nears the viewport instead.
 */
export type EffigyTone = 'accent' | 'danger' | 'success' | 'warning' | 'info' | 'neutral';

export interface EffigyContract {
  view?: 'effigy';
  /** glTF / GLB model URL. */
  src: string;
  /** Accessible name for the model — REQUIRED (WCAG 1.1.1, the non-text alternative). */
  alt: string;
  /** Poster image shown until the model is revealed; omit for a recessed placeholder plate. */
  poster?: string;
  /** Mono eyebrow index, top-left, e.g. "RELIC · 003". */
  index?: string;
  /** Display-serif caption beneath the stage. */
  caption?: string;
  /** When to fetch the model (default `lazy` — near the viewport). */
  loading?: 'auto' | 'lazy' | 'eager';
  /**
   * When to reveal the model (default `interaction` when a poster is set, else
   * `auto`). `interaction` defers the model download until the visitor clicks the
   * poster (a real "Load 3D" button); `auto` fetches it as the stage nears view.
   */
  reveal?: 'auto' | 'interaction';
  /** Allow orbit + zoom (default `true`). */
  cameraControls?: boolean;
  /** Idle auto-rotation — gated by reduced-motion + the pause control (default `false`). */
  autoRotate?: boolean;
  /** Offer AR ("View in your space") on supported devices (default `false`). */
  ar?: boolean;
  /** Lighting environment image (HDR / UltraHDR), or the keyword `neutral`. */
  environmentImage?: string;
  /** Accent tone — corner reticle, index tab, caption rule (default `accent`). */
  tone?: EffigyTone;
}

export interface EffigyProps {
  /** The relic contract — `src` and `alt` are the only required fields. */
  data: EffigyContract;
  /** Stage aspect ratio (any CSS `aspect-ratio` value). Default `'1 / 1'`. */
  ratio?: string;
  className?: string;
}

const TONE_VAR: Record<EffigyTone, string> = {
  accent: 'var(--tcl-accent)',
  danger: 'var(--tcl-status-danger)',
  success: 'var(--tcl-status-success)',
  warning: 'var(--tcl-status-warning)',
  info: 'var(--tcl-status-info)',
  neutral: 'var(--tcl-text-dim)',
};

// A tone painted as TEXT must stay legible: gold (`accent`) as text fails AA on a
// light surface (~1.8:1), so accent text falls back to --tcl-text (the Badge /
// Reliquary precedent). Decorative tone uses (reticle, rules, tints) keep the
// full tone via TONE_VAR.
const TONE_TEXT: Record<EffigyTone, string> = { ...TONE_VAR, accent: 'var(--tcl-text)' };

/** `prefers-reduced-motion`, read synchronously on first render then kept live. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (): void => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function Effigy({ data, ratio = '1 / 1', className }: EffigyProps) {
  const {
    src,
    alt,
    poster,
    index,
    caption,
    loading = 'lazy',
    reveal,
    cameraControls = true,
    autoRotate = false,
    ar = false,
    environmentImage,
    tone = 'accent',
  } = data;

  const ref = useRef<ModelViewerElement>(null);
  const [status, setStatus] = useState<'idle' | 'loaded' | 'error'>('idle');
  const [revealed, setRevealed] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const canRotate = autoRotate && !reducedMotion;
  const [rotating, setRotating] = useState(true);
  const isRotating = canRotate && rotating;

  // `interaction` (defer the download until a click) only makes sense behind a
  // poster; without one, reveal automatically. model-viewer 4.x has no
  // `reveal="interaction"`, so interaction = `reveal="manual"` + dismissPoster().
  const revealMode = reveal ?? (poster != null ? 'interaction' : 'auto');
  const useInteraction = revealMode === 'interaction' && poster != null;
  const elementReveal = useInteraction ? 'manual' : 'auto';
  const showLoadButton = useInteraction && !revealed && status !== 'loaded';

  // Lazy-load the model-viewer / three.js runtime (~300KB) only in the browser.
  // If it never registers (network / CSP), surface the fault rather than idling.
  useEffect(() => {
    if (typeof window === 'undefined' || !('customElements' in window)) return;
    void import('@google/model-viewer').catch(() => {
      if (window.customElements.get('model-viewer') == null) setStatus('error');
    });
  }, []);

  // model-viewer dispatches CustomEvents `load` / `error` ON the element; bridge
  // them to the aria-live announcement. Guard on target so a child resource event
  // (e.g. a poster <img>) can't be mistaken for a model load failure.
  useEffect(() => {
    const el = ref.current;
    if (el == null) return;
    const onLoad = (e: Event): void => {
      if (e.target === el) setStatus('loaded');
    };
    const onError = (e: Event): void => {
      if (e.target === el) setStatus('error');
    };
    el.addEventListener('load', onLoad);
    el.addEventListener('error', onError);
    return () => {
      el.removeEventListener('load', onLoad);
      el.removeEventListener('error', onError);
    };
  }, []);

  const revealModel = (): void => {
    setRevealed(true);
    ref.current?.dismissPoster?.();
    ref.current?.focus?.(); // keep focus in the component as the load button unmounts
  };

  const liveText =
    status === 'loaded'
      ? `${alt} — model loaded`
      : status === 'error'
        ? `${alt} — could not load the model`
        : '';

  const posterInner =
    poster != null ? (
      <img className="tcl-effigy__poster-img" src={poster} alt="" loading="lazy" decoding="async" />
    ) : (
      <span className="tcl-effigy__poster-glyph" />
    );

  return (
    <figure
      className={cx('tcl-effigy', className)}
      style={vars({
        '--effigy-tone': TONE_VAR[tone],
        '--effigy-tone-text': TONE_TEXT[tone],
        '--effigy-ratio': ratio,
      })}
      data-status={status}
    >
      {/* decorative corner reticle — geometry only, kept out of the a11y tree */}
      <span className="tcl-effigy__bracket is-tl" aria-hidden="true" />
      <span className="tcl-effigy__bracket is-tr" aria-hidden="true" />
      <span className="tcl-effigy__bracket is-bl" aria-hidden="true" />
      <span className="tcl-effigy__bracket is-br" aria-hidden="true" />

      {index != null && <span className="tcl-effigy__index">{index}</span>}

      <div className="tcl-effigy__stage">
        {/* model-viewer composes raw (not a @trembus/ui primitive) because Effigy
            needs <figure>/<figcaption> media semantics around a custom element
            that owns its own canvas + keyboard a11y — the Reliquary precedent. */}
        <model-viewer
          ref={ref}
          className="tcl-effigy__viewer"
          src={src}
          alt={alt}
          loading={loading}
          reveal={elementReveal}
          camera-controls={cameraControls ? true : undefined}
          auto-rotate={isRotating ? true : undefined}
          environment-image={environmentImage}
          ar={ar ? true : undefined}
          ar-modes={ar ? 'webxr scene-viewer quick-look' : undefined}
        >
          {showLoadButton ? (
            // a real focusable affordance: click defers→loads the model
            <button
              type="button"
              className="tcl-effigy__poster is-load"
              slot="poster"
              aria-label={`Load 3D model: ${alt}`}
              onClick={revealModel}
            >
              {posterInner}
              <span className="tcl-effigy__poster-cue" aria-hidden="true">
                ▶ Load 3D
              </span>
            </button>
          ) : (
            // decorative plate — the model's NAME lives on `alt`; model-viewer
            // dismisses this slot once the model reveals.
            <div className="tcl-effigy__poster" slot="poster" aria-hidden="true">
              {posterInner}
            </div>
          )}

          {ar && (
            <button type="button" className="tcl-effigy__ar" slot="ar-button">
              View in your space
            </button>
          )}
        </model-viewer>

        {canRotate && !showLoadButton && (
          <button
            type="button"
            className="tcl-effigy__rotate"
            aria-pressed={rotating}
            aria-label={rotating ? `Pause rotation of ${alt}` : `Resume rotation of ${alt}`}
            onClick={() => setRotating((r) => !r)}
          >
            <span aria-hidden="true">{rotating ? '⏸' : '⟳'}</span>
          </button>
        )}

        {status === 'error' && (
          <div className="tcl-effigy__fault" aria-hidden="true">
            <span className="tcl-effigy__fault-glyph">⚠</span>
            <span>Couldn’t load model</span>
          </div>
        )}
      </div>

      {caption != null && <figcaption className="tcl-effigy__caption">{caption}</figcaption>}

      {/* closes the feedback loop for assistive tech without a visual change */}
      <p className="tcl-effigy__live" aria-live="polite">
        {liveText}
      </p>
    </figure>
  );
}
