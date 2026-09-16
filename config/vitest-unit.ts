import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * The `unit` project every package runs via `vitest run --project unit`: fast,
 * jsdom, runs on any clone (incl. the jest-axe a11y assertions). The
 * Storybook stories-as-tests (browser) project lives in the ROOT
 * vitest.config.ts, which spans every package through the .storybook glob.
 */
export function unitConfig() {
  return defineConfig({
    test: {
      projects: [
        {
          plugins: [react()],
          test: {
            name: 'unit',
            environment: 'jsdom',
            globals: false,
            setupFiles: [fileURLToPath(new URL('./vitest.setup.ts', import.meta.url))],
            include: ['src/**/*.test.{ts,tsx}'],
          },
        },
      ],
    },
  });
}
