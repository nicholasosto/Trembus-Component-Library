// Tiny className combiner — a verbatim copy of @trembus/ui's util so @trembus/viz
// stays free of any dependency on @trembus/ui (it depends on @trembus/tokens only).
export type ClassValue = string | number | false | null | undefined;

/** Filters falsy values and joins with spaces. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
