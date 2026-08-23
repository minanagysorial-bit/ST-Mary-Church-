import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BPGwWNXzN4fKaD34wsfy6AOKSDAs48rNIJiRCUFby1omLzu9nOmqjMbjxW4MUCNfdOwMTgxIFytkrpHoqcGhK-I';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UadNrXkYfye7dbaplnTik5goeNMRfC0VDy0ZebwZVwU';
const VAPID_SUBJECT = 'mailto:admin@tibarthenos.com';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pcyektzremkilvpfqtll.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

// Simple REST helper — no external SDK needed
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
  try { return JSON.parse(text); } catch { return []; }
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

  // Fetch ALL persisted subscriptions from Supabase
  let allSubs = [];
  try {
    const rows = await supabaseFetch('push_subscriptions?select=subscription_json', { method: 'GET' });
    if (Array.isArray(rows)) {
      allSubs = rows
        .map(r => { try { return JSON.parse(r.subscription_json); } catch { return null; } })
        .filter(Boolean);
    }
  } catch (e) {
    console.error('Failed to fetch subscriptions from DB:', e);
  }

  // Also add the single subscription passed in body (current device)
  const targets = [...allSubs];
  if (subscription && subscription.endpoint) {
    if (!targets.some(t => t.endpoint === subscription.endpoint)) {
      targets.push(subscription);
    }
  }

  if (targets.length === 0) {
    return res.status(200).json({
      success: true,
      delivered: 0,
      message: 'No active push subscriptions found — user must enable notifications first',
    });
  }

  let deliveredCount = 0;
  const errors = [];
  const staleEndpoints = [];

  await Promise.all(
    targets.map(async (target) => {
      try {
        await webpush.sendNotification(target, payload, {
          TTL: 86400,
          urgency: 'high',
        });
        deliveredCount++;
      } catch (err) {
        console.error('Push error:', target.endpoint, err.statusCode, err.message);
        errors.push(err.message);
        // Remove expired/invalid subscriptions (410 = Gone, 404 = Not Found)
        if (err.statusCode === 410 || err.statusCode === 404) {
          staleEndpoints.push(target.endpoint);
        }
      }
    })
  );

  // Clean up stale subscriptions
  if (staleEndpoints.length > 0) {
    for (const ep of staleEndpoints) {
      await supabaseFetch(
        `push_subscriptions?endpoint=eq.${encodeURIComponent(ep)}`,
        { method: 'DELETE' }
      ).catch(() => {});
    }
  }

  return res.status(200).json({
    success: true,
    delivered: deliveredCount,
    totalTargets: targets.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
