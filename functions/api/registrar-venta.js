// Cloudflare Pages Function: /api/registrar-venta
// Hardened serverless endpoint with input validation, sanitization, parameterized queries and restricted CORS

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

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
  const corsHeaders = getCorsHeaders(context.request);
  const SUPABASE_URL = context.env?.SUPABASE_URL || context.env?.VITE_SUPABASE_URL || 'https://ybnenttufdztznupgigk.supabase.co';
  const SUPABASE_ANON_KEY = context.env?.SUPABASE_ANON_KEY || context.env?.VITE_SUPABASE_ANON_KEY || '';

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
      metodo_pago,
      nro_operacion,
      razon_social,
      direccion_fiscal,
      descripcion_opcional,
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
    const cleanMetodo = sanitizeStr(metodo_pago, 20) || 'YAPE';
    const cleanOp = sanitizeStr(nro_operacion, 30);
    const cleanRS = sanitizeStr(razon_social, 120);
    const cleanDir = sanitizeStr(direccion_fiscal, 150);
    const cleanDesc = sanitizeStr(descripcion_opcional, 200);

    // Permitir delimitadores | y : en culqi_charge_id para los metadatos
    let cleanChargeId = typeof culqi_charge_id === 'string'
      ? culqi_charge_id.replace(/[<>{}()\[\]\\`~$^%*+;=?]/g, '').slice(0, 250).trim()
      : `YAPE-${Date.now()}`;

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
      metodo_pago: cleanMetodo,
      nro_operacion: cleanOp || null,
      razon_social: cleanRS || null,
      direccion_fiscal: cleanDir || null,
      descripcion_opcional: cleanDesc || null,
      estado: 'PENDIENTE',
      comprobante_emitido: false,
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

    // 5. Insert permanently into asientos_bloqueos as PAGADO with vehicle type isolation
    const is6 = cleanChargeId.includes('6P') || cleanChargeId.includes('6p');
    const tipoVehiculo = is6 ? '6P' : '4P';
    const sesionToken = `PAGADO_${tipoVehiculo}`;

    const bloqueoPayload = {
      viaje_id,
      numero_asiento: seatNum,
      estado: 'PAGADO',
      expira_at: '2099-12-31T23:59:59Z',
      sesion_token: sesionToken,
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

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request),
  });
}
