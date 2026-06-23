import type { CSSProperties, HTMLAttributes } from 'react';
import { cx } from '../../utils/cx';
import './Skeleton.css';

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'text' | 'rect' | 'circle';
  width?: number | string;
  height?: number | string;
  /** For variant="text": number of lines (the last is shortened). */
  lines?: number;
}

const dim = (v: number | string | undefined): string | undefined =>
  typeof v === 'number' ? `${v}px` : v;

/**
 * `Skeleton` — a decorative loading placeholder (aria-hidden). The shimmer
 * respects prefers-reduced-motion. Set `aria-busy` on the container that
 * swaps it for real content.
 */
export function Skeleton({
  variant = 'rect',
  width,
  height,
  lines = 1,
  className,
  style,
  ...rest
}: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <span className={cx('tcl-skeleton-group', className)} aria-hidden="true" {...rest}>
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className="tcl-skeleton tcl-skeleton--text"
            style={{ width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </span>
    );
  }

  const mergedStyle: CSSProperties = { width: dim(width), height: dim(height), ...style };
  return (
    <span
      className={cx('tcl-skeleton', `tcl-skeleton--${variant}`, className)}
      style={mergedStyle}
      aria-hidden="true"
      {...rest}
    />
  );
}
