import { useCallback, useEffect, useState } from 'react';
import type { ThemeName } from '@trembus/ui';

export type { ThemeName };

const STORAGE_KEY = 'soul-steel-theme';

function readInitialTheme(): ThemeName {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

/**
 * App-level theme control. Mirrors the Storybook `data-theme` mechanism: the
 * token CSS (`@trembus/tokens`) responds to `[data-theme="dark"]` on <html>,
 * so flipping that attribute re-themes the whole tree for free. Persisted to
 * localStorage so a reload keeps the choice. The type is the canonical
 * `ThemeName` from the published surface (it also carries `'reliquary'`);
 * this demo's toggle deliberately cycles just light ↔ dark.
 */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeName>(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}
