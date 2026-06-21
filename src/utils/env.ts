/**
 * True in development. Resolved from Vite's `import.meta.env.DEV`, so it is
 * statically replaced to `false` in the published bundle (dev warnings strip
 * out, exactly like React's own). Falls back to `false` on non-Vite tooling.
 */
export const isDev: boolean = (() => {
  try {
    return Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);
  } catch {
    return false;
  }
})();
