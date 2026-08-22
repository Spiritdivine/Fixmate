import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:5050',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5050',
        ws: true,
      },
    },
  },
});
