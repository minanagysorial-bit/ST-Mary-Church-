import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
      if (key) {
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const email = 'admin@stmary.church';
  const password = 'Admin@123456';

  console.log("Logging in...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) {
    console.error("Auth Login Failed:", authError.message);
    return;
  }

  const user = authData.user;
  console.log("Logged in. User ID:", user.id);

  console.log("\n1. Testing UPDATE on own profile...");
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ full_name: 'مدير النظام (Super Admin)' })
    .eq('id', user.id);

  if (updateError) {
    console.error("❌ Update profiles failed:", updateError.message, updateError);
  } else {
    console.log("✅ Update profiles succeeded!");
  }

  console.log("\n2. Testing INSERT of a new profile...");
  const tempId = '00000000-0000-0000-0000-999999999999';
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: tempId,
      email: 'temp-test-user@stmary.church',
      full_name: 'مستخدم تجريبي مؤقت',
      role: 'servant'
    });

  if (insertError) {
    console.error("❌ Insert profiles failed:", insertError.message, insertError);
  } else {
    console.log("✅ Insert profiles succeeded!");
  }

  console.log("\n3. Testing DELETE of the new profile...");
  const { error: deleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', tempId);

  if (deleteError) {
    console.error("❌ Delete profiles failed:", deleteError.message, deleteError);
  } else {
    console.log("✅ Delete profiles succeeded!");
  }
}

run();
