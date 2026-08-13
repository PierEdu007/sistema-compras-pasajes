import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy para consultas DNI (RENIEC) y RUC (SUNAT)
      // En dev, /api/dni?numero=X se reenvía a https://api.apis.net.pe/v1/dni?numero=X
      '/api/dni': {
        target: 'https://api.apis.net.pe',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/dni/, '/v1/dni'),
      },
      '/api/ruc': {
        target: 'https://api.apis.net.pe',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/ruc/, '/v1/ruc'),
      },
      // Proxy local para NubeFact Facturación Electrónica (Evita CORS en localhost)
      '/api/emitir-comprobante': {
        target: 'https://api.nubefact.com',
        changeOrigin: true,
        secure: true,
        rewrite: () => '/api/v1/ad363ac5-880b-4f3f-be7a-247d2908a9d6',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Authorization', 'Bearer 3c4fcc1af04b48b4b3fe291e485c1fa061857d24cc8143ce9d73f312b4836cbc');
          });
        }
      },
    },
  },
})
