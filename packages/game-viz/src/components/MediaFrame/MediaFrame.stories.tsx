import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { MediaFrame } from './MediaFrame';

/** A tiny self-contained SVG poster so the gallery is offline + deterministic. */
function poster(label: string, hue: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='hsl(${hue} 46% 46%)'/><text x='50' y='55' font-size='11' fill='white' text-anchor='middle' font-family='sans-serif'>${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

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
