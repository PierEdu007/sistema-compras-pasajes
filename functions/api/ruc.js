// Cloudflare Pages Function: /api/ruc
// Proxies RUC lookups to apis.net.pe with restricted CORS and input validation

const ALLOWED_ORIGINS = [
  'https://turismotunkychasky.com.pe',
  'https://www.turismotunkychasky.com.pe',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

function getCorsOrigin(request) {
  const origin = request?.headers?.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.pages.dev');
  return isAllowed ? origin : 'https://turismotunkychasky.com.pe';
}

export async function onRequest(context) {
  const { request } = context;
  const allowOrigin = getCorsOrigin(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
      },
    });
  }

  const url = new URL(request.url);
  const numero = url.searchParams.get('numero');

  if (!numero || !/^(10|20)[0-9]{9}$/.test(numero)) {
    return new Response(JSON.stringify({ error: 'RUC inválido' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowOrigin,
        'Vary': 'Origin',
      },
    });
  }

  try {
    const res = await fetch(`https://api.apis.net.pe/v1/ruc?numero=${numero}`, {
      headers: { 'Accept': 'application/json' },
    });

    const data = await res.text();

    return new Response(data, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowOrigin,
        'Cache-Control': 'public, max-age=86400',
        'Vary': 'Origin',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error al consultar SUNAT' }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowOrigin,
        'Vary': 'Origin',
      },
    });
  }
}
