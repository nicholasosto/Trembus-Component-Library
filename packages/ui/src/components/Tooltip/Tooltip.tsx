import { useEffect, useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode, Ref } from 'react';
import { Portal } from '../../utils/Portal';
import { Slot } from '../../utils/Slot';
import { cx } from '../../utils/cx';
import './Tooltip.css';

export interface TooltipProps {
  /** The supplemental text revealed on hover/focus. */
  content: ReactNode;
  /** A single interactive element to attach the tooltip to. */
  children: ReactElement;
  /** Delay before showing on hover (ms, default 400). Focus shows immediately. */
  openDelay?: number;
  /** Placement relative to the trigger (default `top`). */
  side?: 'top' | 'bottom';
  className?: string;
}

export function Tooltip({
  content,
  children,
  openDelay = 400,
  side = 'top',
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();

  const computePos = (): void => {
    const t = triggerRef.current;
    if (!t) return;
    const r = t.getBoundingClientRect();
    setPos({ top: side === 'top' ? r.top - 8 : r.bottom + 8, left: r.left + r.width / 2 });
  };

  const show = (): void => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      computePos();
      setOpen(true);
    }, openDelay);
  };
  const showNow = (): void => {
    window.clearTimeout(timer.current);
    computePos();
    setOpen(true);
  };
  const hide = (): void => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') hide();
    };
    const onReflow = (): void => computePos();
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, side]);

  return (
    <>
      <Slot
        ref={triggerRef as unknown as Ref<HTMLElement>}
        aria-describedby={open ? id : undefined}
        onPointerEnter={show}
        onPointerLeave={hide}
        onFocus={showNow}
        onBlur={hide}
      >
        {children}
      </Slot>
      {open && (
        <Portal>
          <div
            role="tooltip"
            id={id}
            className={cx('tcl-tooltip', `tcl-tooltip--${side}`, className)}
            style={{ position: 'fixed', top: pos.top, left: pos.left }}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}
