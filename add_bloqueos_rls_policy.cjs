const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function applyRLS() {
  await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });

  // Intentar crear la política pública de inserción y modificación si no existe
  console.log('Aplicando RLS a asientos_bloqueos...');
}

applyRLS();
