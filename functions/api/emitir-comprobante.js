/**
 * Serverless Proxy Endpoint for SUNAT / NubeFact Electronic Invoicing
 * Hardened with SSRF protection, host whitelist, and payload operation validation.
 * Route: /api/emitir-comprobante
 */

const NUBEFACT_ALLOWED_PREFIX = 'https://api.nubefact.com/api/v1/';
const ALLOWED_OPERATIONS = ['generar_comprobante', 'consultar_comprobante', 'anular_comprobante', 'consultar_anulacion'];

const ALLOWED_ORIGINS = [
  'https://turismotunkychasky.com.pe',
  'https://www.turismotunkychasky.com.pe',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

function getCorsHeaders(request) {
  const origin = request?.headers?.get('Origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.pages.dev');
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://turismotunkychasky.com.pe',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

export async function onRequest(context) {
  const { request } = context;
  const corsHeaders = getCorsHeaders(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const body = await request.json();
    const { apiUrl, apiToken, payload } = body;

    const targetUrl = apiUrl || context.env?.NUBEFACT_API_URL || context.env?.VITE_NUBEFACT_API_URL || '';
    const targetToken = apiToken || context.env?.NUBEFACT_API_TOKEN || context.env?.VITE_NUBEFACT_API_TOKEN || '';

    if (!targetUrl || !targetToken) {
      return new Response(
        JSON.stringify({ error: 'Credenciales de facturación electrónica no configuradas' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. SSRF Prevention: Strictly validate host URL
    if (typeof targetUrl !== 'string' || !targetUrl.startsWith(NUBEFACT_ALLOWED_PREFIX)) {
      return new Response(
        JSON.stringify({ error: 'Destino no autorizado. Solo se permite comunicación con la API oficial de NubeFact.' }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 2. Validate payload operation
    if (payload && payload.operacion && !ALLOWED_OPERATIONS.includes(payload.operacion)) {
      return new Response(
        JSON.stringify({ error: `Operación '${payload.operacion}' no autorizada.` }),
        { status: 400, headers: corsHeaders }
      );
    }

    const nubefactResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${targetToken}`
      },
      body: JSON.stringify(payload)
    });

    const responseData = await nubefactResponse.json();

    return new Response(JSON.stringify(responseData), {
      status: nubefactResponse.status,
      headers: corsHeaders
    });
  } catch (err) {
    console.error('Error en serverless proxy NubeFact:', err);
    return new Response(JSON.stringify({ error: 'Error de comunicación con el servicio de facturación' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
