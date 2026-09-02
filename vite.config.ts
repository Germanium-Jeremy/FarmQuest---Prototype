import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    host: true,
    port: 3000,
    proxy: {
      '/api': 'http://127.0.0.1:3001',
      '/ws': {
        target: 'ws://127.0.0.1:3001',
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        admin: resolve(root, 'src/admin/admin.html'),
      },
    },
  },
  plugins: [
    {
      name: 'admin-route',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/admin' || req.url === '/admin/') {
            req.url = '/src/admin/admin.html';
          }
          next();
        });
      },
    },
  ],
});
