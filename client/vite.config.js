import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The backend port comes from the PORT value in the project-root .env file (default 5000).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '');
  const backendPort = env.PORT || 5000;

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': { target: `http://localhost:${backendPort}`, changeOrigin: true }
      }
    }
  };
});
