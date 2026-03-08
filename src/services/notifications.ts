const PERMISSION_KEY = 'sahej_notifications_enabled';
const REMINDER_TIMERS_KEY = 'sahej_reminder_timers';

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function isNotificationEnabled(): boolean {
  return localStorage.getItem(PERMISSION_KEY) === 'true' && Notification.permission === 'granted';
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  const permission = await Notification.requestPermission();
  const granted = permission === 'granted';
  localStorage.setItem(PERMISSION_KEY, String(granted));
  return granted;
}

export function disableNotifications() {
  localStorage.setItem(PERMISSION_KEY, 'false');
  clearAllReminders();
}

let reminderIntervals: number[] = [];

export function startReminders() {
  clearAllReminders();
  if (!isNotificationEnabled()) return;

  // Water reminder every 2 hours
  reminderIntervals.push(
    window.setInterval(() => {
      showNotification('💧 Time for water!', 'Take a sip of water, mama. Staying hydrated helps your recovery.');
    }, 2 * 60 * 60 * 1000)
  );

  // Rest reminder every 3 hours
  reminderIntervals.push(
    window.setInterval(() => {
      showNotification('🌙 Rest reminder', 'If baby is sleeping, try to rest too. Even 5 minutes of deep breathing helps.');
    }, 3 * 60 * 60 * 1000)
  );

  // Vitamin reminder once a day (check if already reminded today)
  const lastVitaminReminder = localStorage.getItem('sahej_last_vitamin_reminder');
  const today = new Date().toDateString();
  if (lastVitaminReminder !== today) {
    // Set a timeout for 10am
    const now = new Date();
    const tenAm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    if (now < tenAm) {
      const msUntil10am = tenAm.getTime() - now.getTime();
      reminderIntervals.push(
        window.setTimeout(() => {
          showNotification('💊 Vitamin time!', "Don't forget your daily vitamins. Your body is recovering and needs the support.");
          localStorage.setItem('sahej_last_vitamin_reminder', today);
        }, msUntil10am) as unknown as number
      );
    }
  }
}

export function clearAllReminders() {
  reminderIntervals.forEach(id => {
    clearInterval(id);
    clearTimeout(id);
  });
  reminderIntervals = [];
}

function showNotification(title: string, body: string) {
  if (!isNotificationEnabled()) return;
  try {
    new Notification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: title,
      renotify: false,
    });
  } catch (e) {
    // Fallback for environments where Notification constructor fails
    console.log('Notification:', title, body);
  }
}
