import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/data': resolve(__dirname, 'src/data'),
      '@/systems': resolve(__dirname, 'src/systems'),
      '@/ui': resolve(__dirname, 'src/ui'),
      '@/models': resolve(__dirname, 'src/models'),
      '@/utils': resolve(__dirname, 'src/utils'),
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  optimizeDeps: {
    include: ['uuid'],
  },
});
