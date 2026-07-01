import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { a11yViolations } from '@trembus/tokens/testing';
import { MediaFrame } from './MediaFrame';

// The model-viewer runtime (three.js + WebGL) can't run in jsdom; Effigy imports
// it dynamically, so stub it (matches the Effigy test).
vi.mock('@google/model-viewer', () => ({}));

describe('MediaFrame', () => {
  it('renders an <img> surface for an image with a source', () => {
    const { container } = render(
      <MediaFrame data={{ medium: 'image', ext: 'png', src: 'grass.png', alt: 'grass.png' }} />,
    );
    const img = screen.getByRole('img', { name: 'grass.png' });
    expect(img.tagName).toBe('IMG');
    expect(container.querySelector('.tcl-media-frame')).toHaveAttribute('data-medium', 'image');
  });

  it('renders a compact AudioWaveform for an audio source', () => {
    render(
      <MediaFrame
        data={{ medium: 'audio', ext: 'wav', src: 'sfx.wav', alt: 'sfx.wav', tone: 'info' }}
      />,
    );
    // the compact waveform is a role=img thumbnail with the alt as its name
    expect(screen.getByRole('img', { name: 'sfx.wav' })).toHaveClass('tcl-audio-waveform--compact');
  });

  it('renders an Effigy turntable for a loadable glTF/GLB model', () => {
    const { container } = render(
      <MediaFrame
        data={{ medium: 'model', ext: 'glb', src: 'relic.glb', poster: 'p.png', alt: 'relic.glb' }}
      />,
    );
    expect(container.querySelector('.tcl-media-frame--effigy')).toBeInTheDocument();
    // Effigy stages a <model-viewer> element (inert under the mock)
    expect(container.querySelector('model-viewer')).toBeInTheDocument();
  });

  it('falls back to the poster <img> for a model model-viewer cannot load (.fbx)', () => {
    const { container } = render(
      <MediaFrame data={{ medium: 'model', ext: 'fbx', poster: 'rig.png', alt: 'rig.fbx' }} />,
    );
    expect(container.querySelector('.tcl-media-frame--effigy')).not.toBeInTheDocument();
    const img = screen.getByRole('img', { name: 'rig.fbx' });
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('src', 'rig.png');
  });

  it('renders a box glyph plate for an unloadable model with no poster', () => {
    const { container } = render(
      <MediaFrame data={{ medium: 'model', ext: 'obj', src: 'mesh.obj', alt: 'mesh.obj' }} />,
    );
    const frame = screen.getByRole('img', { name: 'mesh.obj' });
    expect(frame.tagName).toBe('DIV'); // the frame itself carries the name; the glyph is decorative
    expect(container.querySelector('.tcl-media-frame__glyph')).toBeInTheDocument();
  });

  it('renders a glyph plate for a document (markdown via extToGlyph)', () => {
    const { container } = render(
      <MediaFrame data={{ medium: 'doc', ext: 'md', alt: 'README.md', tone: 'success' }} />,
    );
    expect(screen.getByRole('img', { name: 'README.md' })).toBeInTheDocument();
    expect(container.querySelector('.tcl-media-frame__glyph')).toBeInTheDocument();
  });

  it('shows a loading Skeleton with aria-busy when loading', () => {
    const { container } = render(
      <MediaFrame
        loading
        data={{ medium: 'image', ext: 'png', src: 'x.png', alt: 'loading tile' }}
      />,
    );
    const frame = screen.getByRole('img', { name: 'loading tile' });
    expect(frame).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('.tcl-skeleton')).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('shows a placeholder Skeleton when there is no source', () => {
    const { container } = render(
      <MediaFrame data={{ medium: 'image', ext: 'png', alt: 'no source' }} />,
    );
    expect(screen.getByRole('img', { name: 'no source' })).toBeInTheDocument();
    expect(container.querySelector('.tcl-skeleton')).toBeInTheDocument();
  });

  it('promotes the frame to a real button when interactive and fires onActivate', () => {
    const onActivate = vi.fn();
    render(
      <MediaFrame
        interactive
        onActivate={onActivate}
        data={{ medium: 'image', ext: 'png', src: 'hero.png', alt: 'Open hero.png' }}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Open hero.png' });
    fireEvent.click(btn);
    expect(onActivate).toHaveBeenCalledTimes(1);
    // the decorative surface is not a second image role
    expect(screen.queryByRole('img', { name: 'Open hero.png' })).not.toBeInTheDocument();
  });

  it('has no axe violations across the non-3D surfaces', async () => {
    const { container } = render(
      <div>
        <MediaFrame data={{ medium: 'image', ext: 'png', src: 'a.png', alt: 'an image' }} />
        <MediaFrame data={{ medium: 'audio', ext: 'wav', src: 'a.wav', alt: 'an audio clip' }} />
        <MediaFrame data={{ medium: 'doc', ext: 'md', alt: 'a document' }} />
        <MediaFrame loading data={{ medium: 'image', ext: 'png', alt: 'a loading tile' }} />
        <MediaFrame
          interactive
          onActivate={() => undefined}
          data={{ medium: 'image', ext: 'png', src: 'b.png', alt: 'an activatable tile' }}
        />
      </div>,
    );
    expect(await a11yViolations(container)).toEqual([]);
  });
});
