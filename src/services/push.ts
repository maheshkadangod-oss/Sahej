// Web Push client (Phase 2). Subscribes the device to push and syncs the list of future-dated
// reminders (vaccination / weight) to the server, which sends them via a daily cron — so they
// fire even when the app is fully closed.
//
// Everything here is a graceful no-op when VITE_VAPID_PUBLIC_KEY isn't configured, so the build
// and the app keep working before push is set up. Until then, Phase-1 in-app reminders cover it.

export interface PushReminder {
  id: string;
  /** When to fire, epoch ms. */
  fireAt: number;
  title: string;
  body: string;
}

const VAPID_PUBLIC = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) || '';

export function isPushConfigured(): boolean {
  return !!VAPID_PUBLIC;
}

export function isPushSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Stable per-device id so the server can update this device's reminder set on each sync. */
function getDeviceToken(): string {
  let token = localStorage.getItem('sahej_push_token');
  if (!token) {
    token = (crypto.randomUUID?.() ?? `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem('sahej_push_token', token);
  }
  return token;
}

// VAPID public keys are URL-safe base64; the PushManager wants a Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/**
 * Ensure a push subscription exists and push the current reminder set to the server.
 * Safe to call repeatedly (e.g., whenever reminders change) — it reuses any existing subscription.
 * Returns false if push isn't configured/supported/permitted, or on any error.
 */
export async function syncPushReminders(reminders: PushReminder[]): Promise<boolean> {
  if (!isPushConfigured() || !isPushSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    }

    const resp = await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'subscribe',
        token: getDeviceToken(),
        subscription,
        reminders,
      }),
    });
    return resp.ok;
  } catch (err) {
    console.warn('Push sync failed (falling back to in-app reminders):', err);
    return false;
  }
}

/** Tell the server to forget this device (called when the user turns notifications off). */
export async function unsyncPush(): Promise<void> {
  if (!isPushConfigured() || !isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    await subscription?.unsubscribe().catch(() => {});
    await fetch('/api/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unsubscribe', token: getDeviceToken() }),
    }).catch(() => {});
  } catch { /* best-effort */ }
}
