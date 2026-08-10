import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy para consultas DNI (RENIEC) y RUC (SUNAT)
      '/api/dni': {
        target: 'https://api.apis.net.pe',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dni/, '/v1/dni'),
      },
      '/api/ruc': {
        target: 'https://api.apis.net.pe',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ruc/, '/v1/ruc'),
      },
    },
  },
})
