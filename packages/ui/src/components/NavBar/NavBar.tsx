import { Children } from 'react';
import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Slot } from '../../utils/Slot';
import './NavBar.css';

export interface NavBarLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** Destination for the built-in `<a>`; unused in `asChild` mode. */
  href?: string;
  /**
   * Mark as the current destination (sets aria-current="page"). In `asChild`
   * mode, omit this and let the wrapped router link own aria-current.
   */
  active?: boolean;
  /** Lend the link's class to a single child element (e.g. a router <NavLink>). */
  asChild?: boolean;
}

export interface NavBarProps {
  /** Accessible name for the navigation landmark (e.g. "Primary"). */
  'aria-label'?: string;
  className?: string;
  style?: CSSProperties;
  /** `NavBar.Link` entries; each child is wrapped in its own list item. */
  children?: ReactNode;
}

function NavBarLink({ href, active, asChild, className, children, ...rest }: NavBarLinkProps) {
  const cls = cx('tcl-navbar__link', className);
  if (asChild) {
    // Only assert aria-current when `active` is explicit; when omitted, pass
    // nothing so a wrapped router link keeps its own aria-current (Slot's merge
    // would otherwise override the child's value).
    const currentProps =
      active !== undefined ? { 'aria-current': active ? ('page' as const) : undefined } : {};
    return (
      <Slot className={cls} {...currentProps}>
        {children}
      </Slot>
    );
  }
  return (
    <a className={cls} href={href} aria-current={active ? 'page' : undefined} {...rest}>
      {children}
    </a>
  );
}

function NavBarRoot({
  className,
  style,
  children,
  'aria-label': ariaLabel = 'Primary',
}: NavBarProps) {
  return (
    <nav aria-label={ariaLabel} className={cx('tcl-navbar', className)} style={style}>
      <ul className="tcl-navbar__list">
        {Children.map(children, (child) => (
          <li className="tcl-navbar__item">{child}</li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * `NavBar` — a labelled bar of primary navigation links. Routing-agnostic:
 * `NavBar.Link` takes a plain `href` (+ `active`) or wraps a consumer's router
 * link via `asChild`. The active destination is styled off `aria-current="page"`,
 * set by `active` or by the wrapped router link itself.
 */
export const NavBar = Object.assign(NavBarRoot, { Link: NavBarLink });
