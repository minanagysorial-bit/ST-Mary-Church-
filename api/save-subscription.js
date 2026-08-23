const SUPABASE_URL = 'https://pcyektzremkilvpfqtll.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU';

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
      const subJson = JSON.stringify(subscription);
      const endpoint = subscription.endpoint;
      const p256dh = subscription.keys?.p256dh || '';
      const auth = subscription.keys?.auth || '';

      // Try to upsert into push_subscriptions
      const upsertRes = await fetch(
        `${SUPABASE_URL}/rest/v1/push_subscriptions`,
        {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify({ endpoint, p256dh, auth, subscription_json: subJson }),
        }
      );

      const resultText = await upsertRes.text();
      console.log('Supabase upsert status:', upsertRes.status, resultText);

      // Count total
      const countRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=id`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      });
      const countData = await countRes.json().catch(() => []);
      const total = Array.isArray(countData) ? countData.length : 0;

      return res.status(200).json({
        success: true,
        totalSubscribers: total,
        dbStatus: upsertRes.status,
      });
    } catch (e) {
      console.error('save-subscription error:', e);
      return res.status(500).json({ error: e.message });
    }
  }

  // GET: count
  try {
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=id`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const countData = await countRes.json().catch(() => []);
    return res.status(200).json({ totalSubscribers: Array.isArray(countData) ? countData.length : 0 });
  } catch {
    return res.status(200).json({ totalSubscribers: 0 });
  }
}
