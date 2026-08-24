import { createContext, useContext } from 'react';

/**
 * True for any subtree rendered inside a `<Stagger>`.
 *
 * Motion orchestrates a cascade by PROPAGATING variant state from parent to
 * child — which only works while the child leaves `initial` / `animate` unset.
 * A `<Reveal>` that always drove itself would render correctly on its own and
 * silently ignore its `<Stagger>` parent, so it reads this flag and steps back.
 */
export const StaggerContext = createContext(false);

/** Whether the calling component is being orchestrated by a `<Stagger>` parent. */
export function useIsStaggered(): boolean {
  return useContext(StaggerContext);
}
