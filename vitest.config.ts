import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

const storybookDir = fileURLToPath(new URL('./.storybook', import.meta.url));

export default defineConfig({
  test: {
    projects: [
      {
        // Unit tests — fast, jsdom, runs on any clone (incl. jest-axe a11y assertions).
        extends: true,
        plugins: [react()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: false,
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
      {
        // Stories-as-tests + axe a11y, in a real browser (CI). Needs:
        //   pnpm exec playwright install chromium
        extends: true,
        plugins: [storybookTest({ configDir: storybookDir })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: 'playwright',
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
