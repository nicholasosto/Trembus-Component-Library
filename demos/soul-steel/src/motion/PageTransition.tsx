import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { motionTokens } from './tokens';

export interface PageTransitionProps {
  /** Usually `useLocation().pathname`. A change remounts and replays the enter. */
  routeKey: string;
  children: ReactNode;
  className?: string;
}

/**
 * Plays a short enter animation each time the route changes.
 *
 * ENTER ONLY — and that is a deliberate finding, not a shortcut. The obvious
 * next step is to wrap this in `<AnimatePresence>` for an exit too, which is
 * broken with a react-router DATA router: the exiting copy still renders
 * `<Outlet />`, and `<Outlet />` resolves to the CURRENT route. So the element
 * that is supposedly animating the old page out is already displaying the new
 * page's content. You would have to snapshot the outgoing element yourself.
 *
 * The platform now does this better anyway: react-router v7 supports the View
 * Transitions API via `<NavLink viewTransition>`, which captures the real old
 * and new frames at the browser level — cross-fading pages is one prop and zero
 * bytes of JS. Route transitions are the weakest argument for this dependency.
 */
export function PageTransition({ routeKey, children, className }: PageTransitionProps) {
  const reduced = useReducedMotion() ?? false;
  const tokens = motionTokens();

  return (
    <motion.div
      key={routeKey}
      className={className}
      // `initial={false}` skips the enter entirely rather than running it at
      // zero duration — no first-frame flash of the offset position.
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : tokens.base, ease: tokens.calm }}
    >
      {children}
    </motion.div>
  );
}
