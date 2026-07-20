import type { Ref, TextareaHTMLAttributes } from 'react';
import { FieldShell, useFieldIds } from '../../internal/field';
import { cx } from '../../utils/cx';
import './Textarea.css';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Visible field label; clicking it focuses the textarea. */
  label?: string;
  /** Helper text below the label, wired via `aria-describedby`. */
  description?: string;
  /** Validation message — sets aria-invalid and is announced via role="alert". */
  error?: string;
  /** Class for the outer field shell (the textarea itself takes `className`). */
  containerClassName?: string;
  /** Ref to the underlying `<textarea>`. */
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
