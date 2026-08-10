const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

const layout4 = {
  filas: [
    { fila: 1, asientos: [{ n: 1, pos: 'izq' }, { n: 2, pos: 'der' }], nota: 'Conductor + Copiloto' },
    { fila: 2, asientos: [{ n: 3, pos: 'izq' }, { n: 4, pos: 'cen' }, { n: 5, pos: 'der' }], nota: 'Segunda Fila' }
  ]
};

const layout6 = {
  filas: [
    { fila: 1, asientos: [{ n: 1, pos: 'izq' }, { n: 2, pos: 'der' }], nota: 'Conductor + Copiloto' },
    { fila: 2, asientos: [{ n: 3, pos: 'izq' }, { n: 4, pos: 'cen' }, { n: 5, pos: 'der' }], nota: 'Segunda Fila' },
    { fila: 3, asientos: [{ n: 6, pos: 'izq' }, { n: 7, pos: 'der' }], nota: 'Tercera Fila' }
  ]
};

async function seed() {
  const { data: rutas } = await supabase.from('rutas').select('id');
  
  await supabase.from('vehiculos').upsert([
    { tipo: 'CAMIONETA_4', nombre_display: 'Camioneta (4 Pasajeros)', total_asientos_pasajero: 4, layout_json: layout4, activo: true },
    { tipo: 'CAMIONETA_6', nombre_display: 'Camioneta (6 Pasajeros)', total_asientos_pasajero: 6, layout_json: layout6, activo: true }
  ]);
  
  const { data: allVehiculos } = await supabase.from('vehiculos').select('id').eq('activo', true);
  
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
    
    const { error } = await supabase.from('viajes').insert(batch);
    if (error && error.code !== '23505') {
       console.log('Error in day ' + d, error.message);
    }
  }
  console.log('Seeding listo.');
}

seed();
