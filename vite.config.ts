import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * This config builds the SHOWCASE — the charte graphique page — not the
 * library. The library is emitted by `npm run build:lib` (tsc → dist/), so the
 * two outputs are kept apart on purpose: `dist/` is what a consumer installs,
 * `dist-showcase/` is a static site nobody depends on.
 */
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist-showcase' },
  server: { host: '127.0.0.1' },
});
