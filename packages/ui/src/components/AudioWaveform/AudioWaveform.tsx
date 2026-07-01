import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactElement } from 'react';
import { cx } from '../../utils/cx';
import { toneVar } from '../../internal/fillbar';
import type { FillBarTone } from '../../internal/fillbar';
import { Pressable } from '../../primitives/Pressable/Pressable';
import { Text } from '../../primitives/Text/Text';
import './AudioWaveform.css';

/** Tone vocabulary — the waveform stroke colour (always paired with `label` text). */
export type AudioWaveformTone = FillBarTone;

export interface AudioWaveformProps {
  /** Audio source URL (or data URI). Never autoplays. */
  src: string;
  /**
   * Pre-computed, normalized (0–1) amplitude bars. When omitted the component
   * renders a dormant placeholder unless `autoLoadPeaks` decodes real peaks.
   */
  peaks?: number[];
  /** Track length in seconds. Falls back to the audio element's metadata duration. */
  duration?: number;
  /** Accessible name for the player and its scrubber (required — never colour alone). */
  label: string;
  /** Waveform tone (default `accent`). Always paired with the visible `label`. */
  tone?: AudioWaveformTone;
  /** Decode the waveform from `src` via the Web Audio API when no `peaks` are given. */
  autoLoadPeaks?: boolean;
  /** Waveform-only: no transport, no scrubber — a presentational thumbnail. */
  compact?: boolean;
  /** Called when playback starts. */
  onPlay?: () => void;
  /** Called when playback pauses. */
  onPause?: () => void;
  className?: string;
}

type DecodeStatus = 'idle' | 'loading' | 'ready' | 'error';

const BAR_COUNT = 96;
const STEP_SECONDS = 5;
const PAGE_SECONDS = 10;

/** A gentle, dormant shape shown when there are no real peaks to draw. */
const PLACEHOLDER_PEAKS: number[] = Array.from(
  { length: 48 },
  (_, i) => 0.22 + 0.18 * Math.abs(Math.sin(i / 3.1)),
);

/** Downsample a decoded buffer to `count` normalized (0–1) amplitude bars. */
function computePeaks(buffer: AudioBuffer, count: number): number[] {
  const raw = buffer.getChannelData(0);
  const block = Math.max(1, Math.floor(raw.length / count));
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    let sum = 0;
    const start = i * block;
    for (let j = 0; j < block; j++) sum += Math.abs(raw[start + j] ?? 0);
    out.push(sum / block);
  }
  const max = Math.max(...out) || 1;
  return out.map((v) => v / max);
}

/** Seconds → `M:SS`, or `--:--` for unknown / invalid durations. */
function fmtTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return '--:--';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Build the `<rect>` bars once — reused by the base and the played (clipped) layer. */
function Bars({ bars }: { bars: number[] }): ReactElement {
  const slot = 1000 / bars.length;
  const w = Math.max(1, slot * 0.55);
  return (
    <>
      {bars.map((p, i) => {
        const h = Math.max(2, p * 96);
        return (
          <rect key={i} x={i * slot + (slot - w) / 2} y={(100 - h) / 2} width={w} height={h} />
        );
      })}
    </>
  );
}

/**
 * `AudioWaveform` — an audio preview + player. Lead job is **Reveal State**: it
 * draws the waveform and a current-time / duration readout, and surfaces loading
 * / decode-error both visually and through an `aria-live` region. It **Affords
 * Action** with a real focusable play/pause `<button>` (`aria-pressed`) and a
 * keyboard-operable scrubber (`role=slider`), and **Acknowledges Input** by
 * moving the playhead the instant you seek. It never autoplays; any playhead
 * motion is CSS that respects `prefers-reduced-motion`.
 */
