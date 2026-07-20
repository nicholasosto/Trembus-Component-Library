import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import './SkipLink.css';

export interface SkipLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** In-page target to jump to. Defaults to the main landmark (`#main`). */
  href?: string;
  /** Link text (default `"Skip to main content"`). */
  children?: ReactNode;
}

/**
 * `SkipLink` — the bypass-blocks affordance (WCAG 2.4.1). Visually hidden until
 * focused; the first Tab on a page reveals it at the top-left so a keyboard or
 * screen-reader user can jump straight past the nav to the main landmark. The
 * hidden baseline and the `:focus` reveal are self-contained (same layer) so the
 * reveal never depends on cross-layer ordering.
 */
export function SkipLink({
  href = '#main',
  className,
  children = 'Skip to main content',
  ...rest
}: SkipLinkProps) {
  return (
    <a href={href} className={cx('tcl-skip-link', className)} {...rest}>
      {children}
    </a>
  );
}
