import { createContext, useContext, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';
import '../../internal/field.css';
import './RadioGroup.css';

interface RadioContextValue {
  name: string;
  value: string | undefined;
  setValue: (v: string) => void;
}

const RadioContext = createContext<RadioContextValue | null>(null);

function useRadioContext(): RadioContextValue {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error('<RadioGroup.Item> must be used within <RadioGroup>.');
  return ctx;
}

export interface RadioGroupProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  description?: string;
  error?: string;
  className?: string;
  children?: ReactNode;
}

function RadioGroupRoot({
  name,
  value: valueProp,
  defaultValue,
  onValueChange,
  label,
  description,
  error,
  className,
  children,
}: RadioGroupProps) {
  const [internal, setInternal] = useState<string | undefined>(defaultValue);
  const value = valueProp ?? internal;
  const baseId = useId();
  const autoName = useId();
  const groupName = name ?? autoName;
  const labelId = label ? `${baseId}-label` : undefined;
  const descId = description ? `${baseId}-desc` : undefined;
  const errId = error ? `${baseId}-err` : undefined;
  const describedBy = [descId, errId].filter(Boolean).join(' ') || undefined;

  const setValue = (v: string): void => {
    if (valueProp === undefined) setInternal(v);
    onValueChange?.(v);
  };

  return (
    <RadioContext.Provider value={{ name: groupName, value, setValue }}>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        className={cx('tcl-radio-group', className)}
      >
        {label && (
          <span id={labelId} className="tcl-field__label">
            {label}
          </span>
        )}
        {description && (
          <p id={descId} className="tcl-field__desc">
            {description}
          </p>
        )}
        <div className="tcl-radio-group__items">{children}</div>
        {error && (
          <p id={errId} className="tcl-field__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </RadioContext.Provider>
  );
}

export interface RadioItemProps {
  value: string;
  label?: ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
}

function RadioItem({ value, label, description, disabled = false, className }: RadioItemProps) {
  const ctx = useRadioContext();
  const checked = ctx.value === value;
  const baseId = useId();
  const descId = description ? `${baseId}-desc` : undefined;

  return (
    <div className={cx('tcl-radio-field', disabled && 'is-disabled', className)}>
      <label className="tcl-radio">
        <input
          type="radio"
          name={ctx.name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={() => ctx.setValue(value)}
          className="tcl-radio__input tcl-sr-only"
          aria-describedby={descId}
        />
        <span className="tcl-radio__dot" aria-hidden="true" />
        {label && <span className="tcl-radio__label">{label}</span>}
      </label>
      {description && (
        <p id={descId} className="tcl-radio__desc">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * `RadioGroup` — an accessible single-choice group (role=radiogroup). Native
 * radios share a name, so Arrow-key navigation + selection come from the
 * browser. Compound API: `<RadioGroup><RadioGroup.Item/></RadioGroup>`.
 */
export const RadioGroup = Object.assign(RadioGroupRoot, { Item: RadioItem });
