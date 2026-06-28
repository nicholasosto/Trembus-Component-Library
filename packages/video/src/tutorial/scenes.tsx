import type { ReactNode } from 'react';
import type { Caption } from '@remotion/captions';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Captions } from './Captions';
import { CodeBlock } from './CodeBlock';
import type { Scene } from './script';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const panelStyle = {
  borderRadius: 'var(--tcl-radius-lg)',
  overflow: 'hidden',
  border: '1px solid var(--tcl-border)',
  background: 'var(--tcl-surface-sunken)',
  boxShadow: '0 24px 60px -20px rgba(0, 0, 0, 0.55)',
} as const;

/** macOS-style window header — traffic lights + a title. */
function ChromeBar({ title }: { title?: string }) {
  return (
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
      {title ? (
        <span
          style={{
            marginLeft: 6,
            fontSize: 22,
            color: 'var(--tcl-text-dim)',
            fontFamily: 'var(--tcl-font-mono)',
          }}
        >
          {title}
        </span>
      ) : null}
    </div>
  );
}

function Caret() {
  const frame = useCurrentFrame();
  const on = Math.floor(frame / 16) % 2 === 0;
  return (
    <span
      style={{
        display: 'inline-block',
        width: '0.55em',
        height: '1.1em',
        transform: 'translateY(0.18em)',
        background: 'var(--tcl-accent)',
        opacity: on ? 1 : 0,
        borderRadius: 1,
      }}
    />
  );
}

/** Shared backdrop: dark theme, token gradient, centered content + captions. */
function Stage({ children, captions }: { children: ReactNode; captions: Caption[] }) {
  return (
    <AbsoluteFill
      data-theme="dark"
      style={{
        fontFamily: 'var(--tcl-font-sans)',
        color: 'var(--tcl-text)',
        background:
          'radial-gradient(125% 125% at 50% 0%, var(--tcl-surface-sunken), var(--tcl-bg) 72%)',
      }}
    >
      <AbsoluteFill
        style={{ alignItems: 'center', justifyContent: 'center', padding: '6rem 7rem 8rem' }}
      >
        {children}
      </AbsoluteFill>
      <Captions captions={captions} />
    </AbsoluteFill>
  );
}

function TitleScene({ scene }: { scene: Extract<Scene, { kind: 'title' }> }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, mass: 0.85 } });
  const y = interpolate(enter, [0, 1], [26, 0]);
  const op = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <Stage captions={scene.captions}>
      <div style={{ textAlign: 'center', transform: `translateY(${y}px)`, opacity: op }}>
        <div
          style={{
            letterSpacing: '0.34em',
            fontSize: 22,
            color: 'var(--tcl-text-dim)',
            marginBottom: 28,
          }}
        >
          {scene.eyebrow}
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--tcl-font-display)',
            fontSize: 132,
            lineHeight: 1.02,
            color: 'var(--tcl-accent)',
          }}
        >
          {scene.title}
        </h1>
        <div style={{ marginTop: 22, fontSize: 42, color: 'var(--tcl-text-dim)' }}>
          {scene.subtitle}
        </div>
      </div>
    </Stage>
  );
}

