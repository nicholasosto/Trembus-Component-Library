import { createContext, useContext, useId, useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import './Tabs.css';

type Orientation = 'horizontal' | 'vertical';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  baseId: string;
  orientation: Orientation;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(part: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<Tabs.${part}> must be used within <Tabs>.`);
  return ctx;
}

export interface TabsProps {
  /** Controlled active value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Called with the tab `value` on click or arrow-key activation. */
  onValueChange?: (value: string) => void;
  /** Layout + arrow-key axis (default `horizontal`). */
  orientation?: Orientation;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

function TabsRoot({
  value: valueProp,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  className,
  style,
  children,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? '');
  const value = valueProp ?? internal;
  const baseId = useId();

  const setValue = (v: string): void => {
    if (valueProp === undefined) setInternal(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext.Provider value={{ value, setValue, baseId, orientation }}>
      <div className={cx('tcl-tabs', `tcl-tabs--${orientation}`, className)} style={style}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children?: ReactNode;
  className?: string;
  /** Names the tab set for assistive tech (or use `aria-labelledby`). */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

function TabsList({ children, className, ...rest }: TabsListProps) {
  const { orientation } = useTabsContext('List');
  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={cx('tcl-tabs__list', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface TabProps {
  /** Pairs this tab with the `Tabs.Panel` of the same value. */
  value: string;
  /** Unreachable by click and skipped by the arrow-key rove (default `false`). */
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

function Tab({ value, disabled = false, children, className }: TabProps) {
  const { value: active, setValue, baseId, orientation } = useTabsContext('Tab');
  const selected = active === value;

  // Roving keyboard nav lives on the tabs (the ARIA tabs pattern), so the
  // tablist container needs no handler.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>): void => {
    const list = e.currentTarget.closest('[role="tablist"]');
    if (!list) return;
    const tabs = Array.from(
      list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'),
    );
    const idx = tabs.indexOf(e.currentTarget);
    if (idx < 0) return;

    const horizontal = orientation === 'horizontal';
    const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
    let next = -1;
    if (e.key === nextKey) next = (idx + 1) % tabs.length;
    else if (e.key === prevKey) next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;

    if (next >= 0) {
      e.preventDefault();
      const el = tabs[next];
      el.focus();
      if (el.dataset.value !== undefined) setValue(el.dataset.value);
    }
  };

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      data-value={value}
      data-state={selected ? 'active' : 'inactive'}
      disabled={disabled}
      className={cx('tcl-tab', selected && 'is-active', className)}
      onClick={() => setValue(value)}
      onKeyDown={onKeyDown}
    >
      {children}
    </button>
  );
}

export interface TabsPanelProps {
  /** Pairs this panel with the `Tabs.Tab` of the same value. */
  value: string;
  children?: ReactNode;
  className?: string;
}

function TabsPanel({ value, children, className }: TabsPanelProps) {
  const { value: active, baseId } = useTabsContext('Panel');
  const selected = active === value;
  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={!selected}
      tabIndex={selected ? 0 : undefined}
      className={cx('tcl-tabpanel', className)}
    >
      {selected ? children : null}
    </div>
  );
}

/**
 * `Tabs` — accessible tabs with the ARIA tablist pattern, roving tabindex, and
 * Arrow/Home/End keyboard navigation (automatic activation). Compound API:
 * `<Tabs><Tabs.List><Tabs.Tab/></Tabs.List><Tabs.Panel/></Tabs>`.
 */
export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Tab,
  Panel: TabsPanel,
});
