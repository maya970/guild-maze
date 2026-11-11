import { createRequire } from 'node:module';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);

export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: false },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  resolve: {
    alias: {
      buffer: require.resolve('buffer'),
      process: require.resolve('process/browser'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      events: require.resolve('events'),
    },
  },
  optimizeDeps: {
    include: ['arweave', 'arbundles', 'buffer', 'process'],
  },
});
