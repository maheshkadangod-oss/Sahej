const PERMISSION_KEY = 'sahej_notifications_enabled';
const REMINDER_TIMERS_KEY = 'sahej_reminder_timers';

export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

export function isNotificationEnabled(): boolean {
  if (!isNotificationSupported()) return false;
  const storedPref = localStorage.getItem(PERMISSION_KEY) === 'true';
  const osGranted = Notification.permission === 'granted';
  // Sync stored preference with OS state
  if (storedPref && !osGranted) {
    localStorage.setItem(PERMISSION_KEY, 'false');
    return false;
  }
  return storedPref && osGranted;
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

let reminderTimerIds: ReturnType<typeof setTimeout>[] = [];

export function startReminders() {
  clearAllReminders();
  if (!isNotificationEnabled()) return;

  // Water reminder every 2 hours
  reminderTimerIds.push(
    setInterval(() => {
      showNotification('💧 Time for water!', 'Take a sip of water, mama. Staying hydrated helps your recovery.');
    }, 2 * 60 * 60 * 1000)
  );

  // Rest reminder every 3 hours
  reminderTimerIds.push(
    setInterval(() => {
      showNotification('🌙 Rest reminder', 'If baby is sleeping, try to rest too. Even 5 minutes of deep breathing helps.');
    }, 3 * 60 * 60 * 1000)
  );

  // Vitamin reminder once a day (check if already reminded today)
  const lastVitaminReminder = localStorage.getItem('sahej_last_vitamin_reminder');
  const today = new Date().toDateString();
  if (lastVitaminReminder !== today) {
    const now = new Date();
    const tenAm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
    const delay = now < tenAm
      ? tenAm.getTime() - now.getTime()  // Before 10am: schedule for 10am
      : 5 * 60 * 1000;                    // After 10am: remind after 5 min

    reminderTimerIds.push(
      setTimeout(() => {
        showNotification('💊 Vitamin time!', "Don't forget your daily vitamins. Your body is recovering and needs the support.");
        localStorage.setItem('sahej_last_vitamin_reminder', today);
      }, delay)
    );
  }
}

export function clearAllReminders() {
  reminderTimerIds.forEach(id => {
    clearInterval(id);
    clearTimeout(id);
  });
  reminderTimerIds = [];
}

function isQuietHours(): boolean {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 6;
}

function showNotification(title: string, body: string) {
  if (!isNotificationEnabled() || isQuietHours()) return;
  try {
    new Notification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: title,
    } as NotificationOptions);
  } catch (e) {
    // Fallback for environments where Notification constructor fails
    console.log('Notification:', title, body);
  }
}
