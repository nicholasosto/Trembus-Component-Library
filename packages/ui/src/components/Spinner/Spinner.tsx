import type { HTMLAttributes } from 'react';
import type { StatusTone } from '../../tokens/tokens.types';
import { cx } from '../../utils/cx';
import './Spinner.css';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** `current` inherits the surrounding text color. */
  tone?: 'current' | 'accent' | StatusTone;
  /** Screen-reader label announced while busy. */
  label?: string;
}

export function Spinner({
  size = 'md',
  tone = 'current',
  label = 'Loading',
  className,
  ...rest
}: SpinnerProps) {
  return (
    <span
      className={cx('tcl-spinner', `tcl-spinner--${size}`, `tcl-spinner--tone-${tone}`, className)}
      role="status"
      {...rest}
    >
      <span className="tcl-spinner__ring" aria-hidden="true" />
      <span className="tcl-sr-only">{label}</span>
    </span>
  );
}
