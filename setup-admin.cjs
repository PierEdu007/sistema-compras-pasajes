const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ybnenttufdztznupgigk.supabase.co',
  'sb_secret_VT0L5Gxn4fwmS31KwJs7NA_BAj8X8i1'
);

async function setup() {
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: 'admin@kintu.com',
    password: 'password123',
    email_confirm: true
  });

  if (authErr) {
    console.error('Error creating user:', authErr);
    return;
  }
  
  const userId = authData.user.id;
  console.log('User created:', userId);

  const { error: roleErr } = await supabase.from('user_roles').insert([
    { user_id: userId, rol: 'ADMIN' }
  ]);

  if (roleErr) {
    console.error('Error assigning role:', roleErr);
  } else {
    console.log('Role assigned successfully!');
  }
}

setup();
