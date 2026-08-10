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
    console.error('Error auth:', auth.error);
    return;
  }

  console.log('Autenticado como:', auth.data.user.email);

  // Actualizar Fila 1 a Camioneta 4 Pasajeros
  const { error: err1 } = await supabase.from('vehiculos').update({
    tipo: 'CAMIONETA_4',
    nombre_display: 'Camioneta (4 Pasajeros)',
    total_asientos_pasajero: 4,
    layout_json: layout4,
    activo: true
  }).eq('id', '1bb8cda1-3e04-487d-bb9d-72189a021105');

  console.log('Actualizado vehiculo 4 pasajeros:', err1 ? err1 : 'OK');

  // Actualizar Fila 2 a Camioneta 6 Pasajeros
  const { error: err2 } = await supabase.from('vehiculos').update({
    tipo: 'CAMIONETA_6',
    nombre_display: 'Camioneta (6 Pasajeros)',
    total_asientos_pasajero: 6,
    layout_json: layout6,
    activo: true
  }).eq('id', '0e330045-8afa-4eaa-833c-6668f3dd409f');

  console.log('Actualizado vehiculo 6 pasajeros:', err2 ? err2 : 'OK');

  // Para los vehículos 3, 4, 5, 6: repartirlos como 4 o 6 pasajeros sin placa
  const extraIds4 = ['002c3b6c-de82-4a82-8d84-f7e5f74c0dc4', '3b18223d-916e-4a16-9934-3eaa9518b63e'];
  const extraIds6 = ['9785b822-4f44-42a8-a196-bbb67102f680', '6f6ab7a8-0b57-4991-a033-ddbf1be5bc82'];

  for (const id of extraIds4) {
    await supabase.from('vehiculos').update({
      tipo: 'CAMIONETA_4',
      nombre_display: 'Camioneta (4 Pasajeros)',
      total_asientos_pasajero: 4,
      layout_json: layout4,
      activo: true
    }).eq('id', id);
  }

  for (const id of extraIds6) {
    await supabase.from('vehiculos').update({
      tipo: 'CAMIONETA_6',
      nombre_display: 'Camioneta (6 Pasajeros)',
      total_asientos_pasajero: 6,
      layout_json: layout6,
      activo: true
    }).eq('id', id);
  }

  console.log('Todos los vehículos actualizados correctamente a 4 y 6 Pasajeros.');
}

run();
