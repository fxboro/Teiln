import { InAppNotification, NotificationPreferences } from '../types';

const PREFS_STORAGE_KEY = 'teiln_push_notification_prefs';
const NOTIFICATIONS_STORAGE_KEY = 'teiln_in_app_notifications_history';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabled: true,
  notifyOnExpense: true,
  notifyOnSettlementRequest: true,
  notifyOnSettlementCompleted: true,
  soundEnabled: true,
};

// Simple web audio synthetic notification chime (doesn't rely on external audio files)
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play a friendly two-tone modern fintech chime (E5 -> A5)
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.15, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.46);
  } catch (e) {
    // Audio contexts might be blocked until user gesture, safely ignore
  }
}

/**
 * Check if the browser supports Notification API
 */
export function isPushNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isPushNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error('Error requesting notification permission:', e);
    return Notification.permission;
  }
}

/**
 * Load user notification preferences from localStorage
 */
export function loadNotificationPreferences(): NotificationPreferences {
  try {
    const saved = localStorage.getItem(PREFS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(saved) };
    }
  } catch (e) {
    // Ignore parse error
  }
  return DEFAULT_NOTIFICATION_PREFS;
}

/**
 * Save user notification preferences to localStorage
 */
export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    // Ignore error
  }
}

/**
 * Load in-app notification history
 */
export function loadNotificationHistory(): InAppNotification[] {
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // Ignore
  }
  return [];
}

/**
 * Save in-app notification history
 */
export function saveNotificationHistory(list: InAppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    // Ignore
  }
}

export interface SendPushNotificationOptions {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  groupId?: string;
  groupName?: string;
  type: 'expense_added' | 'settlement_requested' | 'settlement_completed';
  amount?: number;
  currency?: string;
  actorName: string;
  actorAvatar?: string;
  targetUserId?: string;
}

/**
 * Dispatch both system browser push notification (via ServiceWorker / Notification API)
 * and in-app banner chime.
 */
export async function dispatchPushNotification(
  options: SendPushNotificationOptions,
  prefs: NotificationPreferences
): Promise<{ systemNotificationShown: boolean; inAppNotification: InAppNotification }> {
  // Construct InAppNotification item
  const inAppNotif: InAppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: options.type,
    title: options.title,
    body: options.body,
    group_id: options.groupId || '',
    group_name: options.groupName || 'Teiln Group',
    amount: options.amount,
    currency: options.currency as any,
    actor_name: options.actorName,
    actor_avatar: options.actorAvatar,
    target_user_id: options.targetUserId,
    timestamp: new Date().toISOString(),
    read: false,
  };

  // Play audio chime if enabled
  if (prefs.soundEnabled) {
    playNotificationSound();
  }

  let systemNotificationShown = false;

  // Check if browser notifications are supported, enabled, and permitted
  if (
    isPushNotificationSupported() &&
    Notification.permission === 'granted' &&
    prefs.enabled
  ) {
    // Check specific filter
    let shouldShow = true;
    if (options.type === 'expense_added' && !prefs.notifyOnExpense) shouldShow = false;
    if (options.type === 'settlement_requested' && !prefs.notifyOnSettlementRequest) shouldShow = false;
    if (options.type === 'settlement_completed' && !prefs.notifyOnSettlementCompleted) shouldShow = false;

    if (shouldShow) {
      try {
        // First try ServiceWorker showNotification if registered (best for mobile and desktop background)
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready.catch(() => null);
          if (registration && registration.showNotification) {
            await registration.showNotification(options.title, {
              body: options.body,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              tag: options.tag || `teiln-${Date.now()}`,
              vibrate: [150, 60, 150],
              data: {
                url: options.url || '/',
                groupId: options.groupId,
                notificationId: inAppNotif.id,
              },
            } as NotificationOptions & { vibrate?: number[] });
            systemNotificationShown = true;
          }
        }

        // Fallback to standard Notification instance if service worker didn't show
        if (!systemNotificationShown) {
          const n = new Notification(options.title, {
            body: options.body,
            icon: '/favicon.svg',
            tag: options.tag || `teiln-${Date.now()}`,
          });
          n.onclick = () => {
            window.focus();
            n.close();
          };
          systemNotificationShown = true;
        }
      } catch (err) {
        console.warn('System push notification could not be displayed:', err);
      }
    }
  }

  return { systemNotificationShown, inAppNotification: inAppNotif };
}
