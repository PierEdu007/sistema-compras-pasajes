const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function testSql() {
  await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  // Intentar crear la función RPC confirmar_pago_asiento y registrar_venta_publica
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      CREATE OR REPLACE FUNCTION confirmar_pago_asiento(
        p_viaje_id UUID,
        p_numero_asiento INTEGER
      )
      RETURNS VOID
      LANGUAGE plpgsql SECURITY DEFINER AS $$
      BEGIN
        INSERT INTO asientos_bloqueos (viaje_id, numero_asiento, estado, expira_at, sesion_token)
        VALUES (p_viaje_id, p_numero_asiento, 'PAGADO', '2099-12-31 23:59:59+00'::TIMESTAMPTZ, 'PAGADO')
        ON CONFLICT (viaje_id, numero_asiento) 
        DO UPDATE SET estado = 'PAGADO', expira_at = '2099-12-31 23:59:59+00'::TIMESTAMPTZ, sesion_token = 'PAGADO';
      END;
      $$;
    `
  });

  console.log('Exec SQL Result:', data, 'Error:', error);
}

testSql();
