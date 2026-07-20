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
  /** Trigger for THIS level (a <button> at the root, a menuitem <div> in a submenu). */
  triggerRef: RefObject<HTMLElement | null>;
  /** Content for THIS level. */
  contentRef: RefObject<HTMLDivElement | null>;
  triggerId: string;
  contentId: string;
  /** Set by a Menu.Label so the menu is named by its header, not the trigger. */
  labelId: string | null;
  setLabelId: (id: string | null) => void;
  /** Close the whole menu tree and return focus to the root trigger. */
  closeAll: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

function useMenuContext(part: string): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error(`<Menu.${part}> must be used within <Menu>.`);
  return ctx;
}

/** Menuitems that belong directly to `content` (not to a nested submenu). */
function ownItems(content: HTMLElement): HTMLElement[] {
  return Array.from(
    content.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'),
  ).filter((el) => el.closest('[role="menu"]') === content);
}

export interface MenuProps {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial open state (default `false`). */
  defaultOpen?: boolean;
  /** Called on every open/close, controlled or not. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

function MenuRoot({ open: openProp, defaultOpen = false, onOpenChange, children }: MenuProps) {
  const [internal, setInternal] = useState(defaultOpen);
  const open = openProp ?? internal;
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [labelId, setLabelId] = useState<string | null>(null);
  const baseId = useId();

  const setOpen = (o: boolean): void => {
    if (openProp === undefined) setInternal(o);
    onOpenChange?.(o);
  };

  const closeAll = (): void => {
    setOpen(false);
    triggerRef.current?.focus();
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
        labelId,
        setLabelId,
        closeAll,
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
  /** Horizontal alignment against the trigger (default `start`; `end` right-aligns). */
  align?: 'start' | 'end';
  /** Which side of the trigger the menu opens toward. `top` suits a bottom-docked bar. */
  side?: 'bottom' | 'top';
}

function MenuContent({
  align = 'start',
  side = 'bottom',
  className,
  children,
  ...rest
}: MenuContentProps) {
  const { open, setOpen, triggerRef, contentRef, triggerId, contentId, labelId } =
    useMenuContext('Content');
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 0 });

  // Position from the trigger rect (fixed → viewport coords), measuring the
  // content so we can flip above the trigger or right-align without a transform
  // (which would fight the open animation). Track scroll/resize.
  useLayoutEffect(() => {
    if (!open) return;
    const update = (): void => {
      const t = triggerRef.current;
      if (!t) return;
      const r = t.getBoundingClientRect();
      const c = contentRef.current;
      const h = c?.offsetHeight ?? 0;
      const w = c?.offsetWidth ?? 0;
      setPos({
        top: side === 'top' ? r.top - h - 4 : r.bottom + 4,
        left: align === 'end' ? r.right - w : r.left,
        minWidth: r.width,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, align, side, triggerRef, contentRef]);

  // Focus management + keyboard nav for THIS menu's own items. Events that
  // originate inside a nested submenu are ignored here (that submenu owns them).
  useEffect(() => {
    if (!open) return;
    const content = contentRef.current;
    if (!content) return;
    ownItems(content)[0]?.focus();

    const onKeyDown = (e: KeyboardEvent): void => {
      // Tab is never part of a menu's focus order — it collapses the whole tree
      // from any level. A submenu keydown bubbles here (SubContent doesn't handle
      // Tab), so this closes the root even when focus is inside a submenu.
      if (e.key === 'Tab') {
        setOpen(false);
        return;
      }
      const target = e.target as HTMLElement;
      if (target.closest('[role="menu"]') !== content) return; // from a submenu
      const list = ownItems(content);
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
        // Escape dismisses ONE layer: don't let it bubble to a Dialog (or other
        // Escape-closing surface) the menu was opened from.
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    content.addEventListener('keydown', onKeyDown);
    return () => content.removeEventListener('keydown', onKeyDown);
  }, [open, contentRef, setOpen, triggerRef]);

  // Press outside (excluding the trigger) closes. A submenu is a DOM descendant
  // of this content, so presses inside it count as inside.
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
        aria-labelledby={labelId ?? triggerId}
        className={cx('tcl-menu', className)}
        style={{ position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.minWidth }}
        {...rest}
      >
        {children}
      </div>
    </Portal>
  );
}

export interface MenuItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Called on activation (click / Enter / Space); selecting collapses the whole menu tree. */
  onSelect?: () => void;
  /** Inert item (aria-disabled, skipped by roving focus); default `false`. */
  disabled?: boolean;
}

function MenuItem({ onSelect, disabled = false, className, children, ...rest }: MenuItemProps) {
  const { closeAll } = useMenuContext('Item');
  const activate = (): void => {
    if (disabled) return;
    onSelect?.();
    closeAll();
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

export interface MenuLabelProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

function MenuLabel({ className, children, ...rest }: MenuLabelProps) {
  const { setLabelId } = useMenuContext('Label');
  const id = useId();
  useEffect(() => {
    setLabelId(id);
    return () => setLabelId(null);
  }, [id, setLabelId]);
  return (
    <div role="presentation" id={id} className={cx('tcl-menu__label', className)} {...rest}>
      {children}
    </div>
  );
}

export type MenuSeparatorProps = HTMLAttributes<HTMLDivElement>;

function MenuSeparator({ className, ...rest }: MenuSeparatorProps) {
  return <div role="separator" className={cx('tcl-menu__separator', className)} {...rest} />;
}

export interface MenuSubProps {
  children?: ReactNode;
}

function MenuSub({ children }: MenuSubProps) {
  const parent = useContext(MenuContext);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [labelId, setLabelId] = useState<string | null>(null);
  const baseId = useId();

  return (
    <MenuContext.Provider
      value={{
        open,
        setOpen,
        triggerRef,
        contentRef,
        triggerId: `${baseId}-subtrigger`,
        contentId: `${baseId}-submenu`,
        labelId,
        setLabelId,
        // Selecting a submenu item collapses the entire tree, not just this level.
        closeAll: parent ? parent.closeAll : () => setOpen(false),
      }}
    >
      <div className="tcl-menu__sub">{children}</div>
    </MenuContext.Provider>
  );
}

export interface MenuSubTriggerProps extends HTMLAttributes<HTMLDivElement> {
  disabled?: boolean;
}

function MenuSubTrigger({ disabled = false, className, children, ...rest }: MenuSubTriggerProps) {
  const { open, setOpen, triggerRef, triggerId, contentId } = useMenuContext('SubTrigger');
  const openSub = (): void => {
    if (!disabled) setOpen(true);
  };
  return (
    <div
      ref={triggerRef as unknown as Ref<HTMLDivElement>}
      role="menuitem"
      tabIndex={-1}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? contentId : undefined}
      aria-disabled={disabled || undefined}
      id={triggerId}
      className={cx('tcl-menu__item tcl-menu__subtrigger', disabled && 'is-disabled', className)}
      onClick={() => (open ? setOpen(false) : openSub())}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openSub();
        }
      }}
      {...rest}
    >
      {children}
      <span aria-hidden className="tcl-menu__subcaret">
        ▸
      </span>
    </div>
  );
}

