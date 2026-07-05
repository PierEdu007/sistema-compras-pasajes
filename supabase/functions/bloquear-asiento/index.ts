import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { viaje_id, numero_asiento, sesion_token } = await req.json()

    // Validate input
    if (!viaje_id || !numero_asiento || !sesion_token) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: viaje_id, numero_asiento, sesion_token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Call the database function to atomically block the seat
    const { data, error } = await supabase.rpc('bloquear_asiento', {
      p_viaje_id: viaje_id,
      p_numero_asiento: numero_asiento,
      p_sesion_token: sesion_token,
      p_minutos: 6,
    })

    if (error) {
      // Check if it's a seat unavailable error
      if (error.message?.includes('ASIENTO_NO_DISPONIBLE')) {
        return new Response(
          JSON.stringify({ error: 'El asiento no está disponible', code: 'SEAT_UNAVAILABLE' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw error
    }

    // Calculate expiration time
    const expira_at = new Date(Date.now() + 6 * 60 * 1000).toISOString()

    return new Response(
      JSON.stringify({ 
        bloqueo_id: data, 
        expira_at,
        message: 'Asiento bloqueado exitosamente' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Error en bloquear-asiento:', err)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
