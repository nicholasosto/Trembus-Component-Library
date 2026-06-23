import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';

export default tseslint.config(
  // packages/video is the Remotion motion app, not a gated library — it lives
  // outside the 3-jobs/axe discipline, so the root lint skips it (it has its own
  // tsconfig for `pnpm --filter @trembus/video tc`).
  {
    ignores: [
      '**/dist',
      '**/storybook-static',
      '**/node_modules',
      '**/coverage',
      '.claude',
      'packages/video',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  ...storybook.configs['flat/recommended'],
  {
    files: ['**/*.config.{ts,js}', 'scripts/**', '.storybook/**'],
    languageOptions: { globals: { ...globals.node } },
  },
);
