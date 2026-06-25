import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: { name: '@storybook/react-vite', options: {} },
  stories: ['../packages/*/src/**/*.stories.@(ts|tsx)'],
  // Storybook 9: controls/actions/viewport/interactions are in core — do NOT add
  // addon-essentials. Docs blocks live in @storybook/addon-docs.
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  async viteFinal(viteConfig) {
    const { mergeConfig } = await import('vite');
    // Resolve @trembus/ui to SOURCE (exact match, so the `/styles.css` subpath is
    // untouched). game-viz stories compose ui components; from the published dist
    // their per-component `import './X.css'` side-effects don't reach Storybook, so
    // a composed ui component (e.g. Timeline inside Chronicle) renders unstyled.
    // Source resolution injects that CSS and keeps Storybook on live ui source.
    //
    // @trembus/tokens `.` ships as built `dist` (its only published runtime entry);
    // alias it to SOURCE too (exact match, so the `/*.css` subpaths — which stay
    // source exports — are untouched) so dev needs no tokens prebuild and token-JS
    // edits stay live.
    return mergeConfig(viteConfig, {
      resolve: {
        alias: [
          {
            find: /^@trembus\/ui$/,
            replacement: fileURLToPath(new URL('../packages/ui/src/index.ts', import.meta.url)),
          },
          {
            find: /^@trembus\/tokens$/,
            replacement: fileURLToPath(new URL('../packages/tokens/src/index.ts', import.meta.url)),
          },
        ],
      },
    });
  },
};

export default config;
