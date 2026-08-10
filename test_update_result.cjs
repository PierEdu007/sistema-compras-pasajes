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

async function test() {
  await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  const { data: vList } = await supabase.from('vehiculos').select('*');
  console.log('--- ANTES ---');
  console.log(vList.map(v => ({ id: v.id, tipo: v.tipo, name: v.nombre_display })));

  if (vList.length >= 2) {
    const res1 = await supabase.from('vehiculos').update({
      tipo: 'CAMIONETA_4',
      nombre_display: 'Camioneta (4 Pasajeros)',
      total_asientos_pasajero: 4,
      layout_json: layout4,
      activo: true
    }).eq('id', vList[0].id).select();

    console.log('UPDATE 1:', res1);

    const res2 = await supabase.from('vehiculos').update({
      tipo: 'CAMIONETA_6',
      nombre_display: 'Camioneta (6 Pasajeros)',
      total_asientos_pasajero: 6,
      layout_json: layout6,
      activo: true
    }).eq('id', vList[1].id).select();

    console.log('UPDATE 2:', res2);

    for (let i = 2; i < vList.length; i++) {
      await supabase.from('vehiculos').update({ activo: false }).eq('id', vList[i].id).select();
    }
  }

  const { data: vListAfter } = await supabase.from('vehiculos').select('*');
  console.log('--- DESPUÉS ---');
  console.log(vListAfter.map(v => ({ id: v.id, tipo: v.tipo, name: v.nombre_display, total: v.total_asientos_pasajero, activo: v.activo })));
}

test();
