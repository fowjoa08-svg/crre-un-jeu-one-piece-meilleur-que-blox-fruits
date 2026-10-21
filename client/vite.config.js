import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The preview proxy forwards the sandbox host (which rotates), so in preview mode
// we allow that whole wildcard domain. Outside preview mode the list stays empty
// and Vite keeps its default (localhost only) behaviour.
const sandboxHost = process.env.BASE44_SANDBOX_HOST_DOMAIN;
const allowedHosts =
  process.env.BASE44_PREVIEW_MODE === '1' && sandboxHost ? [`.${sandboxHost}`] : [];

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts,
    watch: { usePolling: true, interval: 300 },
    proxy: {
      // Single origin: the browser only talks to the web service, which forwards
      // /api to the API container. Keeps the session cookie same-site.
      '/api': {
        target: process.env.API_INTERNAL_URL || 'http://api:4000',
        changeOrigin: false,
      },
    },
  },
});
