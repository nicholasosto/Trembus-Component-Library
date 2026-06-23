import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Unit tests — fast, jsdom, runs on any clone (incl. jest-axe a11y assertions).
// The Storybook stories-as-tests (browser) project lives in the ROOT
// vitest.config.ts, which spans every package.
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: false,
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
});
