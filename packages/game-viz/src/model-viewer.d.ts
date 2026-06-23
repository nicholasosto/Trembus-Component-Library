// JSX typing for Google's <model-viewer> custom element, used by Effigy.
// Lives here (not in a 6th file inside the component dir) so Effigy keeps its
// canonical 5-file shape, and separate from global.d.ts because this MUST be a
// module (it augments `react` and exports a type), whereas global.d.ts must stay
// a script (a top-level import there silently drops its `declare module '*.css'`
// global ambient — the documented CSS-import gotcha).
//
// React 19 hosts the JSX namespace inside the `react` module, so we augment there
// rather than the old global `JSX`. Boolean attributes are passed from the
// component as `true | undefined` (undefined → the attribute is omitted), which
// sidesteps custom-element boolean-reflection quirks.
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

/**
 * The subset of model-viewer's imperative element API that Effigy relies on.
 * `dismissPoster` is optional because the method only exists once the custom
 * element has upgraded (after the lazy import resolves) — in jsdom / SSR it is
 * absent, so callers use `?.()`.
 */
export interface ModelViewerElement extends HTMLElement {
  /** Reveal the model + dismiss the poster (only meaningful with reveal="manual"). */
  dismissPoster?(): void;
}

interface ModelViewerAttributes extends HTMLAttributes<HTMLElement> {
  src?: string;
  /** The model's accessible name (model-viewer reflects it to aria-label). */
  alt?: string;
  poster?: string;
  /** When to fetch the model. */
  loading?: 'auto' | 'lazy' | 'eager';
  /** When to reveal the model. NOTE: model-viewer 4.x only supports auto | manual. */
  reveal?: 'auto' | 'manual';
  'camera-controls'?: boolean;
  'disable-zoom'?: boolean;
  'auto-rotate'?: boolean;
  'rotation-per-second'?: string;
  'interaction-prompt'?: 'auto' | 'none';
  'camera-orbit'?: string;
  'field-of-view'?: string;
  'shadow-intensity'?: number | string;
  exposure?: number | string;
  'environment-image'?: string;
  'tone-mapping'?: 'auto' | 'aces' | 'agx' | 'commerce' | 'neutral';
  ar?: boolean;
  'ar-modes'?: string;
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': DetailedHTMLProps<ModelViewerAttributes, ModelViewerElement>;
    }
  }
}
