import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { motionTokens, resolveDuration } from './tokens';
import type { DurationToken } from './tokens';

export interface AnimatedNumberProps {
  /** The true value. The readout tweens toward it whenever it changes. */
  value: number;
  /** Render a frame's value as text. Default rounds and localises. */
  format?: (value: number) => string;
  /** `--tcl-dur-*` token name or explicit seconds. Default `'slow'`. */
  duration?: DurationToken | number;
  /** Where the tween starts on first mount. Default `0`. */
  from?: number;
  className?: string;
}

const defaultFormat = (value: number): string => Math.round(value).toLocaleString();

/**
 * A numeric readout that tweens between values instead of jumping.
 *
 * a11y: the tweening digits are `aria-hidden`, with the true value carried in a
 * `.tcl-sr-only` span alongside. Without that split a screen reader either reads
 * a meaningless mid-tween number, or — with a live region — reads sixty of them.
 * The visually-hidden class comes from `@trembus/ui`'s `a11y.css`, already
 * loaded via `@trembus/ui/styles.css`.
 *
 * The tween is driven by a MotionValue rendered directly as a child, so the
 * frames never touch React state — sixty `setState` calls a second is the naive
 * version of this component and it re-renders the whole subtree each frame.
 */
export function AnimatedNumber({
  value,
  format = defaultFormat,
  duration = 'slow',
  from = 0,
  className,
}: AnimatedNumberProps) {
  const reduced = useReducedMotion() ?? false;
  const tokens = motionTokens();
  const seconds = resolveDuration(duration);

  const current = useMotionValue(reduced ? value : from);
  const text = useTransform(current, (frameValue) => format(frameValue));

  useEffect(() => {
    if (reduced) {
      current.set(value);
      return;
    }
    const controls = animate(current, value, { duration: seconds, ease: tokens.calm });
    return () => controls.stop();
  }, [value, reduced, seconds, current, tokens.calm]);

  return (
    <span className={className}>
      <motion.span aria-hidden="true">{text}</motion.span>
      <span className="tcl-sr-only">{format(value)}</span>
    </span>
  );
}
