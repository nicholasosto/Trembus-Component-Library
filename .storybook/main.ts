import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: { name: '@storybook/react-vite', options: {} },
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  // Storybook 9: controls/actions/viewport/interactions are in core — do NOT add
  // addon-essentials. Docs blocks live in @storybook/addon-docs.
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
};

export default config;
