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
  const auth = await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });
  console.log('Logged in token:', auth.data.session?.access_token ? 'YES' : 'NO');

  // Query vehiculos
  const { data: vList } = await supabase.from('vehiculos').select('*');
  console.log('Vehiculos count:', vList?.length);

  for (let i = 0; i < vList.length; i++) {
    const is4 = (i % 2 === 0);
    const updatedName = is4 ? 'Camioneta (4 Pasajeros)' : 'Camioneta (6 Pasajeros)';
    const updatedTotal = is4 ? 4 : 6;
    const updatedLayout = is4 ? layout4 : layout6;

    const res = await supabase.from('vehiculos').update({
      nombre_display: updatedName,
      total_asientos_pasajero: updatedTotal,
      layout_json: updatedLayout
    }).eq('id', vList[i].id).select();

    console.log(`Vehiculo ${i + 1} (${vList[i].id}):`, res.data);
  }
}

run();
