import type { Caption } from '@remotion/captions';

/**
 * The tutorial script — "Add a component to @trembus/ui".
 *
 * The code shown is the REAL output of the repo's scaffold
 * (`.claude/skills/new-component/scaffold.mjs Tag`), so a viewer can follow along
 * verbatim. Captions are authored here as `@remotion/captions` `Caption`s; the
 * overlay converts their ms timing back to frames at render fps.
 */

export const FPS = 30;

/** Author a caption from LOCAL scene frames (cleaner than hand-writing ms). */
const cap = (text: string, fromFrame: number, toFrame: number): Caption => ({
  text,
  startMs: (fromFrame / FPS) * 1000,
  endMs: (toFrame / FPS) * 1000,
  timestampMs: null,
  confidence: null,
});

export type Transition = {
  type: 'fade' | 'slide' | 'wipe';
  frames: number;
  direction?: 'from-left' | 'from-right' | 'from-top' | 'from-bottom';
};

type Base = {
  id: string;
  durationInFrames: number;
  /** Transition applied BEFORE this scene (ignored for the first scene). */
  enter?: Transition;
  captions: Caption[];
};

export type Scene =
  | (Base & { kind: 'title'; eyebrow: string; title: string; subtitle: string })
  | (Base & { kind: 'command'; prompt: string; command: string; result: string[] })
  | (Base & { kind: 'filetree'; root: string; files: { name: string; note: string }[] })
  | (Base & {
      kind: 'code';
      filename: string;
      language: string;
      code: string;
      caption: string;
    })
  | (Base & { kind: 'validate'; command: string; steps: string[] })
  | (Base & { kind: 'outro'; title: string; subtitle: string });

const TSX = `import type { HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import './Tag.css';

export type TagProps = HTMLAttributes<HTMLDivElement>;

export function Tag({ className, children, ...rest }: TagProps) {
  return (
    <div className={cx('tcl-tag', className)} {...rest}>
      {children}
    </div>
  );
}
`;

const CSS = `@layer tcl.components {
  .tcl-tag {
    font-family: var(--tcl-font-sans);
    color: var(--tcl-text);
  }
}
`;

const CONTRACT = `import type { ComponentContract } from '../../types/contract';

export const tagContract: ComponentContract = {
  name: 'Tag',
  leadJob: 'reveal-state',
  jobs: {
    revealState: { satisfiedBy: 'Tone + label classify at a glance.', story: 'States' },
    affordAction: { satisfiedBy: 'Static mark — presentational.', story: 'Default' },
    acknowledgeInput: { satisfiedBy: 'Static mark — presentational.', story: 'Interaction' },
  },
  a11y: { focusRing: false },
  tokensUsed: ['--tcl-text'],
};
`;

const BARREL = `export { Tag } from './components/Tag/Tag';
export type { TagProps } from './components/Tag/Tag';
`;

export const SCENES: Scene[] = [
  {
    kind: 'title',
    id: 'title',
    durationInFrames: 90,
    eyebrow: 'TREMBUS · MOTION STUDIO',
    title: 'Add a Component',
    subtitle: 'The canonical five-file shape',
    captions: [cap('Every Trembus component ships in one canonical shape.', 8, 86)],
  },
  {
    kind: 'command',
    id: 'scaffold',
    durationInFrames: 120,
    enter: { type: 'fade', frames: 18 },
    prompt: '~/trembus-ui $',
    command: 'node .claude/skills/new-component/scaffold.mjs Tag',
    result: [
      '✓ Scaffolded packages/ui/src/components/Tag/ (5 files)',
      '  and wired its barrel',
    ],
    captions: [
      cap('Start with the scaffold — one command.', 6, 55),
      cap('Five files, plus the barrel, wired for you.', 60, 116),
    ],
  },
  {
    kind: 'filetree',
    id: 'shape',
    durationInFrames: 125,
    enter: { type: 'slide', frames: 18, direction: 'from-right' },
    root: 'packages/ui/src/components/Tag/',
    files: [
      { name: 'Tag.tsx', note: 'the component' },
      { name: 'Tag.css', note: '@layer tcl.components' },
      { name: 'Tag.contract.ts', note: 'the 3-jobs contract' },
      { name: 'Tag.stories.tsx', note: 'Default · States · Interaction' },
      { name: 'Tag.test.tsx', note: 'render + axe a11y' },
    ],
    captions: [
      cap('Always these five — tsx, css, contract, stories, test.', 8, 72),
      cap('A checker enforces the shape on every build.', 76, 120),
    ],
  },
  {
    kind: 'code',
    id: 'tsx',
    durationInFrames: 170,
    enter: { type: 'wipe', frames: 16, direction: 'from-left' },
    filename: 'Tag.tsx',
    language: 'tsx',
    code: TSX,
    caption: 'The component',
    captions: [
      cap('The component: a tokens-only div composing cx.', 8, 96),
      cap('Props extend the native element — no surprises.', 102, 165),
    ],
  },
  {
    kind: 'code',
    id: 'css',
    durationInFrames: 135,
    enter: { type: 'slide', frames: 14, direction: 'from-right' },
    filename: 'Tag.css',
    language: 'css',
    code: CSS,
    caption: 'Styles',
    captions: [
      cap('Styles live in @layer tcl.components.', 8, 68),
      cap('Reference var(--tcl-*) tokens — never a raw hex.', 72, 130),
    ],
  },
  {
    kind: 'code',
    id: 'contract',
    durationInFrames: 180,
    enter: { type: 'slide', frames: 14, direction: 'from-right' },
    filename: 'Tag.contract.ts',
    language: 'tsx',
    code: CONTRACT,
    caption: 'The contract',
    captions: [
      cap('The three UI jobs: reveal, afford, acknowledge.', 8, 100),
      cap('Name the lead job; each points at a real story.', 106, 175),
    ],
  },
  {
    kind: 'code',
    id: 'barrel',
    durationInFrames: 120,
    enter: { type: 'wipe', frames: 16, direction: 'from-left' },
    filename: 'src/index.ts',
    language: 'tsx',
    code: BARREL,
    caption: 'The barrel',
    captions: [
      cap('Export it from the package barrel —', 8, 58),
      cap('value and type. That is the public API.', 62, 116),
    ],
  },
  {
    kind: 'validate',
    id: 'validate',
    durationInFrames: 155,
    enter: { type: 'slide', frames: 18, direction: 'from-bottom' },
    command: 'pnpm --filter @trembus/ui validate',
    steps: [
      'lint',
      'typecheck',
      'check:contracts',
      'test',
      'build',
      'verify:exports',
      'build:storybook',
    ],
    captions: [
      cap('Run the gate before you call it done.', 8, 60),
      cap('Lint, types, contracts, tests, build, exports, stories.', 64, 150),
    ],
  },
  {
    kind: 'outro',
    id: 'outro',
    durationInFrames: 95,
    enter: { type: 'fade', frames: 20 },
    title: 'Tokens → Primitives → Components',
    subtitle: 'That is the shape. Every component carries it.',
    captions: [cap('Tokens, primitives, components — that is the shape.', 8, 90)],
  },
];

/**
 * Total length of the tutorial. A `TransitionSeries` overlaps adjacent sequences
 * by the transition duration, so the whole is the sum of sequence durations minus
 * every transition. The <Composition> reads this so timing stays in sync.
 */
export const totalDurationInFrames = SCENES.reduce(
  (sum, scene, i) => sum + scene.durationInFrames - (i > 0 && scene.enter ? scene.enter.frames : 0),
  0,
);
