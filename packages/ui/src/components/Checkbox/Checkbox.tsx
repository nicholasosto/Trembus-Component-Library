import { useEffect, useId, useRef } from 'react';
import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../../utils/cx';
import { useComposedRefs } from '../../utils/refs';
import './Checkbox.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: ReactNode;
  description?: string;
  /** Tri-state — shows a dash and sets the DOM `indeterminate` property. */
  indeterminate?: boolean;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({
  label,
  description,
  indeterminate = false,
  disabled,
  className,
  id,
  ref,
  ...rest
}: CheckboxProps) {
  const innerRef = useRef<HTMLInputElement>(null);
  const mergedRef = useComposedRefs(innerRef, ref);
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = description ? `${inputId}-desc` : undefined;

  useEffect(() => {
    if (innerRef.current) innerRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div className={cx('tcl-checkbox-field', disabled && 'is-disabled', className)}>
      <label className="tcl-checkbox">
        <input
          id={inputId}
          ref={mergedRef}
          type="checkbox"
          className="tcl-checkbox__input tcl-sr-only"
          disabled={disabled}
          aria-describedby={descId}
          {...rest}
        />
        <span className="tcl-checkbox__box" aria-hidden="true">
          <svg className="tcl-checkbox__check" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5L4.8 8.8L9.5 3.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {label && <span className="tcl-checkbox__label">{label}</span>}
      </label>
      {description && (
        <p id={descId} className="tcl-checkbox__desc">
          {description}
        </p>
      )}
    </div>
  );
}
