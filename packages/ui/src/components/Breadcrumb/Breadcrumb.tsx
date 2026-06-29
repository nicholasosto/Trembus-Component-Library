import { Children } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import { Slot } from '../../utils/Slot';
import './Breadcrumb.css';

export interface BreadcrumbItemData {
  label: ReactNode;
  href?: string;
  /** Mark this crumb as the current page (else the last item is inferred current). */
  current?: boolean;
}

export interface BreadcrumbItemProps {
  href?: string;
  /** Render as the current page — an inert <span aria-current="page">, never a link. */
  current?: boolean;
  /** Lend the crumb's class to a single child element (e.g. a router <Link>). */
  asChild?: boolean;
  className?: string;
  children: ReactNode;
}

export interface BreadcrumbProps {
  /** Declarative crumb path. Omit to compose <Breadcrumb.Item> children instead. */
  items?: BreadcrumbItemData[];
  /** Accessible name for the navigation landmark. */
  'aria-label'?: string;
  /** Decorative glyph rendered between crumbs. */
  separator?: ReactNode;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

function BreadcrumbItem({ href, current, asChild, className, children }: BreadcrumbItemProps) {
  // asChild wins over `current`: lend the crumb styling (and current state) to
  // the consumer's own element rather than wrapping it — wrapping a link in a
  // current <span> would leave the current crumb activatable (a WCAG smell).
  // Only assert aria-current when `current` is explicit; when omitted, pass
  // nothing so a wrapped router link keeps its own aria-current (Slot's merge
  // would otherwise override the child's value).
  if (asChild) {
    const currentProps =
      current !== undefined ? { 'aria-current': current ? ('page' as const) : undefined } : {};
    return (
      <Slot className={cx('tcl-breadcrumb__link', className)} {...currentProps}>
        {children}
      </Slot>
    );
  }
  if (current) {
    return (
      <span className={cx('tcl-breadcrumb__current', className)} aria-current="page">
        {children}
      </span>
    );
  }
  if (href !== undefined) {
    return (
      <a className={cx('tcl-breadcrumb__link', className)} href={href}>
        {children}
      </a>
    );
  }
  return <span className={cx('tcl-breadcrumb__text', className)}>{children}</span>;
}

function BreadcrumbRoot({
  items,
  separator = '›',
  className,
  style,
  children,
  'aria-label': ariaLabel = 'Breadcrumb',
}: BreadcrumbProps) {
  let entries: ReactNode[];
  if (items) {
    const hasExplicitCurrent = items.some((it) => it.current);
    entries = items.map((item, i) => (
      <BreadcrumbItem
        key={i}
        href={item.href}
        current={item.current ?? (!hasExplicitCurrent && i === items.length - 1)}
      >
        {item.label}
      </BreadcrumbItem>
    ));
  } else {
    entries = Children.toArray(children);
  }

  return (
    <nav aria-label={ariaLabel} className={cx('tcl-breadcrumb-nav', className)} style={style}>
      <ol className="tcl-breadcrumb">
        {entries.map((entry, i) => (
          <li key={i} className="tcl-breadcrumb__item">
            {i > 0 && (
              <span className="tcl-breadcrumb__sep" aria-hidden="true">
                {separator}
              </span>
            )}
            {entry}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * `Breadcrumb` — the location trail. Reveals where you are in a hierarchy
 * (current crumb marked `aria-current="page"`) and affords navigating up via
 * ancestor links. Use the declarative `items` array or compose
 * `<Breadcrumb.Item>` children (with `asChild` to wrap a router link).
 */
export const Breadcrumb = Object.assign(BreadcrumbRoot, { Item: BreadcrumbItem });
