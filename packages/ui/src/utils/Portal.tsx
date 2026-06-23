import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  children: ReactNode;
  /** Mount target. Defaults to `document.body`. */
  container?: HTMLElement | null;
}

/**
 * Renders children into a DOM node outside the React tree (defaults to
 * `document.body`). Rendered synchronously so a parent's focus/measure effects
 * see the mounted content on the same commit. Returns null during SSR.
 */
export function Portal({ children, container }: PortalProps): ReactNode {
  if (typeof document === 'undefined') return null;
  const target = container ?? document.body;
  return createPortal(children, target);
}
