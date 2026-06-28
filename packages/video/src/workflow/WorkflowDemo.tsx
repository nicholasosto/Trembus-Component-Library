import type { CSSProperties, ReactNode } from 'react';
import type { Caption } from '@remotion/captions';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { RunHistory, Swimlane } from '@trembus/ui';
import { CommandModal } from './CommandModal';
import { Captions } from '../tutorial/Captions';
import { activeStepId, buildRunHistory, buildSwimlane, RUN_SELECTED_ID } from './data';
import { execState, FPS, NEW_CMD, START_CMD, T, typedCount } from './timeline';

const cap = (text: string, from: number, to: number): Caption => ({
  text,
  startMs: (from / FPS) * 1000,
  endMs: (to / FPS) * 1000,
  timestampMs: null,
  confidence: null,
});

const CAPTIONS: Caption[] = [
  cap('Open the palette and scaffold a workflow.', 52, 146),
  cap('createKPI is added to the command center.', 162, 252),
  cap('Run it with one more command.', 286, 360),
  cap('Each step lights up as work hands off down the lanes.', 376, 544),
  cap('A run record captures the outcome and its outputs.', 560, 672),
];

function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--tcl-surface)',
        border: '1px solid var(--tcl-border-soft)',
        borderRadius: 'var(--tcl-radius-lg)',
        padding: '24px 30px',
        boxShadow: '0 18px 50px -28px rgba(0,0,0,0.5)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StatusChip({ kind }: { kind: 'idle' | 'running' | 'done' }) {
  const map = {
    idle: { fg: 'var(--tcl-text-dim)', dot: 'var(--tcl-text-faint)', label: 'Idle' },
    running: { fg: 'var(--tcl-accent)', dot: 'var(--tcl-accent)', label: 'Running…' },
    done: { fg: 'var(--tcl-status-success)', dot: 'var(--tcl-status-success)', label: 'Completed' },
  }[kind];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 16px',
        borderRadius: 'var(--tcl-radius-full)',
        background: 'var(--tcl-surface-raised)',
        border: '1px solid var(--tcl-border-soft)',
        color: map.fg,
        fontSize: 20,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: map.dot }} />
      {map.label}
    </span>
  );
}

