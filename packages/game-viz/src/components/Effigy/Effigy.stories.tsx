import type { Meta, StoryObj } from '@storybook/react-vite';
import { Effigy } from './Effigy';
import type { EffigyContract } from './Effigy';

// model-viewer's public demo assets (a low-poly astronaut + matching poster).
const ASTRONAUT = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';
const ASTRONAUT_POSTER = 'https://modelviewer.dev/assets/poster-astronaut.png';

const base: EffigyContract = {
  src: ASTRONAUT,
  alt: 'A low-poly astronaut figurine in a white spacesuit',
  poster: ASTRONAUT_POSTER,
  index: 'RELIC · 001',
  caption: 'The Kept Cosmonaut',
  tone: 'accent',
};

/**
 * The relic stage — an interactive 3D turntable wrapping Google `<model-viewer>` (the
 * repo's first 3D primitive). It presents a glTF/GLB like a museum piece: poster plate,
 * deferred "Load 3D" reveal, orbit + zoom, optional idle auto-rotate with a real pause
 * control, optional AR. The frame chrome (corner reticle, index tab, display-serif
 * caption) is pure decoration around the model.
 *
 * ### When to use it
 * - Showcasing a single 3D asset: relics, characters, props, product turntables.
 * - For a MIXED asset grid (images + audio + models + docs) use `MediaFrame` — it
 *   delegates loadable models to this component.
 * - glTF/GLB only. For `.fbx`/`.obj`/`.blend`/`.rbxm`, show a pre-rendered poster via
 *   `MediaFrame` instead.
 *
 * ### Data & key props
 * - `data.src` + `data.alt` are REQUIRED — `alt` is the model's accessible name.
 * - `data.poster` — shown until reveal. With a poster, `reveal` defaults to
 *   `interaction`: the heavy model download waits behind a real "Load 3D" button.
 *   Without one it defaults to `auto` (fetch near the viewport).
 * - `data.cameraControls` (default true) · `autoRotate` · `ar` · `environmentImage` —
 *   the model-viewer levers, re-exposed declaratively.
 * - `ratio` — the stage's CSS aspect-ratio, default `'1 / 1'`.
 *
 * ### Accessibility
 * - `alt` is enforced by the contract (WCAG 1.1.1 — the non-text alternative).
 * - Load, reveal, and failure are announced through an `aria-live` region; the stage
 *   rings on keyboard focus.
 * - Auto-rotate honors `prefers-reduced-motion` AND pauses on a real `aria-pressed`
 *   control — motion is never unstoppable.
 *
 * ### Behavior & setup
 * - `<model-viewer>` is lazy-imported on mount: browser-only (SSR-safe) and needs a
 *   bundler with dynamic `import()`; its ~300 KB arrives only when an Effigy mounts.
 * - game-viz builds on ui + viz: import all three stylesheets —
 *   `@trembus/ui/styles.css`, `@trembus/viz/styles.css`, `@trembus/game-viz/styles.css`.
 */
const meta = {
  title: 'Game/Effigy',
  component: Effigy,
  // Required `data` prop → default it in meta so render-only stories typecheck.
  args: { data: base },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Effigy>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Job: Reveal State — one authored contract frames a glTF model as a thumbnail.
 * With a poster, the default `reveal: 'interaction'` defers the ~300KB download
 * behind a real "Load 3D" button; clicking it loads the model and the change is
 * announced via aria-live.
 */
export const Default: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Job: Afford Action — the affordances the contract can switch on: deferred
 * tap-to-load, orbit (the default), idle auto-rotate (+ a pause control), AR (a
 * real button, shown by model-viewer only where AR is available), a
 * non-interactive plate, a no-poster placeholder, and the load-fault state.
 */
export const States: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        width: 'min(940px, 92vw)',
      }}
    >
      <Effigy data={{ ...base, index: 'RELIC · 002', caption: 'Tap to load' }} />
      <Effigy
        data={{
          ...base,
          index: 'RELIC · 003',
          caption: 'Auto-rotating',
          reveal: 'auto',
          autoRotate: true,
        }}
      />
      <Effigy
        data={{
          ...base,
          index: 'RELIC · 004',
          caption: 'AR enabled',
          reveal: 'auto',
          ar: true,
          tone: 'success',
        }}
      />
      <Effigy
        data={{
          ...base,
          index: 'RELIC · 005',
          caption: 'Static — no orbit',
          reveal: 'auto',
          cameraControls: false,
          tone: 'info',
        }}
      />
      <Effigy
        data={{
          ...base,
          poster: undefined,
          index: 'RELIC · 006',
          caption: 'No poster (placeholder)',
          tone: 'warning',
        }}
      />
      <Effigy
        data={{
          src: 'https://modelviewer.dev/shared-assets/models/does-not-exist.glb',
          alt: 'A relic that fails to load',
          reveal: 'auto',
          index: 'RELIC · 007',
          caption: 'Load fault',
          tone: 'danger',
        }}
      />
    </div>
  ),
};

/**
 * Job: Acknowledge Input — drag to orbit, scroll to zoom; idle rotation pauses on
 * a real focusable control (aria-pressed) and honors prefers-reduced-motion; the
 * stage rings on focus, and load is announced.
 */
export const Interaction: Story = {
  args: {
    data: {
      ...base,
      index: 'RELIC · 008',
      caption: 'Orbit · zoom · pause',
      reveal: 'auto',
      autoRotate: true,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
};
