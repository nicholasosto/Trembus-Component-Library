import { AbsoluteFill } from 'remotion';

export type CommandModalProps = {
  /** Whole-modal opacity (backdrop + card). */
  opacity: number;
  scale: number;
  /** Text typed into the input so far. */
  text: string;
  caret: boolean;
  /** The matched-command suggestion row. */
  suggestionTitle: string;
  suggestionSub: string;
  /** 0→1 accent flash on "Enter". */
  flash: number;
};

/**
 * A ⌘K-style command palette. Purely presentational — the orchestrator drives the
 * typewriter `text`, the `caret` blink, and the `flash` on submit from the frame.
 */
export function CommandModal({
  opacity,
  scale,
  text,
  caret,
  suggestionTitle,
  suggestionSub,
  flash,
}: CommandModalProps) {
  if (opacity <= 0.001) return null;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start' }}>
      {/* backdrop dim */}
      <AbsoluteFill
        style={{
          background: 'color-mix(in oklab, var(--tcl-bg) 62%, transparent)',
          backdropFilter: 'blur(2px)',
          opacity,
        }}
      />
      {/* palette card */}
      <div
        style={{
          position: 'relative',
          marginTop: 330,
          width: 880,
          opacity,
          transform: `scale(${scale})`,
          borderRadius: 'var(--tcl-radius-lg)',
          overflow: 'hidden',
          background: 'var(--tcl-surface-raised)',
          border: `1px solid color-mix(in oklab, var(--tcl-accent) ${Math.round(
            flash * 80,
          )}%, var(--tcl-border))`,
          boxShadow: `0 36px 90px -28px rgba(0,0,0,0.7), 0 0 ${Math.round(
            flash * 60,
          )}px color-mix(in oklab, var(--tcl-accent) ${Math.round(flash * 70)}%, transparent)`,
        }}
      >
        {/* input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '26px 30px' }}>
          <span
            style={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 'var(--tcl-radius-md)',
              background: 'color-mix(in oklab, var(--tcl-accent) 18%, transparent)',
              color: 'var(--tcl-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--tcl-font-mono)',
              fontSize: 26,
            }}
          >
            ❯
          </span>
          <span
            style={{
              fontFamily: 'var(--tcl-font-mono)',
              fontSize: 34,
              color: 'var(--tcl-text)',
              whiteSpace: 'pre',
            }}
          >
            {text}
            <span
              style={{
                display: 'inline-block',
                width: '0.55em',
                height: '1.05em',
                transform: 'translateY(0.16em)',
                marginLeft: 2,
                borderRadius: 1,
                background: 'var(--tcl-accent)',
                opacity: caret ? 1 : 0,
              }}
            />
          </span>
        </div>

        {/* suggestion / matched command */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '16px 22px',
            margin: 10,
            borderRadius: 'var(--tcl-radius-md)',
            background: 'color-mix(in oklab, var(--tcl-accent) 12%, var(--tcl-surface-sunken))',
            border: '1px solid color-mix(in oklab, var(--tcl-accent) 30%, var(--tcl-border-soft))',
          }}
        >
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--tcl-radius-sm)',
              background: 'var(--tcl-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
            }}
            aria-hidden="true"
          >
            ⚡
          </span>
          <span style={{ flex: 1 }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--tcl-font-sans)',
                fontSize: 26,
                color: 'var(--tcl-text)',
                fontWeight: 600,
              }}
            >
              {suggestionTitle}
            </span>
            <span style={{ display: 'block', fontSize: 20, color: 'var(--tcl-text-dim)' }}>
              {suggestionSub}
            </span>
          </span>
          <span
            style={{
              fontFamily: 'var(--tcl-font-mono)',
              fontSize: 20,
              color: 'var(--tcl-accent)',
              border: '1px solid color-mix(in oklab, var(--tcl-accent) 40%, transparent)',
              borderRadius: 'var(--tcl-radius-sm)',
              padding: '4px 10px',
            }}
          >
            ↵ run
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
