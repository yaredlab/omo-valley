import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        // Main React app — the landing / scroll story
        main: path.resolve(__dirname, 'index.html'),
        // Page 03 — The River. Lives at 03/index.html so Vite serves it at /03/ in dev.
        river: path.resolve(__dirname, '03/index.html'),
      },
    },
  },
});
