import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../../utils/cx';
import './Switch.css';

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'role'
> {
  /** Visible name; the whole label is the click target. */
  label?: ReactNode;
  /** Helper text below the control, wired via `aria-describedby`. */
  description?: string;
  /** Ref to the underlying `<input role="switch">`. */
  ref?: Ref<HTMLInputElement>;
}

export function Switch({ label, description, disabled, className, id, ref, ...rest }: SwitchProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = description ? `${inputId}-desc` : undefined;

  return (
    <div className={cx('tcl-switch-field', disabled && 'is-disabled', className)}>
      <label className="tcl-switch">
        <input
          id={inputId}
          ref={ref}
          type="checkbox"
          role="switch"
          className="tcl-switch__input tcl-sr-only"
          disabled={disabled}
          aria-describedby={descId}
          {...rest}
        />
        <span className="tcl-switch__track" aria-hidden="true">
          <span className="tcl-switch__thumb" />
        </span>
        {label && <span className="tcl-switch__label">{label}</span>}
      </label>
      {description && (
        <p id={descId} className="tcl-switch__desc">
          {description}
        </p>
      )}
    </div>
  );
}
