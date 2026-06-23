import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CinematicHero } from '@trembus/game-viz';
import type { CinematicHeroContract } from '@trembus/game-viz';

// One authored contract — the same shape a consumer passes in the app/Storybook.
const SOUL_STEEL: CinematicHeroContract = {
  kicker: 'AN ANIMATED LITURGY · VI EPISODES · AUTUMN MMXXVI',
  title: [{ text: 'SOUL' }, { text: 'STEEL', outline: true }],
  tagline: 'Forged from the drowned, bound in gold — a reliquary of the unquiet.',
  highlight: 'bound in gold',
  actions: [
    { label: 'Watch the trailer', meta: '2:14', icon: '▶', variant: 'primary', href: '#' },
    { label: 'Enter the Reliquary', variant: 'secondary', href: '#' },
  ],
  accolades: [
    { value: 'IX · X', source: 'THE RELIQUARY' },
    { value: '★★★★★', source: 'COLD COAST HERALD' },
    { value: 'UNHOLY', source: 'THE SALT GAZETTE' },
  ],
  tone: 'accent',
};

/**
 * HeroPromo — reuses the REAL `CinematicHero` and drives its entrance in
 * frame-space (the pattern the comparison flagged): the component owns the look;
 * Remotion owns the motion via `useCurrentFrame()`/`spring()`/`interpolate()`,
 * never the component's own wall-clock CSS transitions.
 */
export const HeroPromo = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // entrance: a calm spring scale + fade
  const enter = spring({ frame, fps, config: { damping: 18, mass: 0.85 } });
  const scale = interpolate(enter, [0, 1], [0.94, 1]);
  const fadeIn = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp' });
  // slow drift up, then fade the whole plate out at the tail
  const drift = interpolate(frame, [0, durationInFrames], [12, -18]);
  const fadeOut = interpolate(frame, [durationInFrames - 24, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill
      // dark theme suits the cinematic plate; tokens.dark.css's [data-theme=dark]
      // overrides cascade to everything inside (CinematicHero included).
      data-theme="dark"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7rem',
        fontFamily: 'var(--tcl-font-sans)',
        background:
          'radial-gradient(125% 125% at 50% 0%, var(--tcl-surface-sunken), var(--tcl-bg) 72%)',
      }}
    >
      <div
        style={{
          width: 'min(1400px, 92%)',
          opacity: fadeIn * fadeOut,
          transform: `translateY(${drift}px) scale(${scale})`,
        }}
      >
        <CinematicHero data={SOUL_STEEL} />
      </div>
    </AbsoluteFill>
  );
};
