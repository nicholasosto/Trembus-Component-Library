import { useCallback, useRef, useState } from 'react';

/**
 * Drill-down navigation state for semantic-zoom viz (the "progressive details"
 * engine). A single `focusId` names the currently-opened container; `undefined`
 * is the top / root level. Drill state is inherently internal UI state, so this
 * is uncontrolled with a `defaultFocusId` seed plus an `onFocus` observer (mirrors
 * how Tree seeds its collapsed set). The navigation verbs (enter a child, climb to
 * a parent, jump to a breadcrumb) all reduce to `setFocus(id | undefined)` — the
 * caller supplies the parent map, so this hook stays layout-agnostic and reusable
 * across any nested node-link diagram.
 */
export function useDrilldown(
  defaultFocusId: string | undefined,
  onFocus?: (id: string | undefined) => void,
): readonly [string | undefined, (id: string | undefined) => void] {
  const [focusId, setInternal] = useState<string | undefined>(defaultFocusId);
  // Keep the latest observer in a ref so `setFocus` can stay referentially stable
  // yet always call the current `onFocus` — avoids the stale-closure trap when a
  // caller passes an inline arrow that reads its own render-scoped state.
  const onFocusRef = useRef(onFocus);
  onFocusRef.current = onFocus;
  const setFocus = useCallback((id: string | undefined): void => {
    setInternal(id);
    onFocusRef.current?.(id);
  }, []);
  return [focusId, setFocus] as const;
}
