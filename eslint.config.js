import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';

export default tseslint.config(
  // packages/video (Remotion motion app) and demos/* (consuming demo sites) are
  // apps, not gated libraries — they live outside the 3-jobs/axe discipline, so
  // the root lint skips them. Each has its own tsconfig for a `tc` typecheck
  // (e.g. `pnpm --filter @trembus/video tc`, `pnpm demos:check`).
  {
    ignores: [
      '**/dist',
      '**/storybook-static',
      '**/node_modules',
      '**/coverage',
      '.claude',
      'packages/video',
      'demos',
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
