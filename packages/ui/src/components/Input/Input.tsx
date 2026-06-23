import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { FieldShell, useFieldIds } from '../../internal/field';
import { cx } from '../../utils/cx';
import './Input.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  description?: string;
  /** Validation message — sets aria-invalid and is announced via role="alert". */
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  startSlot?: ReactNode;
  endSlot?: ReactNode;
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
