import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gcxiextecvobcprzihyq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjeGlleHRlY3ZvYmNwcnppaHlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjg1MzIsImV4cCI6MjEwMTcwNDUzMn0.o2NOSAJNKMZ05S4Xdu1zlGHzpEFFtC1RDDTV61rjwM0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching quizzes...");
  try {
    const { data, error } = await supabase.from('quizzes').select('*');
    if (error) {
      console.error("Supabase Error:", error);
    } else {
      console.log("Success! Data count:", data ? data.length : null);
      console.log("Quizzes:", data);
    }
  } catch (err) {
    console.error("Catch Exception:", err);
  }
}

run();
