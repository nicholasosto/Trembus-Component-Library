// Tiny className combiner. @trembus/ui exports `cx`, but re-declaring the
// one-liner here keeps component internals import-light and identical to the
// @trembus/viz convention.
export type ClassValue = string | number | false | null | undefined;

/** Filters falsy values and joins with spaces. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
