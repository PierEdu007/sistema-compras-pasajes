const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function inspect() {
  await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  const { data: ventas, error: vErr } = await supabase
    .from('ventas')
    .select('id, viaje_id, numero_asiento, nombres, apellidos, culqi_charge_id, created_at');

  console.log('--- TODAS LAS VENTAS EN SUPABASE DB ---');
  console.log(JSON.stringify(ventas, null, 2));

  const { data: bloqueos, error: bErr } = await supabase
    .from('asientos_bloqueos')
    .select('*');

  console.log('--- TODOS LOS BLOQUEOS EN SUPABASE DB ---');
  console.log(JSON.stringify(bloqueos, null, 2));
}

inspect();
