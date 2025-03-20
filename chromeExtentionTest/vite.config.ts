import { defineConfig } from 'vite';
import { join, resolve } from 'path';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    rollupOptions: {
      input: {
        content: join(__dirname, 'src/content/index.tsx')
      },
      output: {
        entryFileNames: 'assets/[name].js',
        inlineDynamicImports: true
      },
    }
  },
  resolve: {
    alias: {
      '@src': resolve(__dirname, 'src')
    }
  }, 
  plugins: [react()],
});
