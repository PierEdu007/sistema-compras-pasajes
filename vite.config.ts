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
              const { to, subject, html, attachments, pdfUrl, xmlUrl, serie, numero, apiKey: clientKey } = body;
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
              const emailAttachments: any[] = Array.isArray(attachments) ? [...attachments] : [];

              async function fetchUrlAsBase64Server(url: string) {
                try {
                  const fileRes = await fetch(url);
                  if (!fileRes.ok) return null;
                  const buf = await fileRes.arrayBuffer();
                  let binary = '';
                  const bytes = new Uint8Array(buf);
                  for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                  }
                  return btoa(binary);
                } catch (err) {
                  console.error(`Error descargando comprobante ${url} en local:`, err);
                  return null;
                }
              }

              if (pdfUrl && typeof pdfUrl === 'string' && pdfUrl.startsWith('http')) {
                const alreadyHasPdf = emailAttachments.some(a => a.filename?.endsWith('.pdf') && a.filename?.includes('SUNAT'));
                if (!alreadyHasPdf) {
                  const pdfBase64 = await fetchUrlAsBase64Server(pdfUrl);
                  if (pdfBase64) {
                    emailAttachments.push({
                      filename: `SUNAT_Comprobante_${serie || 'BBB1'}-${numero || 1}.pdf`,
                      content: pdfBase64,
                    });
                  }
                }
              }

              if (xmlUrl && typeof xmlUrl === 'string' && xmlUrl.startsWith('http')) {
                const alreadyHasXml = emailAttachments.some(a => a.filename?.endsWith('.xml'));
                if (!alreadyHasXml) {
                  const xmlBase64 = await fetchUrlAsBase64Server(xmlUrl);
                  if (xmlBase64) {
                    emailAttachments.push({
                      filename: `SUNAT_Comprobante_${serie || 'BBB1'}-${numero || 1}.xml`,
                      content: xmlBase64,
                    });
                  }
                }
              }

              const emailPayload: any = {
                from: 'INVERSIONES TUNKY CHASKY <reservas@turismotunkychasky.com.pe>',
                to: recipientList.map((e: string) => String(e).trim().toLowerCase()),
                subject: subject || 'Comprobante y Boleto de Viaje',
                html: html || '',
                attachments: emailAttachments,
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

function nubefactLocalPlugin(): Plugin {
  return {
    name: 'nubefact-local-proxy',
    configureServer(server) {
      server.middlewares.use('/api/emitir-comprobante', async (req: any, res: any) => {
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
              const { apiUrl, apiToken, payload } = body;
              const targetUrl =
                apiUrl ||
                process.env.VITE_NUBEFACT_API_URL ||
                'https://api.nubefact.com/api/v1/ad363ac5-880b-4f3f-be7a-247d2908a9d6';
              const targetToken =
                apiToken ||
                process.env.VITE_NUBEFACT_API_TOKEN ||
                '3c4fcc1af04b48b4b3fe291e485c1fa061857d24cc8143ce9d73f312b4836cbc';

              const actualPayload = payload || body;

              const nubefactRes = await fetch(targetUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${targetToken}`,
                },
                body: JSON.stringify(actualPayload),
              });

              const responseData = await nubefactRes.json();

              res.writeHead(nubefactRes.status, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify(responseData));
            } catch (err: any) {
              console.error('Error en proxy local de NubeFact:', err);
              res.writeHead(500, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(
                JSON.stringify({
                  error: err.message || 'Error en servidor local de facturación',
                })
              );
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
  plugins: [react(), resendLocalPlugin(), nubefactLocalPlugin()],
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
    },
  },
});
