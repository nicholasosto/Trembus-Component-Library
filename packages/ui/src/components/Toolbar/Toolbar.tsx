import { createContext, useContext, useLayoutEffect, useRef } from 'react';
import type {
  ButtonHTMLAttributes,
  FocusEvent as ReactFocusEvent,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  Ref,
} from 'react';
import { cx } from '../../utils/cx';
import './Toolbar.css';

type Orientation = 'horizontal' | 'vertical';

interface ToolbarContextValue {
  orientation: Orientation;
  onItemKeyDown: (e: ReactKeyboardEvent<HTMLButtonElement>) => void;
  onItemFocus: (e: ReactFocusEvent<HTMLButtonElement>) => void;
}

const ToolbarContext = createContext<ToolbarContextValue | null>(null);

function useToolbarContext(part: string): ToolbarContextValue {
  const ctx = useContext(ToolbarContext);
  if (!ctx) throw new Error(`<Toolbar.${part}> must be used within <Toolbar>.`);
  return ctx;
}

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  /** Layout + arrow-key axis. Horizontal → ←/→; vertical → ↑/↓. */
  orientation?: Orientation;
}

function ToolbarRoot({ orientation = 'horizontal', className, children, ...rest }: ToolbarProps) {
  const ref = useRef<HTMLDivElement>(null);

  // The roving set = every enabled control that opted in via data-toolbar-item,
  // queried live from the DOM (robust to dynamic/conditional children, and to a
  // Toolbar.Button that is also wrapped as a Menu.Trigger).
  const getItems = (): HTMLButtonElement[] => {
    const root = ref.current;
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLButtonElement>('[data-toolbar-item]')).filter(
      (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true',
    );
  };

  // Roving tabindex: keep exactly one item tabbable as children change. Prefer
  // the item that currently holds focus, so a re-render (e.g. a sibling mounting
  // with the native tabIndex=0 default) can't snatch the tab stop back to the
  // first item and strand the user's focus; otherwise keep an existing single
  // tab stop; otherwise default to the first item.
  useLayoutEffect(() => {
    const items = getItems();
    if (items.length === 0) return;
    const focused = items.find((el) => el === document.activeElement) ?? null;
    const tabbable = items.filter((el) => el.tabIndex === 0);
    const current = focused ?? (tabbable.length === 1 ? tabbable[0] : items[0]);
    for (const el of items) el.tabIndex = el === current ? 0 : -1;
  });

  const focusItem = (el: HTMLButtonElement, items: HTMLButtonElement[]): void => {
    for (const other of items) other.tabIndex = other === el ? 0 : -1;
    el.focus();
  };

  const onItemKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>): void => {
    const items = getItems();
    const idx = items.indexOf(e.currentTarget);
    if (idx < 0) return;
    const horizontal = orientation === 'horizontal';
    const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
    let next = -1;
    if (e.key === nextKey) next = (idx + 1) % items.length;
    else if (e.key === prevKey) next = (idx - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    // The toolbar owns its arrow keys; don't let a nesting container also act.
    e.stopPropagation();
    focusItem(items[next], items);
  };

  // Any item receiving focus (arrow-move, click, or Menu returning focus to its
  // trigger) becomes the sole tab stop.
  const onItemFocus = (e: ReactFocusEvent<HTMLButtonElement>): void => {
    const items = getItems();
    for (const el of items) el.tabIndex = el === e.currentTarget ? 0 : -1;
  };

  return (
    <ToolbarContext.Provider value={{ orientation, onItemKeyDown, onItemFocus }}>
      <div
        ref={ref}
        role="toolbar"
        aria-orientation={orientation}
        className={cx('tcl-toolbar', `tcl-toolbar--${orientation}`, className)}
        {...rest}
      >
        {children}
      </div>
    </ToolbarContext.Provider>
  );
}

export interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Emphasis — `accent` renders the primary/highlighted action. */
  tone?: 'neutral' | 'accent';
  ref?: Ref<HTMLButtonElement>;
}

function ToolbarButton({
  tone = 'neutral',
  type = 'button',
  className,
  onKeyDown,
  onFocus,
  ref,
  children,
  ...rest
}: ToolbarButtonProps) {
  const { onItemKeyDown, onItemFocus } = useToolbarContext('Button');
  return (
    <button
      ref={ref}
      type={type}
      data-toolbar-item=""
      tabIndex={-1}
      className={cx('tcl-toolbar__button', `tcl-toolbar__button--${tone}`, className)}
      onKeyDown={(e) => {
        // The toolbar owns its arrow keys: try to rove first, then fall through
        // to a composed handler (e.g. Menu.Trigger's open-on-ArrowDown) only when
        // this key wasn't a rove. So a menu-trigger button still opens on
        // ArrowDown in a horizontal bar, yet ArrowDown roves in a vertical one.
        onItemKeyDown(e);
        if (!e.defaultPrevented) onKeyDown?.(e);
      }}
      onFocus={(e) => {
        onFocus?.(e);
        onItemFocus(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export type ToolbarSeparatorProps = HTMLAttributes<HTMLDivElement>;

function ToolbarSeparator({ className, ...rest }: ToolbarSeparatorProps) {
  const { orientation } = useToolbarContext('Separator');
  return (
    <div
      role="separator"
      aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
      className={cx('tcl-toolbar__separator', className)}
      {...rest}
    />
  );
}

export type ToolbarGroupProps = HTMLAttributes<HTMLDivElement>;

function ToolbarGroup({ className, children, ...rest }: ToolbarGroupProps) {
  return (
    <div role="group" className={cx('tcl-toolbar__group', className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * `Toolbar` — a compact cluster of controls under one tab stop (the ARIA
 * toolbar pattern). Roving tabindex moves focus with ←/→ (or ↑/↓ when
 * `orientation="vertical"`) plus Home/End; the group presents as a single
 * stop to sequential Tab navigation. Controls opt in via `Toolbar.Button`
 * (which can also be a `Menu.Trigger` for progressive disclosure); group
 * related actions with `Toolbar.Group` and divide clusters with
 * `Toolbar.Separator`. Give the root an `aria-label`. Compound API:
 * `<Toolbar aria-label><Toolbar.Group><Toolbar.Button/></Toolbar.Group><Toolbar.Separator/></Toolbar>`.
 */
export const Toolbar = Object.assign(ToolbarRoot, {
  Button: ToolbarButton,
  Separator: ToolbarSeparator,
  Group: ToolbarGroup,
});
