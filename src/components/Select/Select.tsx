import type { ReactNode, Ref, SelectHTMLAttributes } from 'react';
import { FieldShell, useFieldIds } from '../../internal/field';
import { cx } from '../../utils/cx';
import './Select.css';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  description?: string;
  error?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Shown as a disabled first option when no value is set. */
  placeholder?: string;
  containerClassName?: string;
  ref?: Ref<HTMLSelectElement>;
  /** <option> / <optgroup> elements. */
  children: ReactNode;
}

export function Select({
  label,
  description,
  error,
  size = 'md',
  placeholder,
  id,
  className,
  containerClassName,
  disabled,
  required,
  ref,
  children,
  ...rest
}: SelectProps) {
  const { controlId, describedBy, descId, errId } = useFieldIds(id, !!description, !!error);
  const isControlled = 'value' in rest || 'defaultValue' in rest;

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
          'tcl-select',
          `tcl-select--${size}`,
          error && 'is-invalid',
          disabled && 'is-disabled',
        )}
      >
        <select
          id={controlId}
          ref={ref}
          className={cx('tcl-select__control', className)}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          defaultValue={placeholder !== undefined && !isControlled ? '' : undefined}
          {...rest}
        >
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <span className="tcl-select__chevron" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </FieldShell>
  );
}
