import type { CSSProperties, ReactElement } from 'react';
import { AudioWaveform, Pressable, Skeleton } from '@trembus/ui';
import { Glyph, extToGlyph } from '@trembus/icons';
import { Effigy } from '../Effigy/Effigy';
import { cx } from '../../internal/cx';
import './MediaFrame.css';

export type MediaFrameTone = 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'neutral';

/** The format category that drives which surface is rendered. */
export type MediaMedium = 'image' | 'audio' | 'model' | 'doc';

export interface MediaFrameData {
  /** Format category — chooses the surface (image poster · audio waveform · 3D turntable · doc plate). */
  medium: MediaMedium;
  /** Optional MIME / sub-type, carried through for the consumer (not required for rendering). */
  mediumType?: string;
  /** Asset URL. */
  src?: string;
  /** Pre-rendered poster image — the reveal frame for a 3D model, or a stand-in for an image. */
  poster?: string;
  /** File extension without the dot (e.g. `png`, `glb`, `fbx`, `wav`, `md`). */
  ext: string;
  /** Accessible name for the surface (required — never colour alone). */
  alt: string;
  /** Tone for the frame chrome + placeholder tint (default `accent`). */
  tone?: MediaFrameTone;
  /** Explicit glyph name for the doc / fallback plate (overrides the medium/ext default). */
  glyph?: string;
}

export interface MediaFrameProps {
  data: MediaFrameData;
  /** CSS aspect-ratio of the frame. Default `'1 / 1'`. */
  ratio?: string;
  /** Render as a real focusable button that fires `onActivate` (not applied to the 3D turntable, which owns its own controls). */
  interactive?: boolean;
  /** Force the loading (Skeleton) state. */
  loading?: boolean;
  onActivate?: () => void;
  className?: string;
}

type View = 'skeleton' | 'image' | 'audio' | 'effigy' | 'glyph';

/** Extensions <model-viewer> can actually load; everything else needs a poster or a glyph. */
const MODEL_LOADABLE = new Set(['glb', 'gltf']);

function resolveView(data: MediaFrameData, loading: boolean): View {
  if (loading) return 'skeleton';
  switch (data.medium) {
    case 'image':
      return data.src || data.poster ? 'image' : 'skeleton';
    case 'audio':
      return data.src ? 'audio' : 'skeleton';
    case 'model':
      if (data.src && MODEL_LOADABLE.has(data.ext.toLowerCase())) return 'effigy';
      if (data.poster) return 'image'; // .fbx/.blend/.rbxm/.obj → pre-rendered poster
      if (data.src) return 'glyph'; // unloadable model, no poster → a model glyph plate
      return 'skeleton';
    case 'doc':
      return 'glyph';
    default:
      return data.src || data.poster ? 'image' : 'glyph';
  }
}

function glyphFor(data: MediaFrameData): string {
  if (data.glyph) return data.glyph;
  if (data.medium === 'model') return 'box';
  if (data.medium === 'image') return 'image';
  return extToGlyph(`x.${data.ext}`); // md→markdown, code→lang, else the generic file glyph
}

function Brackets(): ReactElement {
  return (
    <span className="tcl-media-frame__brackets" aria-hidden="true">
      <span className="tcl-media-frame__bracket is-tl" />
      <span className="tcl-media-frame__bracket is-tr" />
      <span className="tcl-media-frame__bracket is-bl" />
      <span className="tcl-media-frame__bracket is-br" />
    </span>
  );
}

/**
 * `MediaFrame` — one format-aware media surface for an asset. Lead job **Reveal
 * State**: it picks the right surface from `data.medium` — an `<img>` poster for
 * images, a compact `AudioWaveform` for audio, an `Effigy` turntable for loadable
 * 3D (glTF/GLB) or a poster for formats `model-viewer` can't load, a `Glyph` plate
 * for docs, and a tone-tinted `Skeleton` while loading or when there is no source.
 * The bracket-cornered frame + tint are decorative (`aria-hidden`); the accessible
 * spine is the surface's own name (`alt`), and `interactive` promotes the frame to
 * a real focusable button.
 */
export function MediaFrame({
  data,
  ratio = '1 / 1',
  interactive = false,
  loading = false,
  onActivate,
  className,
}: MediaFrameProps): ReactElement {
  const view = resolveView(data, loading);
  const tone = data.tone ?? 'accent';
  const style = { aspectRatio: ratio } as CSSProperties;

  // The 3D turntable is self-contained (own frame, reticle, load button + keyboard
  // canvas), so it is rendered bare — never wrapped in MediaFrame's own button.
  if (view === 'effigy') {
    return (
      <div
        className={cx('tcl-media-frame', 'tcl-media-frame--effigy', className)}
        data-tone={tone}
        data-medium="model"
      >
        <Effigy
          data={{ src: data.src as string, alt: data.alt, poster: data.poster, tone }}
          ratio={ratio}
        />
      </div>
    );
  }

  const content: ReactElement =
    view === 'image' ? (
      <img
        className="tcl-media-frame__img"
        src={data.src ?? data.poster}
        alt={interactive ? '' : data.alt}
        loading="lazy"
      />
    ) : view === 'audio' ? (
      <AudioWaveform
        className="tcl-media-frame__audio"
        src={data.src as string}
        label={data.alt}
        tone={tone}
        compact
      />
    ) : view === 'glyph' ? (
      <span className="tcl-media-frame__plate" aria-hidden="true">
        <Glyph name={glyphFor(data)} className="tcl-media-frame__glyph" />
      </span>
    ) : (
      <Skeleton className="tcl-media-frame__skeleton" variant="rect" width="100%" height="100%" />
    );

  // Interactive: a real button owns the accessible name; the surface is decorative.
  if (interactive) {
    return (
      <Pressable
        className={cx('tcl-media-frame', 'tcl-media-frame--interactive', className)}
        data-tone={tone}
        data-medium={data.medium}
        aria-label={data.alt}
        onPress={() => onActivate?.()}
        style={style}
      >
        <span className="tcl-media-frame__inner" aria-hidden="true">
          {content}
        </span>
        <Brackets />
      </Pressable>
    );
  }

  // Non-interactive: image/audio surfaces carry their own accessible name…
  if (view === 'image' || view === 'audio') {
    return (
      <figure
        className={cx('tcl-media-frame', className)}
        data-tone={tone}
        data-medium={data.medium}
        style={style}
      >
        {content}
        <Brackets />
      </figure>
    );
  }

  // …a glyph/skeleton surface is decorative, so the frame carries the name.
  return (
    <div
      role="img"
      aria-label={data.alt}
      aria-busy={view === 'skeleton' && loading ? true : undefined}
      className={cx('tcl-media-frame', className)}
      data-tone={tone}
      data-medium={data.medium}
      style={style}
    >
      {content}
      <Brackets />
    </div>
  );
}
