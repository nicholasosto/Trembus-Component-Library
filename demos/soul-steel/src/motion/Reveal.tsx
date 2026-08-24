import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { useIsStaggered } from './stagger-context';
import { revealVariants } from './variants';
import type { RevealFrom } from './variants';
import type { DurationToken } from './tokens';

export interface RevealProps {
  children: ReactNode;
  /** Direction of travel. Default `'up'` (starts below, rises into place). */
  from?: RevealFrom;
  /** Travel distance in px. Default `12`. */
  distance?: number;
  /** `--tcl-dur-*` token name or explicit seconds. Default `'base'`. */
  duration?: DurationToken | number;
  /** Extra delay in seconds. Ignored inside a `<Stagger>` (the cascade owns timing). */
  delay?: number;
  /**
   * `'mount'` plays once as soon as the element mounts; `'in-view'` waits until
   * it is scrolled into view. Ignored inside a `<Stagger>`.
   */
  when?: 'mount' | 'in-view';
  /** For `when="in-view"`: play once, or replay on every re-entry. Default `true`. */
  once?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Reveals its children with a token-timed enter animation.
 *
 * Renders one `<div>`. That wrapper is the honest cost of the component form —
 * it lands between the parent layout and the child, so a `Reveal` used directly
 * inside a grid becomes the grid item. Pass the layout class to the `Reveal`, or
 * skip the wrapper entirely and hand `revealVariants()` to a ui primitive:
 * `<Box as={motion.div} variants={revealVariants()} />`.
 */
export function Reveal({
  children,
  from = 'up',
  distance = 12,
  duration = 'base',
  delay = 0,
  when = 'mount',
  once = true,
  className,
  style,
}: RevealProps) {
  const reduced = useReducedMotion() ?? false;
  const staggered = useIsStaggered();
  const variants = revealVariants({ from, distance, duration, delay, reduced });

  // Inside a <Stagger>, the parent drives `hidden` → `visible` by propagation.
  // Declaring `initial`/`animate` here would sever that link and every child
  // would animate simultaneously — the bug looks like "stagger does nothing".
  if (staggered) {
    return (
      <motion.div className={className} style={style} variants={variants}>
        {children}
      </motion.div>
    );
  }

  if (when === 'in-view') {
    return (
      <motion.div
        className={className}
        style={style}
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount: 0.25 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}
