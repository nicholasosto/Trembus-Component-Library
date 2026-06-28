import type { Caption } from '@remotion/captions';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

/**
 * Burned-in subtitles. Captions carry ms timing (the `@remotion/captions`
 * `Caption` shape — interoperable with SRT/Whisper output); we resolve the
 * active one against the LOCAL scene frame so each scene owns its own track.
 */
export function Captions({ captions }: { captions: Caption[] }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  const active = captions.find((c) => nowMs >= c.startMs && nowMs < c.endMs);
  if (!active) return null;

  const startF = (active.startMs / 1000) * fps;
  const endF = (active.endMs / 1000) * fps;
  const opacity = interpolate(frame, [startF, startF + 6, endF - 6, endF], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 72,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 12%',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          opacity,
          maxWidth: '80%',
          textAlign: 'center',
          fontFamily: 'var(--tcl-font-sans)',
          fontSize: 34,
          fontWeight: 500,
          lineHeight: 1.35,
          color: 'var(--tcl-text)',
          padding: '14px 28px',
          borderRadius: 'var(--tcl-radius-md)',
          border: '1px solid var(--tcl-border-soft)',
          background: 'color-mix(in oklab, var(--tcl-surface-sunken) 82%, transparent)',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 10px 30px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        {active.text}
      </span>
    </div>
  );
}
