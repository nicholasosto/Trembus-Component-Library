/* ════════════════════════════════════════════════════════════
   Motion primitives — a SPIKE, not a library.

   This folder is the prototype for a possible `@trembus/motion` package. It
   lives in the demo on purpose: `demos/*` is off the `validate` gate, so it can
   carry a third-party dependency (`motion@12`) and be thrown away at no cost.
   Nothing here is published, and nothing in `packages/*` imports it.

   Read `MOTION-SPIKE.md` (this demo's root) for what the spike found and the
   recommendation it leads to.

   The layering, cheapest to most opinionated:

     tokens.ts     the CSS → JS bridge (--tcl-dur-* / --tcl-ease-*)
     variants.ts   pure variant factories — no React, no wrapper element
     <Reveal>      one element's enter
     <Stagger>     cascades its children's enters
     <Presence>    exit + enter on a key change  ← only one CSS can't do
     <AnimatedNumber>  a tweened numeric readout
     <PageTransition>  route-change enter
   ════════════════════════════════════════════════════════════ */

export { motionTokens, resolveDuration, resetMotionTokens } from './tokens';
export type { Bezier, DurationToken, MotionTokens } from './tokens';

export { revealVariants, staggerVariants } from './variants';
export type { RevealFrom, RevealVariantOptions, StaggerVariantOptions } from './variants';

export { Reveal } from './Reveal';
export type { RevealProps } from './Reveal';

export { Stagger } from './Stagger';
export type { StaggerProps } from './Stagger';

export { Presence } from './Presence';
export type { PresenceProps } from './Presence';

export { AnimatedNumber } from './AnimatedNumber';
export type { AnimatedNumberProps } from './AnimatedNumber';

export { PageTransition } from './PageTransition';
export type { PageTransitionProps } from './PageTransition';
