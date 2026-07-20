import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { FieldShell, useFieldIds } from '../../internal/field';
import { cx } from '../../utils/cx';
import './Input.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** The accessible name — a real `<label>` wired to the control (clicking it focuses). */
  label?: string;
  /** Helper text, joined into the input's aria-describedby. */
  description?: string;
  /** Validation message — sets aria-invalid and is announced via role="alert". */
  error?: string;
  /** Control height preset (default `md`). */
  size?: 'sm' | 'md' | 'lg';
  /** Leading adornment (icon, prefix) inside the field frame. */
  startSlot?: ReactNode;
  /** Trailing adornment (icon, unit) inside the field frame. */
  endSlot?: ReactNode;
  /** Class for the outer field shell (label + control + messages). */
  containerClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Input({
  label,
  description,
  error,
  size = 'md',
  startSlot,
  endSlot,
  id,
  className,
  containerClassName,
  disabled,
  required,
  ref,
  ...rest
}: InputProps) {
  const { controlId, describedBy, descId, errId } = useFieldIds(id, !!description, !!error);

  return (
    <FieldShell
      label={label}
      description={description}
      error={error}
      required={required}
      htmlFor={controlId}
      descId={descId}
      errId={errId}
      className={containerClassName}
    >
      <div
        className={cx(
          'tcl-input',
          `tcl-input--${size}`,
          error && 'is-invalid',
          disabled && 'is-disabled',
        )}
      >
        {startSlot && <span className="tcl-input__slot">{startSlot}</span>}
        <input
          id={controlId}
          ref={ref}
          className={cx('tcl-input__control', className)}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        {endSlot && <span className="tcl-input__slot">{endSlot}</span>}
      </div>
    </FieldShell>
  );
}
