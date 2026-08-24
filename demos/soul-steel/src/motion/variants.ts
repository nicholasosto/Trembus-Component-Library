/* ════════════════════════════════════════════════════════════
   Variant RECIPES — the actual payload of this spike.

   The wrapper components in this folder are sugar. These factories are the part
   worth keeping: plain objects, no React, no DOM, no wrapper element. They exist
   because `@trembus/ui`'s primitives are already polymorphic and spread their
   rest props, so a consumer can hand them straight to a primitive and animate it
   with ZERO new components in the tree:

     <Stack as={motion.div} variants={staggerVariants()} initial="hidden" animate="visible">
       <Box as={motion.div} variants={revealVariants()} surface="raised" p={6}>…</Box>
     </Stack>

   That composes better than a `<MotionBox>` ever could — it keeps `Box`'s
   surface/padding/material contract intact and adds motion beside it, instead of
   shadowing it with a parallel component.
   ════════════════════════════════════════════════════════════ */

import type { Variants } from 'motion/react';
import { motionTokens, resolveDuration } from './tokens';
import type { DurationToken } from './tokens';

/**
 * The direction of TRAVEL — `'up'` starts below its resting place and rises into
 * it. `'scale'` grows from 96%; `'fade'` is opacity only.
 */
export type RevealFrom = 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';

export interface RevealVariantOptions {
  /** Direction of travel. Default `'up'`. */
  from?: RevealFrom;
  /** Travel distance in px. Default `12`. Ignored by `'scale'` / `'fade'`. */
  distance?: number;
  /** `--tcl-dur-*` token name, or explicit seconds. Default `'base'`. */
  duration?: DurationToken | number;
  /** Extra delay in seconds before this element starts. Default `0`. */
  delay?: number;
  /**
   * Collapse to an instant, motionless state change. Pass the live value of
   * `useReducedMotion()` — this is the ONE guard that a CSS media query used to
   * give us for free.
   */
  reduced?: boolean;
}

/** The hidden-state offset for a travel direction. */
function offsetFor(from: RevealFrom, distance: number): Record<string, number> {
  switch (from) {
    case 'up':
      return { y: distance };
    case 'down':
      return { y: -distance };
    case 'left':
      return { x: distance };
    case 'right':
      return { x: -distance };
    case 'scale':
      return { scale: 0.96 };
    case 'fade':
      return {};
  }
}

/**
 * Enter variants for a single element, named `hidden` / `visible` so a parent
 * `staggerVariants()` container can orchestrate them by propagation.
 *
 * Under `reduced`, the element is simply present from the first frame — no
 * transform, no fade, no delay. Reduced motion must not degrade into "the same
 * animation but faster"; it degrades into "no animation".
 */
export function revealVariants(options: RevealVariantOptions = {}): Variants {
  const { from = 'up', distance = 12, duration = 'base', delay = 0, reduced = false } = options;

  if (reduced) {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1, transition: { duration: 0 } },
    };
  }

  const tokens = motionTokens();
  return {
    hidden: { opacity: 0, ...offsetFor(from, distance) },
    // `visible` resets every axis so one variant pair serves all directions.
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: { duration: resolveDuration(duration), ease: tokens.calm, delay },
    },
  };
}

export interface StaggerVariantOptions {
  /** Seconds between consecutive children. Defaults to `--tcl-dur-fast` (0.12s). */
  gap?: number;
  /** Seconds before the FIRST child starts. Default `0`. */
  delay?: number;
  /** Live `useReducedMotion()` value — collapses the cascade to instant. */
  reduced?: boolean;
}

/**
 * Container variants that cascade `hidden` → `visible` across descendants.
 *
 * Motion propagates variant STATE to child `motion` components automatically,
 * but only while those children do not declare their own `initial` / `animate` —
 * setting either severs the child from the parent's orchestration. That is why
 * `<Reveal>` checks whether it sits inside a `<Stagger>` before deciding whether
 * to drive itself.
 */
export function staggerVariants(options: StaggerVariantOptions = {}): Variants {
  const { gap, delay = 0, reduced = false } = options;
  const tokens = motionTokens();

  return {
    hidden: {},
    visible: {
      transition: reduced
        ? { staggerChildren: 0, delayChildren: 0 }
        : { staggerChildren: gap ?? tokens.fast, delayChildren: delay },
    },
  };
}
