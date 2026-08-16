import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

function resendLocalPlugin(): Plugin {
  return {
    name: 'resend-local-proxy',
    configureServer(server) {
      server.middlewares.use('/api/enviar-correo', async (req: any, res: any) => {
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk: any) => {
            bodyStr += chunk;
          });

          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const { to, subject, html, attachments, apiKey: clientKey } = body;
              const resendApiKey =
                clientKey ||
                process.env.VITE_RESEND_API_KEY ||
                process.env.RESEND_API_KEY ||
                '';

              if (!resendApiKey) {
                res.writeHead(400, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                });
                res.end(JSON.stringify({ error: 'Falta API Key de Resend en el entorno (.env)' }));
                return;
              }

              const recipientList = Array.isArray(to) ? to : [to];

              const emailPayload: any = {
                from: 'INVERSIONES TUNKY CHASKY <reservas@turismotunkychasky.com.pe>',
                to: recipientList.map((e: string) => String(e).trim().toLowerCase()),
                subject: subject || 'Comprobante y Boleto de Viaje',
                html: html || '',
                attachments: attachments || [],
              };

              let resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${resendApiKey.trim()}`,
                },
                body: JSON.stringify(emailPayload),
              });

              let resData: any = await resendRes.json();

              // Si falla por dominio personalizado no verificado en Resend, hacer fallback automático a onboarding@resend.dev
              if (
                !resendRes.ok &&
                (resData?.message?.toLowerCase().includes('domain') ||
                  resData?.message?.toLowerCase().includes('from') ||
                  resData?.message?.toLowerCase().includes('verify') ||
                  resendRes.status === 403 ||
                  resendRes.status === 422)
              ) {
                console.warn(
                  'Fallback de remitente Resend a onboarding@resend.dev en entorno local'
                );
                emailPayload.from = 'Tunky Chasky <onboarding@resend.dev>';
                resendRes = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${resendApiKey.trim()}`,
                  },
                  body: JSON.stringify(emailPayload),
                });
                resData = await resendRes.json();
              }

              res.writeHead(resendRes.status, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify(resData));
            } catch (err: any) {
              console.error('Error en proxy local de Resend:', err);
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify({ error: err.message || 'Error en servidor local de correo' }));
            }
          });
          return;
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), resendLocalPlugin()],
  server: {
    proxy: {
      // Proxy para consultas DNI (RENIEC) y RUC (SUNAT)
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
            proxyReq.setHeader(
              'Authorization',
              'Bearer 3c4fcc1af04b48b4b3fe291e485c1fa061857d24cc8143ce9d73f312b4836cbc'
            );
          });
        },
      },
    },
  },
});
