import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const layout4 = {
  filas: [
    { fila: 1, asientos: [{ n: 1, pos: 'der' }], nota: 'Copiloto' },
    { fila: 2, asientos: [{ n: 2, pos: 'izq' }, { n: 3, pos: 'cen' }, { n: 4, pos: 'der' }], nota: 'Segunda Fila' }
  ]
};

const layout6 = {
  filas: [
    { fila: 1, asientos: [{ n: 1, pos: 'der' }], nota: 'Copiloto' },
    { fila: 2, asientos: [{ n: 2, pos: 'izq' }, { n: 3, pos: 'cen' }, { n: 4, pos: 'der' }], nota: 'Segunda Fila' },
    { fila: 3, asientos: [{ n: 5, pos: 'izq' }, { n: 6, pos: 'der' }], nota: 'Tercera Fila' }
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: vehiculos, error: eSel } = await supabaseAdmin.from('vehiculos').select('*');
    if (eSel) throw eSel;

    if (!vehiculos || vehiculos.length < 2) {
      return new Response(JSON.stringify({ error: 'Insuficientes vehículos' }), { headers: corsHeaders });
    }

    const id4 = vehiculos[0].id;
    const id6 = vehiculos[1].id;

    // Actualizar vehiculo 1 a 4 Pasajeros
    const { error: e4 } = await supabaseAdmin.from('vehiculos').update({
      tipo: 'CAMIONETA_4',
      nombre_display: 'Camioneta (4 Pasajeros)',
      total_asientos_pasajero: 4,
      layout_json: layout4,
      activo: true
    }).eq('id', id4);

    if (e4) throw e4;

    // Actualizar vehiculo 2 a 6 Pasajeros
    const { error: e6 } = await supabaseAdmin.from('vehiculos').update({
      tipo: 'CAMIONETA_6',
      nombre_display: 'Camioneta (6 Pasajeros)',
      total_asientos_pasajero: 6,
      layout_json: layout6,
      activo: true
    }).eq('id', id6);

    if (e6) throw e6;

    // Desactivar el resto de vehículos antiguos
    for (let i = 2; i < vehiculos.length; i++) {
      await supabaseAdmin.from('vehiculos').update({ activo: false }).eq('id', vehiculos[i].id);
    }

    // Reasignar todos los viajes existentes entre id4 (4 Pasajeros) e id6 (6 Pasajeros)
    const { data: viajes } = await supabaseAdmin.from('viajes').select('id');
    if (viajes) {
      const ids4 = viajes.filter((_, idx) => idx % 2 === 0).map(v => v.id);
      const ids6 = viajes.filter((_, idx) => idx % 2 !== 0).map(v => v.id);

      for (let i = 0; i < ids4.length; i += 200) {
        await supabaseAdmin.from('viajes').update({ vehiculo_id: id4 }).in('id', ids4.slice(i, i + 200));
      }
      for (let i = 0; i < ids6.length; i += 200) {
        await supabaseAdmin.from('viajes').update({ vehiculo_id: id6 }).in('id', ids6.slice(i, i + 200));
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Vehículos actualizados a 4 y 6 Pasajeros y viajes reasignados' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
