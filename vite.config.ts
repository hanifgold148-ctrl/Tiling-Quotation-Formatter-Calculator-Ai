import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // The third argument '' loads all env vars, regardless of prefix.
  // Cast process to any to avoid TypeScript error if node types are missing/incomplete
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Retrieve API_KEY from loaded env files (local .env) or system environment (Netlify)
  const apiKey = env.API_KEY || process.env.API_KEY;

  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
    },
    define: {
      // Safely provide process.env.API_KEY to the client-side code
      'process.env.API_KEY': JSON.stringify(apiKey || '')
    }
  };
});