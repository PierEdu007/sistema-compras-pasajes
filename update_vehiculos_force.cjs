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
  const login = await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });
  console.log('Login:', login.data.user?.email, login.error);

  const res1 = await supabase.from('vehiculos').update({
    nombre_display: 'Camioneta (4 Pasajeros)',
    total_asientos_pasajero: 4,
    layout_json: layout4
  }).in('tipo', ['RENAULT_MASTER', 'RENAULT_MASTER_1', 'RENAULT_MASTER_3']);

  console.log('Res 1 (4 Pasajeros):', res1);

  const res2 = await supabase.from('vehiculos').update({
    nombre_display: 'Camioneta (6 Pasajeros)',
    total_asientos_pasajero: 6,
    layout_json: layout6
  }).in('tipo', ['SUZUKI_ERTIGA', 'RENAULT_MASTER_2', 'RENAULT_MASTER_4']);

  console.log('Res 2 (6 Pasajeros):', res2);
}

run();
