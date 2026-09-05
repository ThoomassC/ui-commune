import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // `css: true` is not cosmetic here: with `css: false`, Vite stubs CSS
    // modules out and `import sheet from './x.css?raw'` returns an empty
    // string — the colour contract would then pass by reading nothing at all.
    css: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/showcase/**', 'src/vite-env.d.ts'],
    },
  },
});
