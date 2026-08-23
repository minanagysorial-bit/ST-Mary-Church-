import webpush from 'web-push';
import { memorySubscriptions } from './save-subscription.js';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BPGwWNXzN4fKaD34wsfy6AOKSDAs48rNIJiRCUFby1omLzu9nOmqjMbjxW4MUCNfdOwMTgxIFytkrpHoqcGhK-I';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UadNrXkYfye7dbaplnTik5goeNMRfC0VDy0ZebwZVwU';
const VAPID_SUBJECT = 'mailto:admin@tibarthenos.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, body, icon, url, image, subscription } = req.body || {};

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  const payload = JSON.stringify({
    title,
    body,
    icon: icon || '/app-icon-192.png',
    image: image || undefined,
    url: url || '/'
  });

  const targets = [];
  if (subscription && subscription.endpoint) {
    targets.push(subscription);
  }
  
  // Add all global subscribers from memory
  if (Array.isArray(memorySubscriptions)) {
    for (const sub of memorySubscriptions) {
      if (!targets.some(t => t.endpoint === sub.endpoint)) {
        targets.push(sub);
      }
    }
  }

  if (targets.length === 0) {
    return res.status(200).json({
      success: true,
      delivered: 0,
      message: 'No active push subscriptions found on server'
    });
  }

  let deliveredCount = 0;
  const errors = [];

  await Promise.all(
    targets.map(async (target) => {
      try {
        await webpush.sendNotification(target, payload, {
          TTL: 86400, // 24 hours
          urgency: 'high'
        });
        deliveredCount++;
      } catch (err) {
        console.error('Push error for endpoint:', target.endpoint, err);
        errors.push(err.message);
      }
    })
  );

  return res.status(200).json({
    success: true,
    delivered: deliveredCount,
    totalTargets: targets.length,
    errors: errors.length > 0 ? errors : undefined
  });
}
