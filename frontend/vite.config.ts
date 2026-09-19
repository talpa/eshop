import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const usePolling = process.env.CHOKIDAR_USEPOLLING === 'true';
const pollingInterval = Number.parseInt(process.env.CHOKIDAR_INTERVAL || '300', 10);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling,
      interval: Number.isNaN(pollingInterval) ? 300 : pollingInterval,
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
