/* @trembus-template app-shell v1.0.0 · useTheme.ts (hook) · chrome is template-owned — edit only inside @tcl-slot regions; re-apply via the trembus-template skill */
import { useCallback, useEffect, useState } from 'react';

export type ThemeName = 'light' | 'dark';

// @tcl-slot:theme-storage-key START — app-owned: the localStorage key that persists the choice.
const STORAGE_KEY = 'app-theme';
// @tcl-slot:theme-storage-key END

// SSR-safe: render code never touches document/localStorage on the server.
function readInitialTheme(): ThemeName {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  if (typeof localStorage === 'undefined') return 'light';
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

/**
 * App-level theme control. The @trembus/tokens CSS responds to
 * `[data-theme="dark"]` on <html>, so flipping that attribute re-themes the
 * whole tree for free. Persisted to localStorage so a reload keeps the choice.
 */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}
