const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function run() {
  console.log('--- Autenticando Admin ---');
  let auth = await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  if (auth.error) {
    auth = await supabase.auth.signInWithPassword({
      email: 'admin@turismotunkychasky.pe',
      password: 'password123'
    });
  }

  if (auth.error) {
    console.error('Auth error:', auth.error);
    return;
  }

  console.log('Autenticado como:', auth.data.user.email);

  // 1. Obtener IDs de las rutas Cusco - Quillabamba y Quillabamba - Cusco
  const { data: rutas, error: rErr } = await supabase
    .from('rutas')
    .select('id, origen, destino')
    .or('and(origen.eq.CUSCO,destino.eq.QUILLABAMBA),and(origen.eq.QUILLABAMBA,destino.eq.CUSCO)');

  if (rErr) console.error('Error rutas:', rErr);

  console.log('Rutas encontradas:', rutas);

  if (rutas && rutas.length > 0) {
    const rutaIds = rutas.map(r => r.id);

    // 2. Actualizar el precio_base = 50.00 para todas estas rutas
    const { data: updatedViajes, error: uErr } = await supabase
      .from('viajes')
      .update({ precio_base: 50.00 })
      .in('ruta_id', rutaIds)
      .select('id');

    if (uErr) console.error('Error actualizando viajes:', uErr);
    else console.log(`Se actualizaron ${updatedViajes?.length || 0} viajes a S/ 50.00 soles.`);
  }

  // 3. También actualizar el precio por defecto en la tabla rutas si existe la columna o precio base sugerido
  console.log('--- PRECIOS DE CUSCO <-> QUILLABAMBA ACTUALIZADOS A S/ 50.00 ---');
}

run();
