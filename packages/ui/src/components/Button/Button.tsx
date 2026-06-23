import type { ReactNode, Ref, SyntheticEvent } from 'react';
import { Pressable } from '../../primitives/Pressable/Pressable';
import type { StatusTone } from '../../tokens/tokens.types';
import { cx } from '../../utils/cx';
import './Button.css';

export type ButtonTone = 'accent' | StatusTone;

export interface ButtonProps {
  variant?: 'solid' | 'outline' | 'ghost';
  /** Intent — maps to the color-coded ontology. */
  tone?: ButtonTone;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Lend Button's style + behavior to your own element (single child). */
  asChild?: boolean;
  startSlot?: ReactNode;
  endSlot?: ReactNode;
  onPress?: (event: SyntheticEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children?: ReactNode;
  /** Forwarded to the underlying <button> (or the asChild element). */
  ref?: Ref<HTMLButtonElement>;
  'aria-label'?: string;
}

export function Button({
  variant = 'solid',
  tone = 'accent',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  asChild = false,
  startSlot,
  endSlot,
  onPress,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cx(
    'tcl-button',
    `tcl-button--${variant}`,
    `tcl-button--${tone}`,
    `tcl-button--${size}`,
    fullWidth && 'tcl-button--full',
    loading && 'is-loading',
    className,
  );

  if (asChild) {
    // Pass-through mode: caller supplies the single element; no slots/spinner.
    return (
      <Pressable
        asChild
        className={classes}
        disabled={disabled}
        loading={loading}
        onPress={onPress}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <Pressable
      className={classes}
      disabled={disabled}
      loading={loading}
      onPress={onPress}
      {...rest}
    >
      {loading && <span className="tcl-button__spinner" aria-hidden="true" />}
      {startSlot && <span className="tcl-button__icon">{startSlot}</span>}
      {children != null && <span className="tcl-button__label">{children}</span>}
      {endSlot && <span className="tcl-button__icon">{endSlot}</span>}
    </Pressable>
  );
}
