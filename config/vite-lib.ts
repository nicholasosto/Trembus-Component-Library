import { defineConfig, type UserConfig } from 'vite';
import reactPlugin from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

/**
 * The one library build every published `@trembus/*` package runs
 * (`packages/<pkg>/vite.config.ts` is a one-liner over this).
 *
 * - ESM only, `dist/index.js` + rolled-up `dist/index.d.ts` from `src/index.ts`.
 * - `cssCodeSplit: false` → one deterministic `dist/styles.css` the exports map
 *   can point at (packages with no CSS simply emit none).
 * - Everything the consumer already has is EXTERNAL: React, every sibling
 *   `@trembus/*` package (all declared `dependencies`), plus whatever `external`
 *   adds. A declared dependency that gets bundled anyway ships twice in the
 *   consumer's tree (model-viewer/three.js was 1.6 MB of game-viz's dist).
 */
const REACT_RUNTIME = ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'];
const NOT_SHIPPED = [
  'src/**/*.stories.tsx',
  'src/**/*.test.ts',
  'src/**/*.test.tsx',
  'src/test/**',
];

export interface LibConfigOptions {
  /** Extra runtime deps (declared in `dependencies`) left to the consumer's bundler. */
  external?: (string | RegExp)[];
  /** `false` for the React-free tokens package: no react plugin, no React externals. */
  react?: boolean;
}

export function libConfig({ external = [], react = true }: LibConfigOptions = {}): UserConfig {
  return defineConfig({
    plugins: [
      ...(react ? [reactPlugin()] : []),
      dts({
        outDir: 'dist',
        include: ['src'],
        exclude: NOT_SHIPPED,
        tsconfigPath: './tsconfig.build.json',
        rollupTypes: true,
        insertTypesEntry: true,
      }),
    ],
    build: {
      target: 'es2022',
      outDir: 'dist',
      sourcemap: true,
      cssCodeSplit: false,
      lib: { entry: 'src/index.ts', formats: ['es'], fileName: () => 'index.js' },
      rollupOptions: {
        external: [...(react ? REACT_RUNTIME : []), /^@trembus\//, ...external],
        output: {
          assetFileNames: (asset) => {
            const name = asset.names?.[0] ?? asset.name ?? '';
            return name.endsWith('.css') ? 'styles.css' : 'assets/[name][extname]';
          },
        },
      },
    },
  });
}
