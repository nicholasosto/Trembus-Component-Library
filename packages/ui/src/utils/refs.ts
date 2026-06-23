import { useCallback } from 'react';
import type { Ref, RefCallback } from 'react';

/** Assign a value to a callback or object ref. */
export function setRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref != null) {
    (ref as { current: T | null }).current = value;
  }
}

/** Combine multiple refs into one callback ref. */
export function composeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    for (const ref of refs) setRef(ref, node);
  };
}

/** Memoized {@link composeRefs} for use inside components. */
export function useComposedRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(composeRefs(...refs), refs);
}
