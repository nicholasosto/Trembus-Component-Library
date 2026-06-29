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
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      // Consumer provides React; the icons are otherwise self-contained (no deps,
      // no CSS).
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
  },
});
