const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function run() {
  const { data, error } = await supabase.from('vehiculos').select('*');
  console.log('Vehiculos en DB:', data, error);
}

run();
