// Tokens now live in the shared @trembus/tokens package. This shim preserves
// @trembus/ui's internal import paths AND its public barrel surface unchanged.
export { tokens } from '@trembus/tokens';
export type { Tokens } from '@trembus/tokens';
