const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function fixDB() {
  const auth = await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  console.log('Autenticado:', auth.data?.user?.email);

  // 1. Borrar todas las ventas con culqi_charge_id que empiece con RECHAZADO_
  const { data: delVentas, error: vErr } = await supabase
    .from('ventas')
    .delete()
    .ilike('culqi_charge_id', 'RECHAZADO_%')
    .select('*');

  console.log('Ventas eliminadas:', delVentas, 'Error:', vErr);

  // 2. Borrar bloqueos residuales de asiento 4
  const { data: delBloqueos, error: bErr } = await supabase
    .from('asientos_bloqueos')
    .delete()
    .eq('numero_asiento', 4)
    .select('*');

  console.log('Bloqueos eliminados:', delBloqueos, 'Error:', bErr);
}

fixDB();
