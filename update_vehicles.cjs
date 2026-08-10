const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

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

async function updateVehicles() {
  console.log('--- Iniciando sesión Admin ---');
  let auth = await supabase.auth.signInWithPassword({
    email: 'admin@turismotunkychasky.pe',
    password: 'password123'
  });

  if (auth.error) {
    auth = await supabase.auth.signInWithPassword({
      email: 'admin@kintu.com',
      password: 'password123'
    });
  }

  if (auth.error) {
    console.error('Error iniciando sesión:', auth.error);
    return;
  }

  console.log('Admin autenticado:', auth.data.user.email);

  console.log('--- Insertando/Actualizando nuevos vehículos de 4 y 6 pasajeros ---');
  
  // 1. Insertar vehículos de 4 y 6 pasajeros
  const { data: v4, error: e4 } = await supabase.from('vehiculos').upsert([
    {
      tipo: 'CAMIONETA_4',
      nombre_display: 'Camioneta (4 Pasajeros)',
      total_asientos_pasajero: 4,
      layout_json: layout4,
      activo: true
    }
  ], { onConflict: 'tipo' }).select().single();

  const { data: v6, error: e6 } = await supabase.from('vehiculos').upsert([
    {
      tipo: 'CAMIONETA_6',
      nombre_display: 'Camioneta (6 Pasajeros)',
      total_asientos_pasajero: 6,
      layout_json: layout6,
      activo: true
    }
  ], { onConflict: 'tipo' }).select().single();

  if (e4) console.error('Error insertando v4:', e4);
  if (e6) console.error('Error insertando v6:', e6);

  console.log('Vehículo 4 Pjs ID:', v4?.id);
  console.log('Vehículo 6 Pjs ID:', v6?.id);

  if (v4 && v6) {
    // 2. Reasignar todos los viajes existentes alternando entre v4 y v6
    const { data: viajes } = await supabase.from('viajes').select('id');
    if (viajes && viajes.length > 0) {
      console.log(`Reasignando ${viajes.length} viajes...`);
      for (let i = 0; i < viajes.length; i += 100) {
        const batch4 = viajes.slice(i, i + 100).filter((_, idx) => idx % 2 === 0).map(v => v.id);
        const batch6 = viajes.slice(i, i + 100).filter((_, idx) => idx % 2 !== 0).map(v => v.id);

        if (batch4.length > 0) {
          await supabase.from('viajes').update({ vehiculo_id: v4.id }).in('id', batch4);
        }
        if (batch6.length > 0) {
          await supabase.from('viajes').update({ vehiculo_id: v6.id }).in('id', batch6);
        }
      }
      console.log('Viajes reasignados con éxito a Camionetas de 4 y 6 Pasajeros.');
    }

    // 3. Desactivar vehículos antiguos (Renault, Suzuki)
    await supabase.from('vehiculos').update({ activo: false }).not('tipo', 'in', '("CAMIONETA_4","CAMIONETA_6")');
    console.log('Vehículos antiguos desactivados.');
  }
}

updateVehicles();
