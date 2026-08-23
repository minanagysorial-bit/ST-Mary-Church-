import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pcyektzremkilvpfqtll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU'
);

// Show all subscriptions
const { data, error } = await supabase.from('push_subscriptions').select('id,endpoint,created_at');
console.log('All subscriptions:', JSON.stringify(data, null, 2));
console.log('Error:', error);

// Delete test rows
const { error: delErr } = await supabase.from('push_subscriptions').delete().like('endpoint', '%TEST%');
console.log('Deleted test rows:', delErr);
