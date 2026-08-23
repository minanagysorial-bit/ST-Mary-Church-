import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://pcyektzremkilvpfqtll.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU'
);

// In-memory fallback cache in case DB table is not present
let memorySubscriptions = [];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { subscription } = req.body || {};
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    try {
      // Check if already in memory
      const exists = memorySubscriptions.some(s => s.endpoint === subscription.endpoint);
      if (!exists) {
        memorySubscriptions.push(subscription);
      }

      return res.status(200).json({
        success: true,
        message: 'Subscription saved successfully',
        totalSubscribers: memorySubscriptions.length
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // GET: list subscribers count
  return res.status(200).json({
    totalSubscribers: memorySubscriptions.length
  });
}
export { memorySubscriptions };
