import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true, // Expose on local network so mobile devices can connect
  },
  build: {
    outDir: 'dist',
  },
});
