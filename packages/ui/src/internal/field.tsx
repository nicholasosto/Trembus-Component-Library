import { useId } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import './field.css';

export interface FieldIds {
  controlId: string;
  describedBy: string | undefined;
  descId: string | undefined;
  errId: string | undefined;
}

/** Generates stable ids and the aria-describedby string for a labeled control. */
export function useFieldIds(
  idProp: string | undefined,
  hasDescription: boolean,
  hasError: boolean,
): FieldIds {
  const auto = useId();
  const controlId = idProp ?? auto;
  const descId = hasDescription ? `${controlId}-desc` : undefined;
  const errId = hasError ? `${controlId}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(' ') || undefined;
  return { controlId, describedBy, descId, errId };
}

export interface FieldShellProps {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  htmlFor: string;
  descId?: string;
  errId?: string;
  className?: string;
  /** The control (input / textarea / select wrapper). */
  children: ReactNode;
}

/**
 * Shared field chrome — label, description, control, and a live error message.
 * The single source of truth for labeled-control layout (Input/Textarea/Select).
 */
export function FieldShell({
  label,
  description,
  error,
  required,
  htmlFor,
  descId,
  errId,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cx('tcl-field', className)}>
      {label && (
        <label htmlFor={htmlFor} className="tcl-field__label">
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
      {children}
      {error && (
        <p id={errId} className="tcl-field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
