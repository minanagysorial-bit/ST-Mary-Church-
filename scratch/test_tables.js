import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pcyektzremkilvpfqtll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU'
);

async function testAll() {
  const tables = ['prayer_requests', 'contact_messages', 'members', 'families', 'family_members', 'site_settings', 'announcements', 'sermons', 'profiles', 'church_members'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    console.log(`Table [${t}]:`, { canSelect: !error, error: error ? error.message : null });
  }
}
testAll();
