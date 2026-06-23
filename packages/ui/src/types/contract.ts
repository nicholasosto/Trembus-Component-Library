// The 3-jobs contract type lives in @trembus/tokens so @trembus/ui and
// @trembus/viz share ONE definition. This shim keeps ui's import paths +
// public barrel surface stable.
export type { UIJob, JobSatisfaction, ComponentContract } from '@trembus/tokens/contract';
