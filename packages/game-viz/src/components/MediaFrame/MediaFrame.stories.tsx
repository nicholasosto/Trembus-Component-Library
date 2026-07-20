import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { MediaFrame } from './MediaFrame';

/** A tiny self-contained SVG poster so the gallery is offline + deterministic. */
function poster(label: string, hue: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='hsl(${hue} 46% 46%)'/><text x='50' y='55' font-size='11' fill='white' text-anchor='middle' font-family='sans-serif'>${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * The polymorphic asset tile — one surface that inspects its `data` and renders the
 * right medium: `image` → framed `<img>` · `audio` → playable waveform (ui
 * `AudioWaveform`) · loadable `model` (glb/gltf) → `Effigy` turntable · unloadable
 * model with a `poster` → the poster · `doc`/anything else → a glyph plate; the
 * `loading` flag → a `Skeleton`. Built as the asset-browser tile: a mixed grid where
 * every file type gets the same chrome.
 *
 * ### When to use it
 * - Grids and galleries of MIXED asset types (the asset-studio / command-center tile).
 * - A single known medium deserves its dedicated surface instead: `Effigy` for one
 *   model, ui `AudioWaveform` for one clip, a plain `<img>` in a ui `Card` for one image.
 *
 * ### Data & key props
 * - `data.medium` + `data.ext` + `data.alt` are required — `alt` IS the accessible name.
 * - `interactive` — promotes the frame to a real focusable button firing `onActivate`
 *   (click / Enter / Space). Not applied when the surface is the 3D turntable, which
 *   owns its own pointer and controls.
 * - `data.poster` — the reveal frame for a model, or a stand-in for the image itself.
 * - `data.glyph` — force a specific glyph on the doc/fallback plate.
 * - `ratio` — tile aspect, default `'1 / 1'` · `loading` — force the Skeleton state.
 *
 * ### Accessibility
 * - Every surface carries `data.alt` as its name; the glyph plate is `role="img"`.
 * - Tone tints the chrome but the file identity always lives in the alt text — never
 *   color alone.
 * - `interactive` frames show the shared focus ring and press feedback of a real button.
 *
 * ### Theming & setup
 * - Most at home in `data-theme="reliquary"`; correct in light and dark too.
 * - game-viz builds on ui + viz: import all three stylesheets —
 *   `@trembus/ui/styles.css`, `@trembus/viz/styles.css`, `@trembus/game-viz/styles.css`.
 */
const meta = {
  title: 'Game/MediaFrame',
  component: MediaFrame,
  args: {
    data: {
      medium: 'image',
      ext: 'png',
      src: poster('IMG', 210),
      alt: 'texture_grass.png',
      tone: 'accent',
    },
    ratio: '1 / 1',
  },
} satisfies Meta<typeof MediaFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Job: Afford Action — the frame is decorative chrome; with `interactive` it is a
 * real focusable button. Here, a static image poster.
 */
export const Default: Story = {
  render: (args): ReactElement => (
    <div style={{ width: 200 }}>
      <MediaFrame {...args} />
    </div>
  ),
};

/**
 * Job: Reveal State — one surface per format: image poster · audio waveform · 3D
 * turntable (glTF/GLB) · a poster for formats model-viewer can't load (.fbx) · a
 * glyph plate for docs · a box glyph for an unloadable model with no poster · a
 * forced loading Skeleton · a no-source placeholder. Tone is always paired with
 * the alt text.
 */
export const States: Story = {
  render: (): ReactElement => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 150px)', gap: 16 }}>
      <MediaFrame
        data={{ medium: 'image', ext: 'png', src: poster('IMG', 210), alt: 'grass.png' }}
      />
      <MediaFrame
        data={{ medium: 'audio', ext: 'wav', src: 'stinger.wav', alt: 'stinger.wav', tone: 'info' }}
      />
      <MediaFrame
        data={{
          medium: 'model',
          ext: 'glb',
          src: 'relic.glb',
          poster: poster('3D', 280),
          alt: 'relic.glb',
          tone: 'warning',
        }}
      />
      <MediaFrame
        data={{
          medium: 'model',
          ext: 'fbx',
          poster: poster('FBX', 20),
          alt: 'rig.fbx',
          tone: 'danger',
        }}
      />
      <MediaFrame data={{ medium: 'doc', ext: 'md', alt: 'README.md', tone: 'success' }} />
      <MediaFrame data={{ medium: 'doc', ext: 'ts', alt: 'index.ts', tone: 'neutral' }} />
      <MediaFrame
        data={{ medium: 'model', ext: 'obj', src: 'mesh.obj', alt: 'mesh.obj (no poster)' }}
      />
      <MediaFrame
        loading
        data={{ medium: 'image', ext: 'png', alt: 'loading tile', tone: 'accent' }}
      />
      <MediaFrame data={{ medium: 'image', ext: 'png', alt: 'no source', tone: 'neutral' }} />
    </div>
  ),
};

/**
 * Job: Acknowledge Input — an `interactive` frame is a real button: it shows a
 * focus ring, press feedback, and fires `onActivate` on click + Enter/Space.
 */
export const Interaction: Story = {
  args: {
    interactive: true,
    onActivate: () => undefined,
    data: {
      medium: 'image',
      ext: 'png',
      src: poster('OPEN', 160),
      alt: 'Open concept_hero.png',
      tone: 'accent',
    },
  },
  render: (args): ReactElement => (
    <div style={{ width: 200 }}>
      <MediaFrame {...args} />
    </div>
  ),
};
