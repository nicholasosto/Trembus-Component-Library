import type { Ref, TextareaHTMLAttributes } from 'react';
import { FieldShell, useFieldIds } from '../../internal/field';
import { cx } from '../../utils/cx';
import './Textarea.css';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  description?: string;
  /** Validation message — sets aria-invalid and is announced via role="alert". */
  error?: string;
  containerClassName?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({
  label,
  description,
  error,
  id,
  className,
  containerClassName,
  disabled,
  required,
  rows = 4,
  ref,
  ...rest
}: TextareaProps) {
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
      <textarea
        id={controlId}
        ref={ref}
        rows={rows}
        className={cx('tcl-textarea', error && 'is-invalid', className)}
        disabled={disabled}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
    </FieldShell>
  );
}
