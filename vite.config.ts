import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served from https://<user>.github.io/dnd-character/
export default defineConfig({
  base: '/dnd-character/',
  plugins: [react(), tailwindcss()],
  // Honour PORT so the preview harness can assign a free port.
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : {},
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
});
