const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function cleanVehicles() {
  console.log('--- Iniciando sesión Admin ---');
  await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  const { data: vehiculos, error } = await supabase.from('vehiculos').select('*');
  console.log('Vehículos en DB antes de actualizar:', vehiculos);

  if (vehiculos && vehiculos.length > 0) {
    for (const v of vehiculos) {
      if (v.nombre_display.includes('Renault') || v.nombre_display.includes('Suzuki') || v.total_asientos_pasajero > 6) {
        const is6Seats = v.nombre_display.includes('6') || v.total_asientos_pasajero === 6;
        const newName = is6Seats ? 'Camioneta (6 Pasajeros)' : 'Camioneta (4 Pasajeros)';
        const newTotal = is6Seats ? 6 : 4;

        console.log(`Actualizando vehículo ${v.id} (${v.nombre_display}) -> ${newName} (${newTotal} asientos)...`);
        await supabase
          .from('vehiculos')
          .update({
            nombre_display: newName,
            total_asientos_pasajero: newTotal,
            placa: ''
          })
          .eq('id', v.id);
      }
    }
  }

  console.log('✅ Vehículos en DB actualizados correctamente.');
}

cleanVehicles();
