// Cloudflare Pages Function: /api/registrar-venta
// Bypasses browser RLS by saving sales and updating seat locks server-side

const SUPABASE_URL = 'https://ybnenttufdztznupgigk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF';

export async function onRequestPost(context) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const body = await context.request.json();
    const {
      viaje_id,
      numero_asiento,
      tipo_documento,
      nro_documento,
      nombres,
      apellidos,
      email,
      telefono,
      monto_pagado,
      culqi_charge_id,
      razon_social,
      direccion_fiscal,
      descripcion_opcional,
    } = body;

    if (!viaje_id || !numero_asiento || !nombres || !apellidos) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos para la venta' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Authenticate with Supabase as Admin to bypass RLS
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: 'admin@kintu.com',
        password: 'password123',
      }),
    });

    const authData = await authRes.json();
    const token = authData.access_token;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Error de autenticación con la base de datos' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=representation',
    };

    // 2. Insert into ventas table
    const fullPayload = {
      viaje_id,
      numero_asiento: Number(numero_asiento),
      tipo_documento: tipo_documento || 'DNI',
      nro_documento: nro_documento || '',
      nombres,
      apellidos,
      email: email || '',
      telefono: telefono || '',
      monto_pagado: Number(monto_pagado) || 50,
      culqi_charge_id: culqi_charge_id || `YAPE-${Date.now()}`,
      razon_social: razon_social || null,
      direccion_fiscal: direccion_fiscal || null,
      descripcion_opcional: descripcion_opcional || null,
    };

    const ventaRes = await fetch(`${SUPABASE_URL}/rest/v1/ventas`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(fullPayload),
    });

    const ventaData = await ventaRes.json();

    // 3. Delete existing temporary locks for this seat
    await fetch(`${SUPABASE_URL}/rest/v1/asientos_bloqueos?viaje_id=eq.${viaje_id}&numero_asiento=eq.${numero_asiento}`, {
      method: 'DELETE',
      headers: authHeaders,
    });

    // 4. Insert permanently into asientos_bloqueos as PAGADO
    const bloqueoPayload = {
      viaje_id,
      numero_asiento: Number(numero_asiento),
      estado: 'PAGADO',
      expira_at: '2099-12-31T23:59:59Z',
      sesion_token: 'PAGADO',
    };

    const bloqueoRes = await fetch(`${SUPABASE_URL}/rest/v1/asientos_bloqueos`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(bloqueoPayload),
    });

    const bloqueoData = await bloqueoRes.json();

    return new Response(
      JSON.stringify({
        success: true,
        venta: ventaData[0] || ventaData,
        bloqueo: bloqueoData[0] || bloqueoData,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Error interno al registrar la venta' }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}
