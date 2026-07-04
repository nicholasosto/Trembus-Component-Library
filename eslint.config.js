import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';

export default tseslint.config(
  // packages/video (Remotion motion app), demos/* (consuming demo sites), and
  // templates/* (copy-and-own page templates) are apps/references, not gated
  // libraries — they live outside the 3-jobs/axe discipline, so the root lint
  // skips them. Each has its own tsconfig for a `tc` typecheck (e.g.
  // `pnpm --filter @trembus/video tc`, `pnpm demos:check`, `pnpm templates:check`).
  // Templates stay in the PRETTIER scope on purpose: copy-ready reference code.
  {
    ignores: [
      '**/dist',
      '**/storybook-static',
      '**/node_modules',
      '**/coverage',
      '.claude',
      'packages/video',
      'demos',
      'templates',
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
    // Node-side tooling: build configs, scripts, the Storybook config, and the
    // agent hook/scaffold *.mjs scripts under .codex/ & .agents/ all run under
    // Node, so give them the Node globals (otherwise `console` & friends trip
    // `no-undef`). .claude/ is fully ignored above.
    files: ['**/*.config.{ts,js}', 'scripts/**', '.storybook/**', '.codex/**', '.agents/**'],
    languageOptions: { globals: { ...globals.node } },
  },
);
