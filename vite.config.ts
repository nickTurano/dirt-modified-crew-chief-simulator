import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' so the built app works when opened from any folder or GitHub Pages
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
  },
});
