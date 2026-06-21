import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
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
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = description ? `${inputId}-desc` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('tcl-field', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="tcl-field__label">
          {label}
          {required && (
            <span className="tcl-field__req" aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {description && (
        <p id={descId} className="tcl-field__desc">
          {description}
        </p>
      )}
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
          id={inputId}
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
      {error && (
        <p id={errId} className="tcl-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
