const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function addFunc() {
  await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  const sql = `
    CREATE OR REPLACE FUNCTION confirmar_pago_asiento(p_viaje_id UUID, p_numero_asiento INTEGER)
    RETURNS VOID
    LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN
      DELETE FROM asientos_bloqueos 
      WHERE viaje_id = p_viaje_id AND numero_asiento = p_numero_asiento;

      INSERT INTO asientos_bloqueos (viaje_id, numero_asiento, estado, expira_at, sesion_token)
      VALUES (p_viaje_id, p_numero_asiento, 'PAGADO', NOW() + INTERVAL '100 years', 'PAGADO');
    END;
    $$;
  `;

  console.log('Función `confirmar_pago_asiento` lista.');
}

addFunc();
