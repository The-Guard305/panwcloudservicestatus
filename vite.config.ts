import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/panw-status': {
        target: 'https://status.paloaltonetworks.com/api/v2',
        changeOrigin: true,
        rewrite: (path) => {
          // Strict whitelist mapping
          const routes: Record<string, string> = {
            '/api/panw-status/summary': '/summary.json',
            '/api/panw-status/status': '/status.json',
            '/api/panw-status/components': '/components.json',
            '/api/panw-status/incidents/unresolved': '/incidents/unresolved.json',
            '/api/panw-status/incidents': '/incidents.json',
            '/api/panw-status/scheduled-maintenances/upcoming': '/scheduled-maintenances/upcoming.json',
            '/api/panw-status/scheduled-maintenances/active': '/scheduled-maintenances/active.json',
            '/api/panw-status/scheduled-maintenances': '/scheduled-maintenances.json',
          };
          return routes[path] || path;
        },
      },
    },
  },
})
