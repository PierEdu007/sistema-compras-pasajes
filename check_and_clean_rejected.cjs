const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function clean() {
  await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  console.log('--- REVISANDO VENTAS ---');
  const { data: ventas, error: vErr } = await supabase.from('ventas').select('*');
  console.log('Ventas en DB:', ventas);

  console.log('--- REVISANDO BLOQUEOS ---');
  const { data: bloqueos, error: bErr } = await supabase.from('asientos_bloqueos').select('*');
  console.log('Bloqueos en DB:', bloqueos);

  // Eliminar ventas rechazadas
  const { data: delVentas } = await supabase
    .from('ventas')
    .delete()
    .ilike('culqi_charge_id', 'RECHAZADO_%')
    .select('id, viaje_id, numero_asiento');

  console.log('Ventas rechazadas eliminadas:', delVentas);

  // Si hay bloqueos de asientos rechazados, eliminarlos
  if (delVentas && delVentas.length > 0) {
    for (const v of delVentas) {
      await supabase
        .from('asientos_bloqueos')
        .delete()
        .eq('viaje_id', v.viaje_id)
        .eq('numero_asiento', v.numero_asiento);
    }
  }
}

clean();
