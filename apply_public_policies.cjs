const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function testBloqueos() {
  const { data: bAnon, error: ebAnon } = await supabase
    .from('asientos_bloqueos')
    .select('*')
    .eq('viaje_id', '9ea7cf93-47b3-438c-b1a8-411cf229b4b3');

  console.log('Anon SELECT Bloqueos Result:', bAnon, 'Error:', ebAnon);
}

testBloqueos();
