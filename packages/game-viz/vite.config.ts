import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      outDir: 'dist',
      include: ['src'],
      exclude: ['src/**/*.stories.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx', 'src/test/**'],
      tsconfigPath: './tsconfig.build.json',
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    // Library mode defaults cssCodeSplit to false → a single deterministic styles.css.
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      // Consumer provides React; @trembus/ui + @trembus/tokens are declared deps.
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        /^@trembus\//,
      ],
      output: {
        // Force a stable CSS filename so the exports map can point at it.
        assetFileNames: (asset) => {
          const name = asset.names?.[0] ?? asset.name ?? '';
          return name.endsWith('.css') ? 'styles.css' : 'assets/[name][extname]';
        },
      },
    },
  },
});
