const VAPID_PUBLIC_KEY = 'BPGwWNXzN4fKaD34wsfy6AOKSDAs48rNIJiRCUFby1omLzu9nOmqjMbjxW4MUCNfdOwMTgxIFytkrpHoqcGhK-I';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UadNrXkYfye7dbaplnTik5goeNMRfC0VDy0ZebwZVwU';
const VAPID_SUBJECT = 'mailto:admin@tibarthenos.com';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pcyektzremkilvpfqtll.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU';

// Simple REST helper to avoid importing supabase SDK in serverless
async function supabaseFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return text; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { subscription } = req.body || {};
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }

    try {
      const endpoint = subscription.endpoint;

      // Check if subscription already exists
      const existing = await supabaseFetch(
        `push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}&select=id`,
        { method: 'GET' }
      );

      if (Array.isArray(existing) && existing.length === 0) {
        // Insert new subscription
        await supabaseFetch('push_subscriptions', {
          method: 'POST',
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: subscription.keys?.p256dh || '',
            auth: subscription.keys?.auth || '',
            subscription_json: JSON.stringify(subscription),
          }),
        });
      }

      // Count total
      const countRes = await supabaseFetch('push_subscriptions?select=id', { method: 'GET' });
      const total = Array.isArray(countRes) ? countRes.length : 0;

      return res.status(200).json({ success: true, totalSubscribers: total });
    } catch (e) {
      console.error('save-subscription error:', e);
      return res.status(500).json({ error: e.message });
    }
  }

  // GET: count
  try {
    const countRes = await supabaseFetch('push_subscriptions?select=id', { method: 'GET' });
    return res.status(200).json({ totalSubscribers: Array.isArray(countRes) ? countRes.length : 0 });
  } catch {
    return res.status(200).json({ totalSubscribers: 0 });
  }
}
