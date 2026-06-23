import { useEffect, useId } from 'react';
import type { ReactNode } from 'react';
import { Portal } from '../../utils/Portal';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useReturnFocus } from '../../hooks/useReturnFocus';
import { cx } from '../../utils/cx';
import './Dialog.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  className?: string;
}

/**
 * `Dialog` — a focus-trapped modal. Proves the portal + focus-trap + ARIA spine
 * that Tooltip/Menu/Toast/Select reuse. On open it moves focus inside, traps
 * Tab, locks scroll, and closes on Esc / overlay press; on close it returns
 * focus to the element that opened it.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  // Capture the trigger BEFORE the trap moves focus inside, so it can be restored.
  useReturnFocus(open);
  const contentRef = useFocusTrap<HTMLDivElement>(open);

  // Escape to close.
  useEffect(() => {
    if (!open || !closeOnEsc) return;
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, closeOnEsc, onClose]);

  // Press outside the content to close (keyboard users use Escape).
  useEffect(() => {
    if (!open || !closeOnOverlayClick) return;
    const onPointerDown = (e: PointerEvent): void => {
      const node = contentRef.current;
      if (node && !node.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, closeOnOverlayClick, onClose, contentRef]);

  // Lock background scroll while open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <Portal>
      <div className="tcl-dialog__overlay">
        <div
          ref={contentRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cx('tcl-dialog', `tcl-dialog--${size}`, className)}
        >
          {title && (
            <h2 id={titleId} className="tcl-dialog__title">
              {title}
            </h2>
          )}
          {description && (
            <p id={descId} className="tcl-dialog__desc">
              {description}
            </p>
          )}
          {children != null && <div className="tcl-dialog__body">{children}</div>}
          {footer && <div className="tcl-dialog__footer">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}