export function WorkflowDemo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const caretOn = Math.floor(frame / 16) % 2 === 0;

  const exec = execState(frame);
  const done = exec.started ? exec.done : -1; // −1 ⇒ every step still pending

  const appOpacity = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: 'clamp' });

  // swimlane entrance
  const swEnter = spring({ frame: frame - T.swimlaneIn, fps, config: { damping: 18, mass: 0.85 } });
  const swOpacity = interpolate(frame, [T.swimlaneIn, T.swimlaneIn + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const swY = interpolate(swEnter, [0, 1], [44, 0]);
  const swScale = interpolate(swEnter, [0, 1], [0.96, 1]);

  // run-history entrance
  const runEnter = spring({ frame: frame - T.runPanelIn, fps, config: { damping: 18, mass: 0.9 } });
  const runOpacity = interpolate(frame, [T.runPanelIn, T.runPanelIn + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const runY = interpolate(runEnter, [0, 1], [48, 0]);

  // toast
  const toastOpacity = interpolate(
    frame,
    [T.toastIn, T.toastIn + 10, T.toastOut - 16, T.toastOut],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const toastX = interpolate(frame, [T.toastIn, T.toastIn + 12], [40, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // command palettes
  const palette = (inF: number, outF: number, enterF: number, text: string) => ({
    opacity: interpolate(frame, [inF, inF + 12, outF - 10, outF], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    scale: interpolate(spring({ frame: frame - inF, fps, config: { damping: 20 } }), [0, 1], [0.94, 1]),
    text,
    flash: interpolate(frame, [enterF - 5, enterF, enterF + 12], [0, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  });
  const newP = palette(
    T.newPaletteIn,
    T.newPaletteOut,
    T.newEnter,
    NEW_CMD.slice(0, typedCount(frame, NEW_CMD, T.newTypeStart, T.newTypeEnd)),
  );
  const startP = palette(
    T.startPaletteIn,
    T.startPaletteOut,
    T.startEnter,
    START_CMD.slice(0, typedCount(frame, START_CMD, T.startTypeStart, T.startTypeEnd)),
  );

  const swVisible = frame >= T.swimlaneIn;
  const runVisible = frame >= T.runPanelIn;
  const chipKind: 'idle' | 'running' | 'done' = exec.started
    ? exec.finished
      ? 'done'
      : 'running'
    : 'idle';

  const swData = buildSwimlane(done, exec.finished);
  const swSelected = exec.started ? activeStepId(done, exec.finished) : undefined;
  const runData = buildRunHistory(done, exec.finished);

  return (
    <AbsoluteFill
      data-theme="dark"
      style={{
        fontFamily: 'var(--tcl-font-sans)',
        color: 'var(--tcl-text)',
        background:
          'radial-gradient(120% 120% at 50% 0%, var(--tcl-surface-sunken), var(--tcl-bg) 70%)',
      }}
    >
      <AbsoluteFill style={{ opacity: appOpacity }}>
        {/* header bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            padding: '0 36px',
            borderBottom: '1px solid var(--tcl-border-soft)',
            background: 'color-mix(in oklab, var(--tcl-surface) 70%, transparent)',
          }}
        >
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '0.02em' }}>
            <span style={{ color: 'var(--tcl-accent)' }}>◆</span> TREMBUS
            <span style={{ color: 'var(--tcl-text-dim)', fontWeight: 500 }}> · Command Center</span>
          </span>
          <span style={{ color: 'var(--tcl-text-faint)' }}>|</span>
          <span style={{ fontSize: 20, color: 'var(--tcl-text-dim)' }}>
            Workflows{swVisible ? ' / createKPI' : ''}
          </span>
          <span style={{ flex: 1 }} />
          <StatusChip kind={chipKind} />
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--tcl-surface-raised)',
              border: '1px solid var(--tcl-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: 'var(--tcl-text-dim)',
            }}
          >
            NO
          </span>
        </div>

        {/* left rail */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 80,
            left: 0,
            bottom: 0,
            width: 84,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            padding: '24px 0',
            borderRight: '1px solid var(--tcl-border-soft)',
            background: 'color-mix(in oklab, var(--tcl-surface) 50%, transparent)',
          }}
        >
          {[
            { g: '◇', on: false },
            { g: '▦', on: true },
            { g: '◷', on: false },
            { g: '⚙', on: false },
          ].map((it, i) => (
            <span
              key={i}
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--tcl-radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: it.on ? 'var(--tcl-accent)' : 'var(--tcl-text-faint)',
                background: it.on ? 'color-mix(in oklab, var(--tcl-accent) 16%, transparent)' : 'transparent',
              }}
            >
              {it.g}
            </span>
          ))}
        </div>

        {/* main canvas */}
        <div
          style={{
            position: 'absolute',
            top: 80,
            left: 84,
            right: 0,
            bottom: 0,
            padding: '40px 60px 96px',
            display: 'flex',
            flexDirection: 'column',
            gap: 26,
            overflow: 'hidden',
          }}
        >
          <Panel>
            {swVisible ? (
              <div
                style={{
                  opacity: swOpacity,
                  transform: `translateY(${swY}px) scale(${swScale})`,
                  transformOrigin: 'top center',
                }}
              >
                <Swimlane data={swData} selectedId={swSelected} />
              </div>
            ) : (
              <div
                style={{
                  height: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  color: 'var(--tcl-text-faint)',
                }}
              >
                <span style={{ fontSize: 40 }}>▦</span>
                <span style={{ fontSize: 26, color: 'var(--tcl-text-dim)' }}>No workflow loaded</span>
                <span style={{ fontSize: 20 }}>Run a command to scaffold one</span>
              </div>
            )}
          </Panel>

          {runVisible ? (
            <Panel style={{ opacity: runOpacity, transform: `translateY(${runY}px)` }}>
              <RunHistory data={runData} selectedRunId={RUN_SELECTED_ID} density="compact" />
            </Panel>
          ) : null}
        </div>

        {/* toast */}
        <div
          style={{
            position: 'absolute',
            top: 100,
            right: 48,
            opacity: toastOpacity,
            transform: `translateX(${toastX}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 22px',
            borderRadius: 'var(--tcl-radius-md)',
            background: 'var(--tcl-status-success-bg)',
            color: 'var(--tcl-status-success-fg)',
            border: '1px solid color-mix(in oklab, var(--tcl-status-success) 40%, transparent)',
            fontWeight: 600,
            fontSize: 22,
          }}
        >
          ✓ Workflow created · createKPI
        </div>
      </AbsoluteFill>

      {/* command palettes (overlay above the app) */}
      <CommandModal
        opacity={newP.opacity}
        scale={newP.scale}
        text={newP.text}
        caret={caretOn}
        suggestionTitle="Create workflow"
        suggestionSub="createKPI · 6 steps · human ↔ agent ↔ Fabric"
        flash={newP.flash}
      />
      <CommandModal
        opacity={startP.opacity}
        scale={startP.scale}
        text={startP.text}
        caret={caretOn}
        suggestionTitle="Start workflow"
        suggestionSub="createKPI · run #001"
        flash={startP.flash}
      />

      <Captions captions={CAPTIONS} />
    </AbsoluteFill>
  );
}
