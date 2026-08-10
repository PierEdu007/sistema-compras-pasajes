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

async function fix() {
  await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  const { data: vehiculos } = await supabase.from('vehiculos').select('*');
  const id4 = vehiculos[0].id;
  const id6 = vehiculos[1].id;

  // Actualizar Fila 1 a Camioneta 4 Pasajeros
  await supabase.from('vehiculos').update({
    tipo: 'CAMIONETA_4',
    nombre_display: 'Camioneta (4 Pasajeros)',
    total_asientos_pasajero: 4,
    layout_json: layout4,
    activo: true
  }).eq('id', id4);

  // Actualizar Fila 2 a Camioneta 6 Pasajeros
  await supabase.from('vehiculos').update({
    tipo: 'CAMIONETA_6',
    nombre_display: 'Camioneta (6 Pasajeros)',
    total_asientos_pasajero: 6,
    layout_json: layout6,
    activo: true
  }).eq('id', id6);

  // Desactivar el resto de vehículos antiguos
  for (let i = 2; i < vehiculos.length; i++) {
    await supabase.from('vehiculos').update({ activo: false }).eq('id', vehiculos[i].id);
  }

  // Obtener viajes
  const { data: viajes } = await supabase.from('viajes').select('id');
  if (viajes) {
    console.log(`Reasignando ${viajes.length} viajes en lotes...`);
    const ids4 = viajes.filter((_, idx) => idx % 2 === 0).map(v => v.id);
    const ids6 = viajes.filter((_, idx) => idx % 2 !== 0).map(v => v.id);

    // Lotes de 200
    for (let i = 0; i < ids4.length; i += 200) {
      await supabase.from('viajes').update({ vehiculo_id: id4 }).in('id', ids4.slice(i, i + 200));
    }
    for (let i = 0; i < ids6.length; i += 200) {
      await supabase.from('viajes').update({ vehiculo_id: id6 }).in('id', ids6.slice(i, i + 200));
    }
  }

  console.log('--- REASIGNACIÓN EN LOTES LISTA ---');
}

fix();
