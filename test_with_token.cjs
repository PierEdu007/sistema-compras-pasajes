const { createClient } = require('@supabase/supabase-js');

async function run() {
  const anonClient = createClient(
    'https://ybnenttufdztznupgigk.supabase.co',
    'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
  );

  const auth = await anonClient.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  const token = auth.data.session.access_token;
  console.log('Token obtenido correctamente:', token.substring(0, 20) + '...');

  const adminClient = createClient(
    'https://ybnenttufdztznupgigk.supabase.co',
    'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    }
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

  const { data: vList } = await adminClient.from('vehiculos').select('*');
  console.log('Vehiculos count:', vList.length);

  for (let i = 0; i < vList.length; i++) {
    const is4 = (i % 2 === 0);
    const updatedName = is4 ? 'Camioneta (4 Pasajeros)' : 'Camioneta (6 Pasajeros)';
    const updatedTotal = is4 ? 4 : 6;
    const updatedLayout = is4 ? layout4 : layout6;
    const updatedTipo = is4 ? 'CAMIONETA_4' : 'CAMIONETA_6';

    const res = await adminClient.from('vehiculos').update({
      tipo: updatedTipo,
      nombre_display: updatedName,
      total_asientos_pasajero: updatedTotal,
      layout_json: updatedLayout,
      activo: i < 2 // Solo los primeros 2 activos
    }).eq('id', vList[i].id).select();

    console.log(`Vehiculo ${i + 1} (${vList[i].id}):`, res.data);
  }

  const { data: finalVehiculos } = await adminClient.from('vehiculos').select('*').eq('activo', true);
  console.log('--- VEHÍCULOS ACTIVOS RESULTANTES ---');
  console.log(finalVehiculos);
}

run();
