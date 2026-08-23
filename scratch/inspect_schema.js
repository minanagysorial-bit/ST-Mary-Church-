import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pcyektzremkilvpfqtll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU'
);

async function inspectSchema() {
  const { data: cData, error: cErr } = await supabase.from('contact_messages').select('*').limit(5);
  console.log('contact_messages rows:', cData, cErr);

  const { data: pData, error: pErr } = await supabase.from('prayer_requests').select('*').limit(5);
  console.log('prayer_requests rows:', pData, pErr);
}
inspectSchema();
