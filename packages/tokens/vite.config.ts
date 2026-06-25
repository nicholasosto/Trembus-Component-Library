import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// @trembus/tokens is React-free pure TS → no react plugin. Only the runtime `.`
// entry is bundled to dist (its extensionless re-exports of ./tokens · ./tone ·
// ./tokens.types don't resolve under Node16 ESM when shipped as raw source).
// The type-only `./contract`, the test helper `./testing`, and the hand-authored
// CSS layer system stay as source exports (attw-clean as-is; keeping CSS as
// source preserves the live theme-editing loop in Storybook).
export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist',
      include: ['src'],
      tsconfigPath: './tsconfig.build.json',
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      // jest-axe rides the (source) ./testing entry only; never bundle it here.
      external: ['jest-axe'],
    },
  },
});
