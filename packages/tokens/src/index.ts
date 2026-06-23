/**
 * @trembus/tokens — the shared design-token foundation both @trembus/ui and
 * @trembus/viz stand on. React-free: the `tokens` object is `var(--tcl-*)`
 * strings, the types are plain aliases, the tone vocabulary returns strings.
 *
 * The 3-jobs `ComponentContract` type and the axe a11y test helper live in the
 * `./contract` and `./testing` subpath exports (kept out of the runtime `.`
 * entry so the design-token core has zero test/contract surface).
 */
export { tokens } from './tokens';
export type { Tokens } from './tokens';
export type * from './tokens.types';
export { toneVar, toneFg } from './tone';
export type { Tone } from './tone';
