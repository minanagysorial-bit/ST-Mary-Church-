import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pcyektzremkilvpfqtll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU'
);

const testSub = {
  endpoint: `https://fcm.googleapis.com/fcm/send/TEST_${Date.now()}`,
  p256dh: 'test_p256dh',
  auth: 'test_auth',
  subscription_json: JSON.stringify({ endpoint: 'https://test', keys: { p256dh: 'test', auth: 'test' } })
};

const { data, error } = await supabase.from('push_subscriptions').insert(testSub).select();
console.log('Insert result:', { data, error });

const { data: all, error: e2 } = await supabase.from('push_subscriptions').select('*');
console.log('All rows:', { count: all?.length, error: e2 });
