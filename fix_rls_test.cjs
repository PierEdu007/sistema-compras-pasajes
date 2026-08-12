const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function fixRLS() {
  console.log('--- Autenticando Admin ---');
  const auth = await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  if (auth.error) {
    console.error('Auth error:', auth.error);
    return;
  }

  console.log('Autenticado como:', auth.data.user.email);

  // Probar inserción directa de prueba en ventas
  const testPayload = {
    viaje_id: '85ac7838-14d9-4344-be9a-7b6c526ee258',
    numero_asiento: 2,
    tipo_documento: 'DNI',
    nro_documento: '75622278',
    nombres: 'Prueba RLS',
    apellidos: 'Test',
    email: 'test@example.com',
    telefono: '999999999',
    monto_pagado: 50.00,
    culqi_charge_id: 'TEST-RLS'
  };

  const { data: testData, error: testErr } = await supabase
    .from('ventas')
    .insert(testPayload)
    .select('*')
    .single();

  console.log('Test Inserción en Ventas:', testData, 'Error:', testErr);

  if (!testErr && testData) {
    // Eliminar registro de prueba
    await supabase.from('ventas').delete().eq('id', testData.id);
  }
}

fixRLS();
