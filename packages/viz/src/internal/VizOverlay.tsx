import type { ReactNode } from 'react';
import { cx } from './cx';
import './overlay.css';

export interface VizOverlayProps {
  /** Accessible name for the figure group (the SVG itself is decorative). */
  label: string;
  /** viewBox dimensions; the SVG scales to width with preserveAspectRatio. */
  viewBox: { w: number; h: number };
  /** Decorative edge/grid SVG children (rendered inside an aria-hidden <svg>). */
  edges: ReactNode;
  /** Interactive HTML nodes positioned by % over the SVG (the a11y spine). */
  nodes: ReactNode;
  className?: string;
}

/**
 * The shared "overlay lesson" chrome for node-link viz: a decorative,
 * `aria-hidden`, `preserveAspectRatio` SVG carrying the edges, sibling to an
 * absolutely-positioned layer of real HTML buttons (the nodes) — so node labels
 * never distort and selection stays accessible. The container is a `role="group"`
 * with NO handlers; select/toggle live on the focusable child buttons (the
 * jsx-a11y "handlers on focusable children" rule). Tree uses it now; Lineage
 * will reuse it.
 */
export function VizOverlay({ label, viewBox, edges, nodes, className }: VizOverlayProps) {
  return (
    <div className={cx('tcl-viz-overlay', className)} role="group" aria-label={label}>
      <svg
        className="tcl-viz-overlay__svg"
        viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {edges}
      </svg>
      <div className="tcl-viz-overlay__layer">{nodes}</div>
    </div>
  );
}
