// Cloudflare Pages Function: /api/registrar-venta
// Hardened serverless endpoint with input validation, sanitization, and parameterized queries

const SUPABASE_URL = 'https://ybnenttufdztznupgigk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF';

// Strict UUID regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeStr(str, maxLen = 100) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>?/gm, '')
    .replace(/[<>{}()\[\]\\`~$^%*+;:=?|]/g, '')
    .slice(0, maxLen)
    .trim();
}

export async function onRequestPost(context) {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    } = body;

    // 1. Strict Input Validations
    if (!viaje_id || !numero_asiento || !nombres || !apellidos) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos para la venta (viaje, asiento, nombres, apellidos)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!UUID_REGEX.test(viaje_id)) {
      return new Response(
        JSON.stringify({ error: 'Identificador de viaje inválido (formato UUID requerido)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const seatNum = parseInt(numero_asiento, 10);
    if (isNaN(seatNum) || seatNum < 1 || seatNum > 30) {
      return new Response(
        JSON.stringify({ error: 'Número de asiento inválido (rango permitido: 1-30)' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanMonto = parseFloat(monto_pagado);
    if (isNaN(cleanMonto) || cleanMonto <= 0 || cleanMonto > 2000) {
      return new Response(
        JSON.stringify({ error: 'Monto pagado inválido' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanNombres = sanitizeStr(nombres, 60).toUpperCase();
    const cleanApellidos = sanitizeStr(apellidos, 60).toUpperCase();
    const cleanTipoDoc = ['DNI', 'RUC', 'CE', 'PASAPORTE'].includes(tipo_documento) ? tipo_documento : 'DNI';
    const cleanNroDoc = sanitizeStr(nro_documento, 20);
    const cleanEmail = sanitizeStr(email, 100).toLowerCase();
    const cleanTelefono = sanitizeStr(telefono, 20);
    const cleanChargeId = sanitizeStr(culqi_charge_id, 200) || `YAPE-${Date.now()}`;

    // 2. Configure Database Authorization Headers
    let authHeaders;
    const serviceRoleKey = context.env?.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
      authHeaders = {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Prefer': 'return=representation',
      };
    } else {
      authHeaders = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation',
      };
    }

    // 3. Insert into ventas table
    const fullPayload = {
      viaje_id,
      numero_asiento: seatNum,
      tipo_documento: cleanTipoDoc,
      nro_documento: cleanNroDoc,
      nombres: cleanNombres,
      apellidos: cleanApellidos,
      email: cleanEmail,
      telefono: cleanTelefono || '927670019',
      monto_pagado: cleanMonto,
      culqi_charge_id: cleanChargeId,
    };

    const ventaRes = await fetch(`${SUPABASE_URL}/rest/v1/ventas`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(fullPayload),
    });

    if (!ventaRes.ok) {
      const errText = await ventaRes.text();
      console.error('Error al insertar venta:', errText);
      return new Response(
        JSON.stringify({ error: 'Error registrando la venta en la base de datos' }),
        { status: 500, headers: corsHeaders }
      );
    }

    const ventaData = await ventaRes.json();

    // 4. Delete existing temporary locks safely with URI encoding
    const deleteQuery = `${SUPABASE_URL}/rest/v1/asientos_bloqueos?viaje_id=eq.${encodeURIComponent(viaje_id)}&numero_asiento=eq.${encodeURIComponent(seatNum)}`;
    await fetch(deleteQuery, {
      method: 'DELETE',
      headers: authHeaders,
    });

    // 5. Insert permanently into asientos_bloqueos as PAGADO
    const bloqueoPayload = {
      viaje_id,
      numero_asiento: seatNum,
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
    const createdVenta = Array.isArray(ventaData) ? ventaData[0] : ventaData;

    return new Response(
      JSON.stringify({
        success: true,
        venta: createdVenta,
        bloqueo: Array.isArray(bloqueoData) ? bloqueoData[0] : bloqueoData,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Error interno en el servidor' }),
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
