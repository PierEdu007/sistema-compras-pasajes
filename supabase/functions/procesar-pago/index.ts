import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CULQI_API_URL = 'https://api.culqi.com/v2/charges'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      culqi_token, 
      bloqueo_id, 
      viaje_id,
      numero_asiento,
      tipo_documento, 
      nro_documento, 
      nombres, 
      apellidos, 
      email, 
      telefono,
      monto 
    } = await req.json()

    // Validate required fields
    if (!culqi_token || !bloqueo_id || !viaje_id || !numero_asiento || 
        !tipo_documento || !nro_documento || !nombres || !apellidos || 
        !email || !telefono || !monto) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verify the seat block exists and hasn't expired
    const { data: bloqueo, error: bloqueoError } = await supabase
      .from('asientos_bloqueos')
      .select('*')
      .eq('id', bloqueo_id)
      .eq('estado', 'BLOQUEADO')
      .gt('expira_at', new Date().toISOString())
      .single()

    if (bloqueoError || !bloqueo) {
      return new Response(
        JSON.stringify({ 
          error: 'El bloqueo ha expirado o no existe. Por favor, selecciona el asiento nuevamente.',
          code: 'BLOCK_EXPIRED' 
        }),
        { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Process payment with Culqi
    const culqiSecretKey = Deno.env.get('CULQI_SECRET_KEY')
    if (!culqiSecretKey) {
      throw new Error('CULQI_SECRET_KEY not configured')
    }

    const culqiResponse = await fetch(CULQI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${culqiSecretKey}`,
      },
      body: JSON.stringify({
        amount: Math.round(monto * 100), // Culqi expects amount in cents
        currency_code: 'PEN',
        email: email,
        source_id: culqi_token,
        description: `Pasaje asiento #${numero_asiento}`,
        metadata: {
          viaje_id,
          numero_asiento: String(numero_asiento),
          documento: `${tipo_documento}: ${nro_documento}`,
          pasajero: `${nombres} ${apellidos}`,
        },
      }),
    })

    const culqiData = await culqiResponse.json()

    if (!culqiResponse.ok) {
      console.error('Culqi error:', culqiData)
      
      // Release the seat block on payment failure
      await supabase
        .from('asientos_bloqueos')
        .delete()
        .eq('id', bloqueo_id)

      return new Response(
        JSON.stringify({ 
          error: culqiData.user_message || 'Error al procesar el pago',
          code: 'PAYMENT_FAILED' 
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Payment successful — update block status to PAGADO
    const { error: updateError } = await supabase
      .from('asientos_bloqueos')
      .update({ estado: 'PAGADO' })
      .eq('id', bloqueo_id)

    if (updateError) {
      console.error('Error updating bloqueo:', updateError)
      // Payment went through but DB update failed — log for manual resolution
    }

    // 4. Insert the sale record
    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .insert({
        viaje_id,
        numero_asiento,
        tipo_documento,
        nro_documento,
        nombres,
        apellidos,
        email,
        telefono,
        monto_pagado: monto,
        culqi_charge_id: culqiData.id,
      })
      .select('id')
      .single()

    if (ventaError) {
      console.error('Error inserting venta:', ventaError)
      // Payment went through but sale record failed — needs manual resolution
      return new Response(
        JSON.stringify({ 
          error: 'Pago procesado pero hubo un error al registrar la venta. Contacte soporte.',
          culqi_charge_id: culqiData.id,
          code: 'SALE_RECORD_ERROR' 
        }),
        { status: 207, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        venta_id: venta.id,
        culqi_charge_id: culqiData.id,
        message: '¡Pago procesado exitosamente!' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error en procesar-pago:', err)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
