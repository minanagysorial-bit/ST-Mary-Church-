import { supabase } from './supabase';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
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

/** Request notification permission from user */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported on this browser.');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem('church_notifications_enabled', 'true');
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

  try {
    const reg = await navigator.serviceWorker.ready;
    if (reg && reg.showNotification) {
      await reg.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.svg',
        badge: payload.icon || '/favicon.svg',
        image: payload.image || undefined,
        data: {
          url: payload.url || '/'
        },
        dir: 'rtl',
        lang: 'ar',
        tag: 'church-notif-' + Date.now(),
        renotify: true
      } as any);
      return true;
    }
  } catch (err) {
    // Fallback to standard browser notification if SW ready fails
    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.svg'
      });
      return true;
    } catch (fallbackErr) {
      console.error('Notification fallback error:', fallbackErr);
    }
  }

  return false;
}

/** Broadcast notification from Admin to all devices & save in announcements */
export async function broadcastChurchNotification(payload: PushNotificationPayload, userId?: string | null): Promise<void> {
  // 1. Broadcast via Supabase Realtime Channel
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

  // 2. Also save into announcements table so it appears in church board/popups
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

  // 3. Trigger locally on sender device if permitted
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
      // If notifications are permitted, show system notification popup
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        triggerLocalNotification(payload as PushNotificationPayload);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
