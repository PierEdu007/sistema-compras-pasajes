/**
 * Serverless Proxy Endpoint for SUNAT / NubeFact Electronic Invoicing
 * Hardened with SSRF protection, host whitelist, and payload operation validation.
 * Route: /api/emitir-comprobante
 */

const NUBEFACT_ALLOWED_PREFIX = 'https://api.nubefact.com/api/v1/';
const ALLOWED_OPERATIONS = ['generar_comprobante', 'consultar_comprobante', 'anular_comprobante', 'consultar_anulacion', 'generar_anulacion'];

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

function isAllowedNubefactUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const isDomainAllowed = host.endsWith('nubefact.com') || host.endsWith('pse.pe');
    const isPathAllowed = u.pathname.startsWith('/api/v1/') || u.pathname.startsWith('/api/');
    return isDomainAllowed && isPathAllowed;
  } catch {
    return false;
  }
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

    const DEFAULT_NUBEFACT_URL = 'https://api.nubefact.com/api/v1/ad363ac5-880b-4f3f-be7a-247d2908a9d6';
    const DEFAULT_NUBEFACT_TOKEN = '3c4fcc1af04b48b4b3fe291e485c1fa061857d24cc8143ce9d73f312b4836cbc';

    const targetUrl = (apiUrl || context.env?.NUBEFACT_API_URL || context.env?.VITE_NUBEFACT_API_URL || DEFAULT_NUBEFACT_URL).trim();
    const targetToken = (apiToken || context.env?.NUBEFACT_API_TOKEN || context.env?.VITE_NUBEFACT_API_TOKEN || DEFAULT_NUBEFACT_TOKEN).trim();

    if (!targetUrl || !targetToken) {
      return new Response(
        JSON.stringify({ error: 'Credenciales de facturación electrónica no configuradas en el servidor ni en la petición.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. SSRF Prevention: Validate host URL matches official NubeFact / PSE domain
    if (typeof targetUrl !== 'string' || !isAllowedNubefactUrl(targetUrl)) {
      return new Response(
        JSON.stringify({ error: `Destino no autorizado (${targetUrl}). Solo se permite comunicación con la API oficial de NubeFact o PSE.` }),
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
