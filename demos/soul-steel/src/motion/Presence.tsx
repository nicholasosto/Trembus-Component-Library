import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { motionTokens, resolveDuration } from './tokens';
import type { DurationToken } from './tokens';

export interface PresenceProps {
  /**
   * Changing this value swaps the content: the outgoing copy plays its exit,
   * then the incoming copy plays its enter. Usually a selected id or a route.
   */
  contentKey: string | number;
  children: ReactNode;
  /** Direction the INCOMING content travels from. Default `'up'`. */
  from?: 'up' | 'down' | 'left' | 'right' | 'fade';
  /** Travel distance in px. Default `8` — a swap wants less travel than a reveal. */
  distance?: number;
  /** `--tcl-dur-*` token name or explicit seconds. Default `'fast'`. */
  duration?: DurationToken | number;
  className?: string;
  style?: CSSProperties;
}

function offsetFor(from: PresenceProps['from'], distance: number): Record<string, number> {
  switch (from) {
    case 'down':
      return { y: -distance };
    case 'left':
      return { x: distance };
    case 'right':
      return { x: -distance };
    case 'fade':
      return {};
    case 'up':
    default:
      return { y: distance };
  }
}

/**
 * Crossfades content in and out as `contentKey` changes.
 *
 * This is the one primitive here that CSS genuinely cannot replace: an EXIT
 * animation requires keeping a removed node alive past its unmount, which no
 * stylesheet can do. (`@starting-style` covers enter; `transition-behavior:
 * allow-discrete` covers `display` — neither defers a React unmount.)
 *
 * Uses `--tcl-ease-calm` on the way in and `--tcl-ease-exit` on the way out,
 * which is exactly why the token set carries two curves.
 *
 * a11y: do NOT wrap an `aria-live` region in this. The exit copy and the enter
 * copy are both in the DOM during the swap, so a live region announces twice.
 *
 * CAVEAT — `mode="wait"` couples CONTENT to an animation frame. Measured while
 * building this spike: in a hidden document `requestAnimationFrame` never fires
 * (0 frames in 5s, while `setInterval` kept ticking), so the exit never
 * completes and the incoming content never mounts. React state says one thing
 * and the DOM shows another until the tab is focused again. It self-heals on
 * refocus, and nobody is reading a hidden tab — but it is a real difference in
 * kind from CSS, where the swap is a render and the animation is only decor.
 * If a swap can be driven by a timer or a socket rather than a click, prefer
 * the default mode over `"wait"`.
 */
export function Presence({
  contentKey,
  children,
  from = 'up',
  distance = 8,
  duration = 'fast',
  className,
  style,
}: PresenceProps) {
  const reduced = useReducedMotion() ?? false;
  const tokens = motionTokens();
  // Keep the element TYPE identical under reduced motion — swapping
  // `motion.div` for a plain `div` changes the React element type, which
  // unmounts the subtree and resets any state the children were holding.
  const seconds = reduced ? 0 : resolveDuration(duration);
  const offset = reduced ? {} : offsetFor(from, distance);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={contentKey}
        className={className}
        style={style}
        initial={{ opacity: 0, ...offset }}
        animate={{ opacity: 1, x: 0, y: 0, transition: { duration: seconds, ease: tokens.calm } }}
        exit={{ opacity: 0, transition: { duration: seconds, ease: tokens.exit } }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
