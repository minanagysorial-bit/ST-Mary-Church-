import { supabase } from './supabase';

export const VAPID_PUBLIC_KEY = 'BPGwWNXzN4fKaD34wsfy6AOKSDAs48rNIJiRCUFby1omLzu9nOmqjMbjxW4MUCNfdOwMTgxIFytkrpHoqcGhK-I';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/** Full flow: request permission → register SW → subscribe pushManager → save to DB */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';

  try {
    // Step 1: Ask browser permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return permission;

    // Step 2: Ensure SW is registered
    let reg: ServiceWorkerRegistration | null = null;
    try {
      reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      reg = await navigator.serviceWorker.ready;
    } catch (swErr) {
      console.warn('SW registration failed:', swErr);
    }

    if (!reg || !reg.pushManager) return 'granted'; // permission granted but no push

    // Step 3: Unsubscribe old sub first to get fresh one with correct VAPID key
    const existing = await reg.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();

    // Step 4: Subscribe with VAPID
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any
    });

    // Step 5: Save subscription to server DB
    const subJson = sub.toJSON();
    localStorage.setItem('church_push_sub', JSON.stringify(subJson));
    localStorage.setItem('church_notifications_enabled', 'true');

    // POST to Vercel API → saves in Supabase push_subscriptions table
    const saveRes = await fetch('/api/save-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription: subJson })
    });
    const saveData = await saveRes.json().catch(() => ({}));
    console.log('Subscription saved:', saveData);

    return 'granted';
  } catch (error: any) {
    console.error('requestNotificationPermission error:', error);
    // If already granted just try to re-register
    if (Notification.permission === 'granted') return 'granted';
    return 'denied';
  }
}

/** Show a local notification immediately via Service Worker */
export async function triggerLocalNotification(payload: PushNotificationPayload): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return false;

  const origin = window.location.origin;
  const iconUrl = payload.icon
    ? (payload.icon.startsWith('http') ? payload.icon : origin + payload.icon)
    : origin + '/app-icon-192.png';

  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(payload.title, {
      body: payload.body,
      icon: iconUrl,
      badge: origin + '/app-icon-192.png',
      image: payload.image || undefined,
      data: { url: payload.url || '/' },
      dir: 'rtl',
      lang: 'ar',
      tag: 'church-notif-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200]
    } as any);
    return true;
  } catch (err) {
    try {
      new Notification(payload.title, { body: payload.body, icon: iconUrl });
      return true;
    } catch {
      return false;
    }
  }
}

/** Admin broadcast: sends via server Web-Push to ALL registered devices */
export async function broadcastChurchNotification(payload: PushNotificationPayload, userId?: string | null): Promise<void> {
  const saved = localStorage.getItem('church_push_sub');
  const userSub = saved ? JSON.parse(saved) : null;

  // 1. Server push to ALL subscribers in DB
  try {
    const res = await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/app-icon-192.png',
        image: payload.image,
        url: payload.url || '/',
        subscription: userSub
      })
    });
    const data = await res.json().catch(() => ({}));
    console.log('Push broadcast result:', data);
  } catch (e) {
    console.warn('Server push error:', e);
  }

  // 2. Supabase Realtime for users currently browsing
  try {
    const channel = supabase.channel('church_realtime_notifications');
    await channel.send({ type: 'broadcast', event: 'new_push_notification', payload });
  } catch (e) {
    console.warn('Realtime error:', e);
  }

  // 3. Local notification for the admin sending
  if (Notification.permission === 'granted') {
    await triggerLocalNotification(payload);
  }
}

/** Listen for realtime notifications while app is open */
export function subscribeToChurchNotifications(callback: (payload: PushNotificationPayload) => void) {
  const channel = supabase
    .channel('church_realtime_notifications')
    .on('broadcast', { event: 'new_push_notification' }, ({ payload }) => {
      callback(payload as PushNotificationPayload);
      if (Notification.permission === 'granted') {
        triggerLocalNotification(payload as PushNotificationPayload);
      }
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
