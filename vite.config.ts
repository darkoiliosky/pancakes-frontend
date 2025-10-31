import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "REACT_APP_"],
  server: {
    port: 5173,
    proxy: {
      // Optional: if you decide to use relative API calls
      // '/api': process.env.REACT_APP_API_URL || 'http://localhost:5000',
      // '/uploads': process.env.REACT_APP_API_URL || 'http://localhost:5000',
    },
  },
  build: {
    sourcemap: true,
  },
});

