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

/** Check if Web Notifications and ServiceWorker are supported */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

/** Get current notification permission */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/** Register device push subscription with VAPID and save to server */
export async function registerPushSubscription(): Promise<PushSubscription | null> {
  if (!isNotificationSupported()) return null;

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) return null;

    let sub = await reg.pushManager.getSubscription();
    const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as any
      });
    }

    if (sub) {
      const subJson = sub.toJSON();
      localStorage.setItem('church_push_sub', JSON.stringify(subJson));

      // Save to server
      await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subJson })
      }).catch(err => console.warn('Save subscription error:', err));
    }

    return sub;
  } catch (err) {
    console.error('Failed to register push subscription:', err);
    return null;
  }
}

/** Request notification permission from user and register subscription */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported on this browser.');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('church_notifications_enabled', 'true');
      await registerPushSubscription();
    }
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/** Trigger local push notification via active Service Worker */
export async function triggerLocalNotification(payload: PushNotificationPayload): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const iconUrl = payload.icon 
    ? (payload.icon.startsWith('http') ? payload.icon : window.location.origin + payload.icon) 
    : window.location.origin + '/app-icon-192.png';
  const badgeUrl = window.location.origin + '/app-icon-192.png';

  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg && reg.showNotification) {
      await reg.showNotification(payload.title, {
        body: payload.body,
        icon: iconUrl,
        badge: badgeUrl,
        image: payload.image || undefined,
        data: {
          url: payload.url || '/'
        },
        dir: 'rtl',
        lang: 'ar',
        tag: 'church-notif-' + Date.now(),
        renotify: true,
        requireInteraction: true
      } as any);
      return true;
    }
  } catch (err) {
    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: iconUrl
      });
      return true;
    } catch (fallbackErr) {
      console.error('Notification fallback error:', fallbackErr);
    }
  }

  return false;
}

/** Broadcast notification from Admin via Web-Push server, Supabase Realtime, and Announcements */
export async function broadcastChurchNotification(payload: PushNotificationPayload, userId?: string | null): Promise<void> {
  // 1. Get current device subscription if available
  let userSub: any = null;
  try {
    const saved = localStorage.getItem('church_push_sub');
    if (saved) userSub = JSON.parse(saved);
  } catch (e) {
    // ignore
  }

  // 2. Call serverless Web-Push endpoint
  try {
    await fetch('/api/send-push', {
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
  } catch (e) {
    console.warn('Server push API error:', e);
  }

  // 3. Broadcast via Supabase Realtime Channel
  try {
    const channel = supabase.channel('church_realtime_notifications');
    await channel.send({
      type: 'broadcast',
      event: 'new_push_notification',
      payload
    });
  } catch (e) {
    console.warn('Realtime broadcast error:', e);
  }

  // 4. Save into announcements table
  try {
    await supabase.from('announcements').insert({
      title: payload.title,
      content: payload.body + (payload.url ? `\nالرابط: ${payload.url}` : ''),
      duration_type: 'days_limit',
      duration_days: 7,
      start_date: new Date().toISOString().split('T')[0],
      is_active: true,
      created_by: userId || '00000000-0000-0000-0000-000000000001'
    });
  } catch (e) {
    console.warn('Announcements insert error:', e);
  }

  // 5. Trigger locally immediately
  if (Notification.permission === 'granted') {
    await triggerLocalNotification(payload);
  }
}

/** Subscribe to realtime notifications while browsing the app */
export function subscribeToChurchNotifications(callback: (payload: PushNotificationPayload) => void) {
  const channel = supabase
    .channel('church_realtime_notifications')
    .on('broadcast', { event: 'new_push_notification' }, ({ payload }) => {
      callback(payload as PushNotificationPayload);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        triggerLocalNotification(payload as PushNotificationPayload);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