export type MenuSubContentProps = HTMLAttributes<HTMLDivElement>;

function MenuSubContent({ className, children, ...rest }: MenuSubContentProps) {
  const { open, setOpen, triggerRef, contentRef, contentId, triggerId, labelId } =
    useMenuContext('SubContent');
  const [flipLeft, setFlipLeft] = useState(false);

  // Collision-aware side. A submenu renders inline and defaults to opening to the
  // right (`.tcl-menu--sub` → left:100%). If that would push it past the viewport's
  // right edge AND there's room on the left, flip it (`.tcl-menu--sub-left` →
  // right:100%). We measure the SUBTRIGGER rect — stable no matter which side the
  // submenu ends up on, so there's no flip↔flip feedback — plus the submenu's own
  // width. Mirrors MenuContent's measure-on-open; re-checks on scroll/resize.
  useLayoutEffect(() => {
    if (!open) return;
    const update = (): void => {
      const t = triggerRef.current;
      const c = contentRef.current;
      if (!t || !c) return;
      const r = t.getBoundingClientRect();
      const w = c.offsetWidth;
      // ≈ the --tcl-space-1 margin plus a little viewport breathing room.
      const gap = 8;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      // vw === 0 → viewport unknown (e.g. a headless/detached render); assume there's
      // room and keep the right-open default rather than flipping every submenu.
      const overflowsRight = vw > 0 && r.right + gap + w > vw;
      const fitsLeft = r.left - gap - w >= 0;
      setFlipLeft(overflowsRight && fitsLeft);
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, triggerRef, contentRef]);

  // Own roving + close on ArrowLeft/Escape → focus the subtrigger. We stop the
  // handled keys from bubbling to the parent menu's listener.
  useEffect(() => {
    if (!open) return;
    const content = contentRef.current;
    if (!content) return;
    ownItems(content)[0]?.focus();

    const onKeyDown = (e: KeyboardEvent): void => {
      const list = ownItems(content);
      if (list.length === 0) return;
      const idx = list.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        list[(idx + 1) % list.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        list[(idx - 1 + list.length) % list.length]?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        e.stopPropagation();
        list[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        e.stopPropagation();
        list[list.length - 1]?.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    content.addEventListener('keydown', onKeyDown);
    return () => content.removeEventListener('keydown', onKeyDown);
  }, [open, contentRef, setOpen, triggerRef]);

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
    <div
      ref={contentRef}
      role="menu"
      id={contentId}
      aria-labelledby={labelId ?? triggerId}
      className={cx('tcl-menu', 'tcl-menu--sub', flipLeft && 'tcl-menu--sub-left', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * `Menu` — a dropdown menu (ARIA menu button pattern). The trigger gets
 * aria-haspopup/expanded/controls; the content renders in a portal with roving
 * focus among menuitems. The root menu dismisses on Escape / outside-press / Tab
 * and returns focus to the trigger; Tab collapses the whole tree from any level.
 * Supports a titled `Menu.Label`, a `Menu.Separator`, upward placement
 * (`side="top"`), and nested submenus (`Menu.Sub` / `Menu.SubTrigger` /
 * `Menu.SubContent`) opened with →/Enter — where ←/Escape backs out one level and
 * selecting any item collapses the whole tree. A submenu opens to the right, and
 * flips to the left of its trigger row when opening right would overflow the
 * viewport (measured on open + scroll/resize). Safe to open from inside a modal
 * `Dialog`: content stacks on the popover layer (above the dialog overlay), and
 * Escape / an inside press dismiss only the menu, never the dialog under it.
 * Compound API:
 * `<Menu><Menu.Trigger><Button/></Menu.Trigger><Menu.Content><Menu.Item/></Menu.Content></Menu>`.
 */
export const Menu = Object.assign(MenuRoot, {
  Trigger: MenuTrigger,
  Content: MenuContent,
  Item: MenuItem,
  Label: MenuLabel,
  Separator: MenuSeparator,
  Sub: MenuSub,
  SubTrigger: MenuSubTrigger,
  SubContent: MenuSubContent,
});
