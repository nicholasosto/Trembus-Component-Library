import type { CSSProperties } from 'react';

/** Build an inline style that carries CSS custom properties safely under strict TS. */
export function vars(record: Record<string, string | number>, base?: CSSProperties): CSSProperties {
  return { ...(base ?? {}), ...record } as CSSProperties;
}
