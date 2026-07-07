const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ybnenttufdztznupgigk.supabase.co', 'sb_secret_VT0L5Gxn4fwmS31KwJs7NA_BAj8X8i1');
async function test() {
  const { data } = await supabase.from('viajes').select('id, vehiculos(nombre_display, total_asientos_pasajero)').limit(1);
  console.log(JSON.stringify(data, null, 2));
}
test();
