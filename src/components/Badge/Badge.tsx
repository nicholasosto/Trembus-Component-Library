import type { HTMLAttributes, ReactNode } from 'react';
import type { StatusTone } from '../../tokens/tokens.types';
import { cx } from '../../utils/cx';
import './Badge.css';

export type BadgeTone = StatusTone | 'accent';

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'color'> {
  /** Status/intent — the color-coded ontology. */
  tone?: BadgeTone;
  variant?: 'soft' | 'solid' | 'outline';
  size?: 'sm' | 'md';
  /** Leading status dot glyph. */
  dot?: boolean;
  children?: ReactNode;
}

export function Badge({
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  dot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cx(
        'tcl-badge',
        `tcl-badge--${variant}`,
        `tcl-badge--${tone}`,
        `tcl-badge--${size}`,
        className,
      )}
      {...rest}
    >
      {dot && <span className="tcl-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