export function AudioWaveform({
  src,
  peaks,
  duration,
  label,
  tone = 'accent',
  autoLoadPeaks = false,
  compact = false,
  onPlay,
  onPause,
  className,
}: AudioWaveformProps): ReactElement {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  // Sanitize the id — raw useId() contains ':' which breaks SVG url(#…) refs in Firefox.
  const clipId = `awf-${useId().replace(/[:]/g, '')}`;

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [metaDuration, setMetaDuration] = useState(0);
  const [decodedPeaks, setDecodedPeaks] = useState<number[] | null>(null);
  const [decodeStatus, setDecodeStatus] = useState<DecodeStatus>('idle');
  const [dragging, setDragging] = useState(false);

  // Lazily decode real peaks from `src` when asked and none were provided.
  useEffect(() => {
    if (peaks || !autoLoadPeaks) return;
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    let cancelled = false;
    setDecodeStatus('loading');
    void (async () => {
      let ctx: AudioContext | undefined;
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const bytes = await res.arrayBuffer();
        ctx = new AudioCtx();
        const decoded = await ctx.decodeAudioData(bytes);
        if (cancelled) return;
        setDecodedPeaks(computePeaks(decoded, BAR_COUNT));
        setDecodeStatus('ready');
      } catch {
        if (!cancelled) setDecodeStatus('error');
      } finally {
        void ctx?.close();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src, peaks, autoLoadPeaks]);

  // Sanitize duration: a non-finite or non-positive `duration` (0, NaN, negative
  // — all plausible "unknown yet" caller values) is treated as absent, so the
  // audio element's metadata duration can fill in and a NaN never slips past the
  // `> 0` seek guards (every comparison with NaN is false).
  const validDuration =
    typeof duration === 'number' && Number.isFinite(duration) && duration > 0
      ? duration
      : undefined;
  const effectiveDuration = validDuration ?? (metaDuration > 0 ? metaDuration : 0);

  // Empty peak arrays are "no data", not real bars — fall through to the
  // dormant placeholder (an empty array is truthy, so `??` wouldn't catch it).
  const hasPeaks = !!peaks && peaks.length > 0;
  const hasDecoded = !!decodedPeaks && decodedPeaks.length > 0;
  const bars = hasPeaks ? peaks : hasDecoded ? decodedPeaks : PLACEHOLDER_PEAKS;
  const isPlaceholder = !hasPeaks && !hasDecoded;
  const frac = effectiveDuration > 0 ? clamp(currentTime / effectiveDuration, 0, 1) : 0;

  // Canonical whole-second display — elapsed AND total both floor, so at the end
  // aria-valuenow reaches aria-valuemax and the readout / valuenow / valuetext
  // never disagree; the playhead alone uses the precise `frac`.
  const durSec = Math.floor(effectiveDuration);
  const nowSec = durSec > 0 ? Math.min(durSec, Math.max(0, Math.floor(currentTime))) : 0;
  const timeText = fmtTime(nowSec);
  const totalText = fmtTime(durSec);

  const statusText =
    decodeStatus === 'loading'
      ? 'Loading waveform…'
      : decodeStatus === 'error'
        ? 'Waveform unavailable'
        : '';

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      // A blocked/failed play() rejects; keep the button state honest via events.
      const p = audio.play() as Promise<void> | undefined;
      if (p && typeof p.catch === 'function') p.catch(() => undefined);
    } else {
      audio.pause();
    }
  }, []);

  const seekTo = useCallback(
    (seconds: number) => {
      // `!(> 0)` (not `<= 0`) so a NaN duration can never slip through.
      if (!(effectiveDuration > 0)) return;
      const next = clamp(seconds, 0, effectiveDuration);
      setCurrentTime(next);
      const audio = audioRef.current;
      if (audio) audio.currentTime = next;
    },
    [effectiveDuration],
  );

  const seekToClientX = useCallback(
    (clientX: number) => {
      const el = waveRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      seekTo(((clientX - rect.left) / rect.width) * effectiveDuration);
    },
    [seekTo, effectiveDuration],
  );

  const onScrubberKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      let handled = true;
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          seekTo(currentTime + STEP_SECONDS);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          seekTo(currentTime - STEP_SECONDS);
          break;
        case 'PageUp':
          seekTo(currentTime + PAGE_SECONDS);
          break;
        case 'PageDown':
          seekTo(currentTime - PAGE_SECONDS);
          break;
        case 'Home':
          seekTo(0);
          break;
        case 'End':
          seekTo(effectiveDuration);
          break;
        default:
          handled = false;
      }
      if (handled) e.preventDefault();
    },
    [seekTo, currentTime, effectiveDuration],
  );

  const onScrubberPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDragging(true);
      seekToClientX(e.clientX);
    },
    [seekToClientX],
  );

  const onScrubberPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (dragging) seekToClientX(e.clientX);
    },
    [dragging, seekToClientX],
  );

  const endDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDragging(false);
  }, []);

  const rootStyle = {
    '--wave-tone': toneVar(tone),
    '--frac': `${(frac * 100).toFixed(3)}%`,
  } as CSSProperties;

  const compactLabel =
    decodeStatus === 'loading'
      ? `${label}, loading waveform`
      : decodeStatus === 'error'
        ? `${label}, waveform unavailable`
        : label;

  const waveform = (
    <div className="tcl-audio-waveform__wave" ref={waveRef}>
      <svg
        className="tcl-audio-waveform__svg"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g className="tcl-audio-waveform__bars tcl-audio-waveform__bars--base">
          <Bars bars={bars} />
        </g>
        {!compact && (
          <>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={frac * 1000} height="100" />
            </clipPath>
            <g
              className="tcl-audio-waveform__bars tcl-audio-waveform__bars--played"
              clipPath={`url(#${clipId})`}
            >
              <Bars bars={bars} />
            </g>
          </>
        )}
      </svg>

      {!compact && <div className="tcl-audio-waveform__playhead" aria-hidden="true" />}

      {!compact && (
        <div
          className="tcl-audio-waveform__scrubber"
          role="slider"
          tabIndex={0}
          aria-label={`Seek — ${label}`}
          aria-valuemin={0}
          aria-valuemax={durSec}
          aria-valuenow={nowSec}
          aria-valuetext={effectiveDuration > 0 ? `${timeText} of ${totalText}` : timeText}
          onKeyDown={onScrubberKeyDown}
          onPointerDown={onScrubberPointerDown}
          onPointerMove={onScrubberPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
      )}
    </div>
  );

  if (compact) {
    return (
      <div
        className={cx('tcl-audio-waveform', 'tcl-audio-waveform--compact', className)}
        data-tone={tone}
        data-placeholder={isPlaceholder || undefined}
        role="img"
        aria-label={compactLabel}
        style={rootStyle}
      >
        {waveform}
      </div>
    );
  }

  return (
    <div
      className={cx('tcl-audio-waveform', className)}
      data-tone={tone}
      data-state={playing ? 'playing' : 'paused'}
      data-placeholder={isPlaceholder || undefined}
      style={rootStyle}
    >
      <Pressable
        className="tcl-audio-waveform__toggle"
        aria-pressed={playing}
        aria-label={`${playing ? 'Pause' : 'Play'} ${label}`}
        onPress={togglePlay}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          {playing ? (
            <g>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </g>
          ) : (
            <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
          )}
        </svg>
      </Pressable>

      <div className="tcl-audio-waveform__body">
        {waveform}
        <div className="tcl-audio-waveform__meta">
          <Text className="tcl-audio-waveform__time" mono size="xs" aria-hidden="true">
            {timeText} / {totalText}
          </Text>
          <Text className="tcl-audio-waveform__label" size="xs" truncate>
            {label}
          </Text>
        </div>
      </div>

      {/* State surfaced to assistive tech AND shown visually when non-empty. */}
      <div className="tcl-audio-waveform__status" role="status" aria-live="polite">
        {statusText && (
          <Text size="xs" tone={decodeStatus === 'error' ? 'danger' : 'dim'}>
            {statusText}
          </Text>
        )}
      </div>

      {/*
        Decorative playback engine, not a media affordance: it's aria-hidden and
        the accessible transport is the button + scrubber above. A <track> can't
        apply to an arbitrary user-supplied asset with no caption source.
      */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        className="tcl-audio-waveform__audio"
        src={src}
        preload="metadata"
        aria-hidden="true"
        tabIndex={-1}
        onPlay={() => {
          setPlaying(true);
          onPlay?.();
        }}
        onPause={() => {
          setPlaying(false);
          onPause?.();
        }}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          // Fill in from metadata whenever no VALID duration prop was given
          // (covers omitted, 0, NaN and negative — not just `undefined`).
          const d = e.currentTarget.duration;
          if (!validDuration && Number.isFinite(d) && d > 0) setMetaDuration(d);
        }}
      />
    </div>
  );
}
