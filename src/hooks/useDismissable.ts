import { useEffect } from 'react';
import type { RefObject } from 'react';

export interface UseDismissableOptions {
  enabled?: boolean;
  /** Fires on Escape or a pointer press outside `ref`. */
  onDismiss: () => void;
  ref: RefObject<HTMLElement | null>;
}

/** Calls `onDismiss` on Escape or an outside pointer-down. */
export function useDismissable({ enabled = true, onDismiss, ref }: UseDismissableOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onDismiss();
    };
    const onPointerDown = (e: PointerEvent): void => {
      const node = ref.current;
      if (node && !node.contains(e.target as Node)) onDismiss();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [enabled, onDismiss, ref]);
}
