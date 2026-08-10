const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function run() {
  await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  const { data } = await supabase.from('vehiculos').select('id, tipo, nombre_display, total_asientos_pasajero, activo');
  console.log('Vehiculos en DB (autenticado):', data);
}

run();
