import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Portal } from '../../utils/Portal';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useReturnFocus } from '../../hooks/useReturnFocus';
import { cx } from '../../utils/cx';
import './Dialog.css';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

/**
 * The expand/collapse marks. Drawn locally rather than pulled from
 * `@trembus/icons`: the registry has no maximize/minimize glyph, and a literal
 * `⤢` character is a font-coverage gamble on a control that must always read.
 * Same contract as an icons glyph — 1em, currentColor, decorative.
 */
function ExpandMark({ expanded }: { expanded: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-glyph={expanded ? 'collapse' : 'expand'}
    >
      {expanded ? (
        // inward arrows — corners pulled toward the centre
        <>
          <path d="M9 3v6H3" />
          <path d="M15 21v-6h6" />
          <path d="M15 9l6-6" />
          <path d="M9 15l-6 6" />
        </>
      ) : (
        // outward arrows — corners pushed to the edges
        <>
          <path d="M15 3h6v6" />
          <path d="M9 21H3v-6" />
          <path d="M21 3l-6 6" />
          <path d="M3 21l6-6" />
        </>
      )}
    </svg>
  );
}

export interface DialogProps {
  /** Controls visibility — the dialog is fully controlled (keep this in state). */
  open: boolean;
  /** Called when the user dismisses (Escape / overlay press); also call it from your footer actions. */
  onClose: () => void;
  /** Heading text, wired to the dialog via `aria-labelledby`. */
  title?: string;
  /** Supporting text, wired via `aria-describedby`. */
  description?: string;
  children?: ReactNode;
  /** Action-row slot rendered below the body (host your Buttons here). */
  footer?: ReactNode;
  /**
   * Panel width preset (default `md`). `sm|md|lg` (360/480/640) suit forms and
   * confirmations; **`xl` (960) and `full`** host the data-dense and visualization
   * components, which outgrow `lg` — `Brief` alone wants 760.
   *
   * `full` also gives the panel a RESOLVED height, which is what windowed and
   * measuring children (`VirtualAssetGrid`, `Hub`, `Swimlane`, `Timeline`, the viz
   * maps) need in order to lay out: at the content-sized presets they see an
   * unbounded box.
   */
  size?: DialogSize;
  /**
   * Render an expand/collapse control in the header that toggles between `size`
   * and `full`. Uncontrolled unless you pass `expanded`.
   */
  expandable?: boolean;
  /** Controlled expanded state — pair with `onExpandedChange`. */
  expanded?: boolean;
  /** Uncontrolled initial expanded state (default `false`). */
  defaultExpanded?: boolean;
  /** Fires on every expand/collapse, controlled or not. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Accessible name for the control when collapsed (default `'Expand dialog'`). */
  expandLabel?: string;
  /** Accessible name for the control when expanded (default `'Collapse dialog'`). */
  collapseLabel?: string;
  /** Press outside the panel to close (default `true`); presses inside a portaled `[role="menu"]` are exempt. */
  closeOnOverlayClick?: boolean;
  /** Escape closes (default `true`). */
  closeOnEsc?: boolean;
  className?: string;
}

/**
 * `Dialog` — a focus-trapped modal. Proves the portal + focus-trap + ARIA spine
 * that Tooltip/Menu/Toast/Select reuse. On open it moves focus inside, traps
 * Tab, locks scroll, and closes on Esc / overlay press; on close it returns
 * focus to the element that opened it.
 *
 * The panel is a flex column: the header and footer are pinned and the BODY
 * scrolls, so a long table keeps its action row and title on screen. Sizes run
 * `sm|md|lg` for forms up to `xl`/`full` for the data-dense and visualization
 * components; `expandable` adds a header control that toggles to `full` and back.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  expandable = false,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  expandLabel = 'Expand dialog',
  collapseLabel = 'Collapse dialog',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  className,
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const expanded = expandedProp ?? internalExpanded;
  const toggleExpanded = (): void => {
    const next = !expanded;
    if (expandedProp === undefined) setInternalExpanded(next);
    onExpandedChange?.(next);
  };
  // Expanding never shrinks the panel: `full` wins over the base preset.
  const effectiveSize: DialogSize = expandable && expanded ? 'full' : size;
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

  // Press outside the content to close (keyboard users use Escape). A press
  // inside a portaled popup opened from the dialog (e.g. a Menu — its content
  // renders in a <body> portal on the popover layer, ABOVE the overlay) is not
  // "outside": only something stacked over the overlay can receive the press.
  useEffect(() => {
    if (!open || !closeOnOverlayClick) return;
    const onPointerDown = (e: PointerEvent): void => {
      const node = contentRef.current;
      const target = e.target as Node;
      if (!node || node.contains(target)) return;
      if (target instanceof Element && target.closest('[role="menu"]')) return;
      onClose();
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
          className={cx('tcl-dialog', `tcl-dialog--${effectiveSize}`, className)}
        >
          {(title || expandable) && (
            <div className="tcl-dialog__header">
              {title && (
                <h2 id={titleId} className="tcl-dialog__title">
                  {title}
                </h2>
              )}
              {expandable && (
                <button
                  type="button"
                  className="tcl-dialog__expand"
                  aria-label={expanded ? collapseLabel : expandLabel}
                  onClick={toggleExpanded}
                >
                  <ExpandMark expanded={expanded} />
                </button>
              )}
            </div>
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
