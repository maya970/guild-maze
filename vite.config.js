import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: false },
  define: { global: 'globalThis' },
  resolve: {
    alias: {
      buffer: 'buffer',
      process: 'process/browser',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      events: 'events',
    },
  },
  optimizeDeps: {
    include: ['arweave', 'arbundles', 'buffer', 'process'],
  },
});
