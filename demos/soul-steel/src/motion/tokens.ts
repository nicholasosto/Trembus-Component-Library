/* ════════════════════════════════════════════════════════════
   The CSS → JS motion-token bridge.

   The library's motion vocabulary lives in CSS, on `:root`, inside
   `@layer tcl.tokens`:

     --tcl-dur-fast: 120ms;   --tcl-ease-calm: cubic-bezier(0.22, 0.61, 0.36, 1);
     --tcl-dur-base: 200ms;   --tcl-ease-exit: cubic-bezier(0.4, 0, 1, 1);
     --tcl-dur-slow: 320ms;

   A JS animation runtime cannot read `var(--tcl-ease-calm)` — Motion wants a
   bezier ARRAY and a duration in SECONDS, not a CSS string in milliseconds. The
   naive fix is to retype the curves as JS constants, which immediately forks the
   design system: change the token, and every JS animation silently keeps the old
   curve.

   So we read the real computed values off `document.documentElement` once and
   parse them. One source of truth stays in CSS; JS derives from it.

   These five tokens are theme-INVARIANT (defined on `:root`, never overridden by
   `[data-theme]`), so a single cached read is correct for the app's lifetime — a
   theme flip cannot invalidate it.
   ════════════════════════════════════════════════════════════ */

/** A CSS `cubic-bezier(a, b, c, d)` curve as Motion's `[a, b, c, d]` tuple. */
export type Bezier = [number, number, number, number];

/** Duration tokens by name — the JS mirror of `--tcl-dur-*`. */
export type DurationToken = 'fast' | 'base' | 'slow';

export interface MotionTokens {
  /** `--tcl-dur-fast` in SECONDS (Motion's unit). 120ms → 0.12 */
  fast: number;
  /** `--tcl-dur-base` in SECONDS. 200ms → 0.2 */
  base: number;
  /** `--tcl-dur-slow` in SECONDS. 320ms → 0.32 */
  slow: number;
  /** `--tcl-ease-calm` — the entrance/settle curve. */
  calm: Bezier;
  /** `--tcl-ease-exit` — the sharper leave curve. */
  exit: Bezier;
}

/**
 * Values used when the DOM is unavailable (SSR) or the token stylesheet has not
 * applied yet. Kept byte-identical to `packages/tokens/src/css/tokens.light.css`
 * so a fallback render is indistinguishable from a real one.
 */
const FALLBACK: MotionTokens = {
  fast: 0.12,
  base: 0.2,
  slow: 0.32,
  calm: [0.22, 0.61, 0.36, 1],
  exit: [0.4, 0, 1, 1],
};

/** `"120ms"` / `"0.32s"` → seconds. Returns `fallback` on anything unparseable. */
function parseDuration(raw: string, fallback: number): number {
  const match = /^(-?[\d.]+)(ms|s)?$/.exec(raw.trim());
  if (!match) return fallback;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return fallback;
  // A bare number in CSS time position is invalid, but treat it as ms to match
  // how the tokens are authored.
  return match[2] === 's' ? value : value / 1000;
}

/** `"cubic-bezier(0.22, 0.61, 0.36, 1)"` → `[0.22, 0.61, 0.36, 1]`. */
function parseBezier(raw: string, fallback: Bezier): Bezier {
  const match = /^cubic-bezier\(([^)]+)\)$/.exec(raw.trim());
  if (!match) return fallback;
  const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return fallback;
  return [parts[0], parts[1], parts[2], parts[3]];
}

let cached: MotionTokens | null = null;

/**
 * The parsed `--tcl-dur-*` / `--tcl-ease-*` tokens, read once from `:root`.
 *
 * Deliberately lazy (not module-scope) so the first read happens during render,
 * after the token stylesheet has applied. If the read comes back empty — no DOM,
 * or CSS not yet parsed — the fallback is returned WITHOUT caching, so a later
 * call gets another chance at the real values.
 */
export function motionTokens(): MotionTokens {
  if (cached) return cached;
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function') return FALLBACK;

  const styles = getComputedStyle(document.documentElement);
  const raw = {
    fast: styles.getPropertyValue('--tcl-dur-fast'),
    base: styles.getPropertyValue('--tcl-dur-base'),
    slow: styles.getPropertyValue('--tcl-dur-slow'),
    calm: styles.getPropertyValue('--tcl-ease-calm'),
    exit: styles.getPropertyValue('--tcl-ease-exit'),
  };

  // Every value empty ⇒ the token layer has not applied. Don't poison the cache.
  if (!Object.values(raw).some((value) => value.trim() !== '')) return FALLBACK;

  cached = {
    fast: parseDuration(raw.fast, FALLBACK.fast),
    base: parseDuration(raw.base, FALLBACK.base),
    slow: parseDuration(raw.slow, FALLBACK.slow),
    calm: parseBezier(raw.calm, FALLBACK.calm),
    exit: parseBezier(raw.exit, FALLBACK.exit),
  };
  return cached;
}

/** Resolve a `DurationToken | number` prop to seconds. Numbers pass through. */
export function resolveDuration(duration: DurationToken | number): number {
  return typeof duration === 'number' ? duration : motionTokens()[duration];
}

/** Test/lab seam — drops the cache so the next read re-parses `:root`. */
export function resetMotionTokens(): void {
  cached = null;
}