function CommandScene({ scene }: { scene: Extract<Scene, { kind: 'command' }> }) {
  const frame = useCurrentFrame();
  const typeEnd = 70;
  const chars = Math.round(
    interpolate(frame, [10, typeEnd], [0, scene.command.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const typed = scene.command.slice(0, chars);
  const typing = chars < scene.command.length;
  return (
    <Stage captions={scene.captions}>
      <div style={{ width: '80%', ...panelStyle }}>
        <ChromeBar title="zsh — trembus-ui" />
        <div
          style={{
            padding: '30px 34px',
            fontFamily: 'var(--tcl-font-mono)',
            fontSize: 30,
            lineHeight: 1.7,
          }}
        >
          <div>
            <span style={{ color: 'var(--tcl-status-success)' }}>{scene.prompt} </span>
            <span>{typed}</span>
            {typing ? <Caret /> : null}
          </div>
          {scene.result.map((line, i) => {
            const appear = typeEnd + 10 + i * 10;
            const op = interpolate(frame, [appear, appear + 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                key={i}
                style={{
                  opacity: op,
                  color: i === 0 ? 'var(--tcl-status-success)' : 'var(--tcl-text-dim)',
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
}

function FileTreeScene({ scene }: { scene: Extract<Scene, { kind: 'filetree' }> }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Stage captions={scene.captions}>
      <div style={{ width: '74%' }}>
        <div
          style={{
            fontFamily: 'var(--tcl-font-mono)',
            fontSize: 28,
            color: 'var(--tcl-text-dim)',
            marginBottom: 24,
          }}
        >
          {scene.root}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {scene.files.map((f, i) => {
            const appear = 10 + i * 12;
            const e = spring({ frame: frame - appear, fps, config: { damping: 16, mass: 0.6 } });
            const op = interpolate(frame, [appear, appear + 8], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const x = interpolate(e, [0, 1], [-26, 0]);
            return (
              <div
                key={f.name}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 18,
                  opacity: op,
                  transform: `translateX(${x}px)`,
                  padding: '14px 22px',
                  background: 'var(--tcl-surface-sunken)',
                  border: '1px solid var(--tcl-border-soft)',
                  borderRadius: 'var(--tcl-radius-md)',
                }}
              >
                <span style={{ color: 'var(--tcl-accent)', fontFamily: 'var(--tcl-font-mono)' }}>
                  ›
                </span>
                <span
                  style={{
                    fontFamily: 'var(--tcl-font-mono)',
                    fontSize: 34,
                    color: 'var(--tcl-text)',
                    minWidth: '9.6em',
                  }}
                >
                  {f.name}
                </span>
                <span style={{ fontSize: 26, color: 'var(--tcl-text-faint)' }}>{f.note}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
}

function CodeScene({ scene }: { scene: Extract<Scene, { kind: 'code' }> }) {
  const typeDuration = clamp(Math.round(scene.code.length / 3.2), 45, scene.durationInFrames - 45);
  return (
    <Stage captions={scene.captions}>
      <div style={{ width: '84%' }}>
        <div
          style={{
            display: 'inline-block',
            marginBottom: 22,
            padding: '8px 18px',
            borderRadius: 'var(--tcl-radius-full)',
            border: '1px solid var(--tcl-border)',
            background: 'var(--tcl-surface-raised)',
            color: 'var(--tcl-accent)',
            fontSize: 24,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {scene.caption}
        </div>
        <CodeBlock
          code={scene.code}
          language={scene.language}
          filename={scene.filename}
          typeStart={10}
          typeDuration={typeDuration}
        />
      </div>
    </Stage>
  );
}

function ValidateScene({ scene }: { scene: Extract<Scene, { kind: 'validate' }> }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stepStart = 26;
  const stepGap = 13;
  const bannerAt = stepStart + scene.steps.length * stepGap + 12;
  const bannerOp = interpolate(frame, [bannerAt, bannerAt + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const bannerE = spring({ frame: frame - bannerAt, fps, config: { damping: 14 } });
  const bannerScale = interpolate(bannerE, [0, 1], [0.9, 1]);
  return (
    <Stage captions={scene.captions}>
      <div style={{ width: '74%', ...panelStyle }}>
        <ChromeBar title="zsh" />
        <div style={{ padding: '28px 36px', fontFamily: 'var(--tcl-font-mono)', fontSize: 28 }}>
          <div style={{ marginBottom: 20 }}>
            <span style={{ color: 'var(--tcl-status-success)' }}>$ </span>
            {scene.command}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {scene.steps.map((s, i) => {
              const appear = stepStart + i * stepGap;
              const op = interpolate(frame, [appear, appear + 6], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const checked = frame >= appear + 6;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: op }}>
                  <span
                    style={{
                      width: '1.4em',
                      color: checked ? 'var(--tcl-status-success)' : 'var(--tcl-text-faint)',
                    }}
                  >
                    {checked ? '✓' : '·'}
                  </span>
                  <span style={{ color: 'var(--tcl-text-dim)' }}>{s}</span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 26,
              opacity: bannerOp,
              transform: `scale(${bannerScale})`,
              transformOrigin: 'left center',
              display: 'inline-block',
              padding: '12px 24px',
              borderRadius: 'var(--tcl-radius-md)',
              background: 'var(--tcl-status-success-bg)',
              color: 'var(--tcl-status-success-fg)',
              fontFamily: 'var(--tcl-font-sans)',
              fontWeight: 600,
              fontSize: 28,
            }}
          >
            ✓ validate passed
          </div>
        </div>
      </div>
    </Stage>
  );
}

function OutroScene({ scene }: { scene: Extract<Scene, { kind: 'outro' }> }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 20, mass: 0.9 } });
  const sc = interpolate(enter, [0, 1], [0.94, 1]);
  const op = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <Stage captions={scene.captions}>
      <div style={{ textAlign: 'center', transform: `scale(${sc})`, opacity: op }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--tcl-font-display)',
            fontSize: 78,
            lineHeight: 1.12,
            color: 'var(--tcl-accent)',
          }}
        >
          {scene.title}
        </h2>
        <div style={{ marginTop: 22, fontSize: 36, color: 'var(--tcl-text-dim)' }}>
          {scene.subtitle}
        </div>
      </div>
    </Stage>
  );
}

/** Render one scene by kind (the `<TransitionSeries.Sequence>` child). */
export function SceneView({ scene }: { scene: Scene }) {
  switch (scene.kind) {
    case 'title':
      return <TitleScene scene={scene} />;
    case 'command':
      return <CommandScene scene={scene} />;
    case 'filetree':
      return <FileTreeScene scene={scene} />;
    case 'code':
      return <CodeScene scene={scene} />;
    case 'validate':
      return <ValidateScene scene={scene} />;
    case 'outro':
      return <OutroScene scene={scene} />;
  }
}
