// Privacy-light visit tracking — fires once per day per device. The device id is a random
// UUID stored locally (no PII, no fingerprinting); it just lets us count unique visitors.
export function trackVisit(): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem('sahej_visit_day') === today) return; // already counted today
    localStorage.setItem('sahej_visit_day', today);
    let deviceId = localStorage.getItem('sahej_device_id');
    if (!deviceId) {
      deviceId = crypto?.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2);
      localStorage.setItem('sahej_device_id', deviceId);
    }
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    }).catch(() => { /* best-effort */ });
  } catch { /* never let analytics break the app */ }
}

// Registration
export async function registerUser(
  name: string,
  email: string,
  extra?: { babyName?: string; babyBirthDate?: string },
): Promise<boolean> {
  try {
    const resp = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, ...extra }),
    });
    return resp.ok;
  } catch {
    return false; // Silently fail — registration is optional
  }
}

// Erasure request — removes the server-side registration record for this email.
export async function deleteAccount(email: string): Promise<boolean> {
  try {
    const resp = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', email }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

// Feedback
export async function submitFeedback(message: string, email?: string): Promise<boolean> {
  try {
    const resp = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, email }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

// Admin login
export async function adminLogin(email: string, password: string): Promise<string | null> {
  try {
    const resp = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.token || null;
  } catch {
    return null;
  }
}

// Admin dashboard data
export async function fetchDashboard(token: string): Promise<{
  users: { name: string; email: string; babyName?: string; babyBirthDate?: string; timestamp: number }[];
  feedback: { id: string; message: string; email: string | null; timestamp: number }[];
  stats: { totalUsers: number; totalFeedback: number; lifetimeRegistrations?: number; pushDevices?: number };
  analytics?: {
    totalUniqueVisitors: number;
    totalSessions: number;
    series: { date: string; visitors: number; signups: number }[];
  };
} | null> {
  try {
    const resp = await fetch('/api/admin', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}

// Share-with-partner types + calls
export interface SharedMoodSummary {
  displayName: string;
  moodSummary: {
    avgMood: number | null;
    streak: number;
    trend: string;
    weekMoods: { date: string; level: number }[];
  };
  createdAt: number;
}

export async function createShareLink(
  displayName: string,
  moodSummary: SharedMoodSummary['moodSummary'],
): Promise<string | null> {
  try {
    const resp = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, moodSummary }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.token) return null;
    return `${window.location.origin}/share/${data.token}`;
  } catch {
    return null;
  }
}

export async function fetchSharedSummary(token: string): Promise<SharedMoodSummary | null> {
  try {
    const resp = await fetch(`/api/share?token=${encodeURIComponent(token)}`);
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}
