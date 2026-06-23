import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

const storybookDir = fileURLToPath(new URL('./.storybook', import.meta.url));

// Root-level Storybook stories-as-tests project (browser, CI). Spans BOTH
// packages via the .storybook/main.ts glob. Per-package `unit` projects live
// in each package's own vitest.config.ts. Needs:
//   pnpm exec playwright install chromium
export default defineConfig({
  test: {
    projects: [
      {
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
