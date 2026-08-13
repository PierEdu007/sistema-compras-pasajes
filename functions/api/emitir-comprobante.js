/**
 * Serverless Proxy Endpoint for SUNAT / NubeFact Electronic Invoicing
 * Handles CORS and sends requests directly to NubeFact API.
 * Route: /api/emitir-comprobante
 */

export async function onRequest(context) {
  const { request } = context;

  // CORS Headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

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

    const targetUrl = apiUrl || 'https://api.nubefact.com/api/v1/ad363ac5-880b-4f3f-be7a-247d2908a9d6';
    const targetToken = apiToken || '3c4fcc1af04b48b4b3fe291e485c1fa061857d24cc8143ce9d73f312b4836cbc';

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
    return new Response(JSON.stringify({ error: err.message || 'Serverless proxy error' }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
