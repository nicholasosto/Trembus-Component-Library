import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A plain Vite SPA that consumes @trembus/ui through its PUBLISHED entrypoints
// (the `exports` map → dist/index.js + dist/styles.css), exactly as a downstream
// product would — so the library must be built first (`pnpm -r build`, or
// `pnpm demos:check` from the repo root). That is the point: the demo dog-foods
// the real consumer API, not the source.
export default defineConfig({
  plugins: [react()],
  build: { target: 'es2022', outDir: 'dist', sourcemap: false },
  server: { port: 5175 },
  preview: { port: 5175 },
});
