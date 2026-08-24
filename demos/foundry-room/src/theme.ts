import { useCallback, useEffect, useState } from 'react';
import type { ThemeName } from '@trembus/ui';

export type { ThemeName };

const STORAGE_KEY = 'foundry-room-theme';

function readInitialTheme(): ThemeName {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
}

/**
 * App-level theme control. The token CSS (`@trembus/tokens`) responds to
 * `[data-theme]` on <html>, so flipping that attribute re-themes the whole tree.
 * Persisted to localStorage; defaults dark (the room's native look).
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
