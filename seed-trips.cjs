const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_secret_VT0L5Gxn4fwmS31KwJs7NA_BAj8X8i1'
);

async function seed() {
  const { data: rutas } = await supabase.from('rutas').select('id');
  const { data: vehiculos } = await supabase.from('vehiculos').select('*').eq('tipo', 'RENAULT_MASTER');
  const renaultLayout = vehiculos[0].layout_json;
  
  await supabase.from('vehiculos').upsert([
    { tipo: 'RENAULT_MASTER_1', nombre_display: 'Renault Master (Placa 1)', total_asientos_pasajero: 15, layout_json: renaultLayout },
    { tipo: 'RENAULT_MASTER_2', nombre_display: 'Renault Master (Placa 2)', total_asientos_pasajero: 15, layout_json: renaultLayout },
    { tipo: 'RENAULT_MASTER_3', nombre_display: 'Renault Master (Placa 3)', total_asientos_pasajero: 15, layout_json: renaultLayout },
    { tipo: 'RENAULT_MASTER_4', nombre_display: 'Renault Master (Placa 4)', total_asientos_pasajero: 15, layout_json: renaultLayout }
  ]);
  
  const { data: allVehiculos } = await supabase.from('vehiculos').select('id').like('tipo', 'RENAULT_MASTER_%');
  
  const schedules = ['03:00:00', '06:00:00', '08:00:00', '10:00:00', '12:00:00', '14:00:00', '16:00:00', '18:00:00', '20:00:00', '22:00:00'];
  const today = new Date();
  
  for (let d = 0; d < 90; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    
    let batch = [];
    for (let r = 0; r < rutas.length; r++) {
      const ruta = rutas[r];
      const vId = allVehiculos[r % allVehiculos.length].id;
      for (const time of schedules) {
        batch.push({ ruta_id: ruta.id, vehiculo_id: vId, fecha_viaje: dateStr, hora_viaje: time, precio_base: 45.00, estado: 'ACTIVO' });
      }
    }
    // insert batch
    const { error } = await supabase.from('viajes').insert(batch);
    if (error && error.code !== '23505') {
       console.log('Error in day ' + d, error.message);
    }
  }
  console.log('Seeding listo.');
}
seed();
