import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BPGwWNXzN4fKaD34wsfy6AOKSDAs48rNIJiRCUFby1omLzu9nOmqjMbjxW4MUCNfdOwMTgxIFytkrpHoqcGhK-I';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UadNrXkYfye7dbaplnTik5goeNMRfC0VDy0ZebwZVwU';
const VAPID_SUBJECT = 'mailto:admin@tibarthenos.com';

const SUPABASE_URL = 'https://pcyektzremkilvpfqtll.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

async function fetchSubscriptionsFromDB() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?select=subscription_json`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) return [];
    const rows = await res.json();
    return rows
      .map(r => { try { return JSON.parse(r.subscription_json); } catch { return null; } })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, body, icon, url, image, subscription } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: icon || '/app-icon-192.png',
    image: image || undefined,
    url: url || '/',
  });

  // Collect targets: DB subscriptions + the one sent in body
  const dbSubs = await fetchSubscriptionsFromDB();
  const targets = [...dbSubs];

  if (subscription && subscription.endpoint) {
    if (!targets.some(t => t.endpoint === subscription.endpoint)) {
      targets.push(subscription);
    }
  }

  console.log(`Sending push to ${targets.length} targets`);

  if (targets.length === 0) {
    return res.status(200).json({
      success: true,
      delivered: 0,
      message: 'No active push subscriptions found - user must enable notifications first',
    });
  }

  let deliveredCount = 0;
  const errors = [];

  await Promise.all(
    targets.map(async (target) => {
      try {
        await webpush.sendNotification(target, payload, { TTL: 86400, urgency: 'high' });
        deliveredCount++;
      } catch (err) {
        console.error('Push error:', err.statusCode, err.message);
        errors.push({ endpoint: target.endpoint?.slice(-30), code: err.statusCode, msg: err.message });
      }
    })
  );

  return res.status(200).json({
    success: true,
    delivered: deliveredCount,
    totalTargets: targets.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
