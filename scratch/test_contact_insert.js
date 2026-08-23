import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pcyektzremkilvpfqtll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU'
);

async function testContactInsert() {
  const { data, error } = await supabase.from('contact_messages').insert({
    name: 'Push_Device_Registration',
    email: 'push@device.local',
    phone: '0000000000',
    subject: '__PUSH_SUBSCRIPTION__',
    message: JSON.stringify({
      endpoint: 'https://fcm.googleapis.com/fcm/send/test_endpoint',
      keys: { p256dh: 'test_p256dh', auth: 'test_auth' }
    })
  }).select();

  console.log('contact_messages insert test:', { data, error });
}
testContactInsert();
