// Gera a versão estática em ./dist-estatico (npm run build:estatico).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const aqui = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: aqui('./estatico'),
  base: './',
  publicDir: aqui('./public'),
  plugins: [react()],
  resolve: {
    alias: [
      { find: 'next/dynamic', replacement: aqui('./estatico/next-dynamic.jsx') },
      { find: /^@\//, replacement: aqui('./') },
    ],
  },
  esbuild: { loader: 'jsx', include: /\.(jsx?|tsx?)$/ },
  optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
  build: { outDir: aqui('./dist-estatico'), emptyOutDir: true, chunkSizeWarningLimit: 2000 },
});
