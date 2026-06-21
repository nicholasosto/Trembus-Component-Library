export type ClassValue = string | number | false | null | undefined;

/** Tiny className combiner — filters falsy values and joins with spaces. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
