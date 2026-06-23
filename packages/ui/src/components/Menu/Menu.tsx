import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { HTMLAttributes, ReactElement, ReactNode, Ref, RefObject } from 'react';
import { Portal } from '../../utils/Portal';
import { Slot } from '../../utils/Slot';
import { cx } from '../../utils/cx';
import './Menu.css';

interface MenuContextValue {
  open: boolean;
  setOpen: (o: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  triggerId: string;
  contentId: string;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext(part: string): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error(`<Menu.${part}> must be used within <Menu>.`);
  return ctx;
}

export interface MenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

function MenuRoot({ open: openProp, defaultOpen = false, onOpenChange, children }: MenuProps) {
  const [internal, setInternal] = useState(defaultOpen);
  const open = openProp ?? internal;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const setOpen = (o: boolean): void => {
    if (openProp === undefined) setInternal(o);
    onOpenChange?.(o);
  };

  return (
    <MenuContext.Provider
      value={{
        open,
        setOpen,
        triggerRef,
        contentRef,
        triggerId: `${baseId}-trigger`,
        contentId: `${baseId}-menu`,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export interface MenuTriggerProps {
  /** A single interactive element (e.g. <Button>) to act as the trigger. */
  children: ReactElement;
}

function MenuTrigger({ children }: MenuTriggerProps) {
  const { open, setOpen, triggerRef, triggerId, contentId } = useMenuContext('Trigger');
  return (
    <Slot
      ref={triggerRef as unknown as Ref<HTMLElement>}
      id={triggerId}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? contentId : undefined}
      onClick={() => setOpen(!open)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
        }
      }}
    >
      {children}
    </Slot>
  );
}

export interface MenuContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end';
}

function MenuContent({ align = 'start', className, children, ...rest }: MenuContentProps) {
  const { open, setOpen, triggerRef, contentRef, triggerId, contentId } = useMenuContext('Content');
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 0 });

  // Position from the trigger rect (fixed → viewport coords). Track scroll/resize.
  useLayoutEffect(() => {
    if (!open) return;
    const update = (): void => {
      const t = triggerRef.current;
      if (!t) return;
      const r = t.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: align === 'end' ? r.right : r.left, minWidth: r.width });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, align, triggerRef]);

  // Focus management + keyboard nav.
  useEffect(() => {
    if (!open) return;
    const content = contentRef.current;
    if (!content) return;
    const items = (): HTMLElement[] =>
      Array.from(
        content.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'),
      );
    items()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent): void => {
      const list = items();
      if (list.length === 0) return;
      const idx = list.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        list[(idx + 1) % list.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        list[(idx - 1 + list.length) % list.length]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        list[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        list[list.length - 1]?.focus();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'Tab') {
        setOpen(false);
      }
    };
    content.addEventListener('keydown', onKeyDown);
    return () => content.removeEventListener('keydown', onKeyDown);
  }, [open, contentRef, setOpen, triggerRef]);

  // Press outside (excluding the trigger) closes.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent): void => {
      const target = e.target as Node;
      if (contentRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, contentRef, triggerRef, setOpen]);

  if (!open) return null;

  return (
    <Portal>
      <div
        ref={contentRef}
        role="menu"
        id={contentId}
        aria-labelledby={triggerId}
        className={cx('tcl-menu', className)}
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          minWidth: pos.minWidth,
          transform: align === 'end' ? 'translateX(-100%)' : undefined,
        }}
        {...rest}
      >
        {children}
      </div>
    </Portal>
  );
}

export interface MenuItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  onSelect?: () => void;
  disabled?: boolean;
}

function MenuItem({ onSelect, disabled = false, className, children, ...rest }: MenuItemProps) {
  const { setOpen, triggerRef } = useMenuContext('Item');
  const activate = (): void => {
    if (disabled) return;
    onSelect?.();
    setOpen(false);
    triggerRef.current?.focus();
  };
  return (
    <div
      role="menuitem"
      tabIndex={-1}
      aria-disabled={disabled || undefined}
      className={cx('tcl-menu__item', disabled && 'is-disabled', className)}
      onClick={activate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * `Menu` — a dropdown menu (ARIA menu button pattern). The trigger gets
 * aria-haspopup/expanded/controls; the content renders in a portal with roving
 * focus among menuitems, and dismisses on Escape / outside-press / Tab —
 * returning focus to the trigger. Compound API:
 * `<Menu><Menu.Trigger><Button/></Menu.Trigger><Menu.Content><Menu.Item/></Menu.Content></Menu>`.
 */
export const Menu = Object.assign(MenuRoot, {
  Trigger: MenuTrigger,
  Content: MenuContent,
  Item: MenuItem,
});
