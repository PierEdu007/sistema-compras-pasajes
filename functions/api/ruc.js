// Cloudflare Pages Function: /api/ruc
// Proxies RUC lookups to apis.net.pe to avoid browser CORS restrictions
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const numero = url.searchParams.get('numero');

  if (!numero || !/^(10|20)[0-9]{9}$/.test(numero)) {
    return new Response(JSON.stringify({ error: 'RUC inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error al consultar SUNAT' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
