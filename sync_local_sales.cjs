const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function syncAll() {
  console.log('--- Iniciando sesión Admin ---');
  await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  const { data: ventas, error: vErr } = await supabase
    .from('ventas')
    .select('*');

  console.log(`Ventas encontradas: ${ventas?.length || 0}`);

  if (ventas && ventas.length > 0) {
    for (const v of ventas) {
      if (!v.culqi_charge_id?.startsWith('RECHAZADO_')) {
        console.log(`Eliminando bloqueos existentes para asiento #${v.numero_asiento} (viaje ${v.viaje_id})...`);
        await supabase
          .from('asientos_bloqueos')
          .delete()
          .eq('viaje_id', v.viaje_id)
          .eq('numero_asiento', v.numero_asiento);

        console.log(`Insertando asiento #${v.numero_asiento} como PAGADO...`);
        const { error: insErr } = await supabase
          .from('asientos_bloqueos')
          .insert({
            viaje_id: v.viaje_id,
            numero_asiento: v.numero_asiento,
            estado: 'PAGADO',
            expira_at: '2099-12-31T23:59:59Z',
            sesion_token: 'PAGADO'
          });

        if (insErr) console.error('Error al insertar bloqueo:', insErr);
        else console.log(`✅ Asiento #${v.numero_asiento} marcado como PAGADO exitosamente.`);
      }
    }
  }
}

syncAll();
