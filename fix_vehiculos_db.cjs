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
  const login = await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });
  console.log('Login result:', login.data.user?.id, login.error?.message);

  // 1. Obtener todos los vehículos
  const { data: vehiculos } = await supabase.from('vehiculos').select('*');
  console.log('Vehículos actuales:', vehiculos.map(v => `${v.id}: ${v.nombre_display}`));

  if (!vehiculos || vehiculos.length < 2) return;

  // 2. Modificar el primer vehículo como "Camioneta (4 Pasajeros)"
  const id4 = vehiculos[0].id;
  const { error: err4 } = await supabase.from('vehiculos').update({
    tipo: 'CAMIONETA_4',
    nombre_display: 'Camioneta (4 Pasajeros)',
    total_asientos_pasajero: 4,
    layout_json: layout4,
    activo: true
  }).eq('id', id4);
  console.log('Updated v4:', err4);

  // 3. Modificar el segundo vehículo como "Camioneta (6 Pasajeros)"
  const id6 = vehiculos[1].id;
  const { error: err6 } = await supabase.from('vehiculos').update({
    tipo: 'CAMIONETA_6',
    nombre_display: 'Camioneta (6 Pasajeros)',
    total_asientos_pasajero: 6,
    layout_json: layout6,
    activo: true
  }).eq('id', id6);
  console.log('Updated v6:', err6);

  // 4. Para el resto de vehículos, desactivarlos (activo = false)
  for (let i = 2; i < vehiculos.length; i++) {
    await supabase.from('vehiculos').update({ activo: false }).eq('id', vehiculos[i].id);
  }

  // 5. Reasignar todos los viajes entre id4 e id6
  const { data: viajes } = await supabase.from('viajes').select('id');
  if (viajes) {
    console.log(`Reasignando ${viajes.length} viajes...`);
    for (let i = 0; i < viajes.length; i++) {
      const targetId = (i % 2 === 0) ? id4 : id6;
      await supabase.from('viajes').update({ vehiculo_id: targetId }).eq('id', viajes[i].id);
    }
  }

  console.log('--- FINALIZADO CON ÉXITO ---');
}

fix();
