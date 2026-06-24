import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A plain Vite SPA. It consumes the @trembus/* packages through their PUBLISHED
// entrypoints (the `exports` map → dist/index.js + dist/styles.css), exactly as
// a downstream product would — so the libraries must be built first
// (`pnpm demos:check` builds them; or run `pnpm -r build` once). That is the
// point: the demo dog-foods the real consumer API, not the source.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5174,
  },
  preview: {
    port: 5174,
  },
});
