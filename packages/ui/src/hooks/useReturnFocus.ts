import { useEffect, useRef } from 'react';

/**
 * When `active` becomes true, remembers the currently focused element and
 * restores focus to it when `active` goes false / the component unmounts.
 */
export function useReturnFocus(active: boolean): void {
  const previous = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    previous.current = (document.activeElement as HTMLElement | null) ?? null;
    return () => {
      previous.current?.focus?.();
    };
  }, [active]);
}
