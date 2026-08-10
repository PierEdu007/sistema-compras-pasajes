const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_publishable_Mdx2PoPGjjz1S7FtJpSucw__QkNvuMF'
);

async function run() {
  const auth = await supabase.auth.signInWithPassword({
    email: 'admin@kintu.com',
    password: 'password123'
  });
  console.log('User ID:', auth.data.user?.id);

  const { data: roles } = await supabase.from('user_roles').select('*');
  console.log('User roles:', roles);
}

run();
