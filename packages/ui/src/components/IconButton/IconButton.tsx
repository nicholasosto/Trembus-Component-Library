import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import type { ButtonProps } from '../Button/Button';
import { cx } from '../../utils/cx';
import { isDev } from '../../utils/env';
import './IconButton.css';

export interface IconButtonProps
  extends Omit<ButtonProps, 'children' | 'startSlot' | 'endSlot' | 'fullWidth'> {
  /** Required — an icon-only control must carry its own accessible name. */
  'aria-label': string;
  /** The icon (or any single glyph node). */
  children: ReactNode;
}

/**
 * `IconButton` — a compact, square affordance for a single icon. Composes
 * `Button` (so it inherits every tone/variant), and *requires* an `aria-label`
 * because an icon has no text to name it (Job #2, Afford Action: the capability
 * must be reachable and named).
 */
export function IconButton({
  variant = 'ghost',
  size = 'md',
  className,
  children,
  ...rest
}: IconButtonProps) {
  if (isDev && !rest['aria-label']) {
    console.warn('[IconButton] requires an `aria-label` to give the icon an accessible name.');
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cx('tcl-icon-button', `tcl-icon-button--${size}`, className)}
      {...rest}
    >
      {children}
    </Button>
  );
}
