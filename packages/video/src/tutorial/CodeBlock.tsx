import { Highlight, themes } from 'prism-react-renderer';
import { interpolate, useCurrentFrame } from 'remotion';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export type CodeBlockProps = {
  code: string;
  language: string;
  /** Filename shown in the window tab (e.g. `Tag.tsx`). */
  filename?: string;
  /** Local frame at which the typewriter reveal begins. */
  typeStart?: number;
  /** How many frames the full reveal takes. */
  typeDuration?: number;
  showLineNumbers?: boolean;
  fontSize?: number;
};

/**
 * An animated, syntax-highlighted code panel.
 *
 * The repo's golden rule (README): drive motion off `useCurrentFrame()`, never a
 * component's own CSS transition. So the typewriter reveal here is a pure function
 * of the frame — we tokenize the WHOLE snippet once (synchronously, via
 * prism-react-renderer — no async highlighter/WASM to stall a headless render),
 * then reveal characters by frame. Not-yet-typed characters render at `opacity: 0`
 * so the panel never reflows as text appears.
 */
export function CodeBlock({
  code,
  language,
  filename,
  typeStart = 0,
  typeDuration = 90,
  showLineNumbers = true,
  fontSize = 26,
}: CodeBlockProps) {
  const frame = useCurrentFrame();
  const total = code.length;
  const visibleChars = Math.round(
    interpolate(frame, [typeStart, typeStart + typeDuration], [0, total], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const typing = visibleChars < total;
  const caretOn = Math.floor(frame / 16) % 2 === 0;

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 'var(--tcl-radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--tcl-border)',
        background: 'var(--tcl-surface-sunken)',
        boxShadow: '0 24px 60px -20px rgba(0, 0, 0, 0.55)',
        fontFamily: 'var(--tcl-font-mono)',
      }}
    >
      {/* window chrome */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 20px',
          background: 'var(--tcl-surface-raised)',
          borderBottom: '1px solid var(--tcl-border-soft)',
        }}
      >
        <span style={{ display: 'flex', gap: 9 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <span
              key={c}
              style={{ width: 14, height: 14, borderRadius: '50%', background: c, opacity: 0.85 }}
            />
          ))}
        </span>
        {filename ? (
          <span
            style={{
              marginLeft: 6,
              fontSize: 22,
              color: 'var(--tcl-text-dim)',
              fontFamily: 'var(--tcl-font-mono)',
            }}
          >
            {filename}
          </span>
        ) : null}
      </div>

      {/* code body */}
      <Highlight theme={themes.vsDark} code={code} language={language}>
        {({ tokens, getLineProps, getTokenProps }) => {
          let cursor = 0;
          return (
            <pre
              style={{
                margin: 0,
                padding: '22px 24px',
                background: 'transparent',
                fontSize,
                lineHeight: 1.55,
                overflow: 'hidden',
              }}
            >
              {tokens.map((line, lineIndex) => {
                // Account for the newline that precedes every line but the first,
                // so the visible-char offset stays aligned with `code.length`
                // (prism line `content` omits the trailing "\n").
                if (lineIndex > 0) cursor += 1;
                const lineProps = getLineProps({ line });
                return (
                  <div key={lineIndex} style={{ display: 'flex' }}>
                    {showLineNumbers ? (
                      <span
                        style={{
                          width: '2.4em',
                          flexShrink: 0,
                          textAlign: 'right',
                          paddingRight: '1.2em',
                          color: 'var(--tcl-text-faint)',
                          userSelect: 'none',
                        }}
                      >
                        {lineIndex + 1}
                      </span>
                    ) : null}
                    <span className={lineProps.className} style={{ whiteSpace: 'pre' }}>
                      {line.map((token, k) => {
                        const props = getTokenProps({ token });
                        const start = cursor;
                        cursor += token.content.length;
                        const vis = clamp(visibleChars - start, 0, token.content.length);
                        const visible = token.content.slice(0, vis);
                        const hidden = token.content.slice(vis);
                        const straddles =
                          visibleChars > start && visibleChars < start + token.content.length;
                        return (
                          <span key={k} className={props.className} style={props.style}>
                            {visible}
                            {straddles && typing && caretOn ? <Caret /> : null}
                            {hidden ? <span style={{ opacity: 0 }}>{hidden}</span> : null}
                          </span>
                        );
                      })}
                      {/* zero-width space keeps blank lines at full row height */}
                      {'​'}
                    </span>
                  </div>
                );
              })}
            </pre>
          );
        }}
      </Highlight>
    </div>
  );
}

/** A blinking insertion caret. */
function Caret() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '0.5em',
        marginLeft: '-0.1em',
        marginRight: '-0.4em',
        height: '1.1em',
        transform: 'translateY(0.18em)',
        background: 'var(--tcl-accent)',
        borderRadius: 1,
      }}
    />
  );
}
