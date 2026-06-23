import type { CSSProperties } from 'react';

/**
 * Lets CSS custom properties (`--foo`) pass through React's typed `style` prop.
 * Mirrors the @trembus/ui + @trembus/viz `vars` helper.
 */
export function vars(style: Record<string, string | number | undefined>): CSSProperties {
  return style as CSSProperties;
}
