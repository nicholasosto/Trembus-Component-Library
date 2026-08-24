import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { StaggerContext } from './stagger-context';
import { staggerVariants } from './variants';

export interface StaggerProps {
  children: ReactNode;
  /** Seconds between consecutive children. Defaults to `--tcl-dur-fast` (0.12s). */
  gap?: number;
  /** Seconds before the first child starts. Default `0`. */
  delay?: number;
  /** `'mount'` plays on mount; `'in-view'` waits for the container to scroll in. */
  when?: 'mount' | 'in-view';
  /** For `when="in-view"`: play once, or replay on re-entry. Default `true`. */
  once?: boolean;
  /**
   * IMPORTANT: `Stagger` renders a real `<div>`, so it becomes a node in your
   * layout tree. Give it the layout class it replaces — `<Stagger
   * className="soul-grid">`, not `<div className="soul-grid"><Stagger>`.
   */
  className?: string;
  style?: CSSProperties;
}

/**
 * Cascades the enter animation of every descendant `<Reveal>`.
 *
 * The children must be `<Reveal>`s (or any `motion` element carrying
 * `hidden`/`visible` variants) — Motion's stagger works by propagating variant
 * state down the tree, not by inspecting `children`. A plain `<div>` child is
 * simply skipped, silently.
 */
export function Stagger({
  children,
  gap,
  delay = 0,
  when = 'mount',
  once = true,
  className,
  style,
}: StaggerProps) {
  const reduced = useReducedMotion() ?? false;
  const variants = staggerVariants({ gap, delay, reduced });

  const content =
    when === 'in-view' ? (
      <motion.div
        className={className}
        style={style}
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, amount: 0.15 }}
      >
        {children}
      </motion.div>
    ) : (
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

  return <StaggerContext.Provider value={true}>{content}</StaggerContext.Provider>;
}
