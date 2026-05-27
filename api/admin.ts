import type { VercelRequest, VercelResponse } from '@vercel/node';
import { timingSafeEqual } from 'node:crypto';
import { getRedis, cors, rateLimit, verifyAdmin, ADMIN_EMAILS } from './_shared.js';

/** Constant-time string comparison — prevents timing attacks on the admin password. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ab.length !== bb.length) return false;
  try { return timingSafeEqual(ab, bb); } catch { return false; }
}

// In-memory fallback when Redis is not configured
const memoryTokens = new Map<string, string>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = getRedis();

  // POST = login (get token)
  if (req.method === 'POST') {
    const ip = (req.headers['x-real-ip'] as string) || 'unknown';
    if (!(await rateLimit(redis, ip, 'admin-login', 5))) return res.status(429).json({ error: 'Too many attempts' });

    // Admin password must be configured server-side. If missing, refuse to issue tokens
    // — locking admin out is safer than the previous email-only flow.
    const adminPw = process.env.ADMIN_PASSWORD;
    if (!adminPw) return res.status(503).json({ error: 'Admin login is not configured.' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const email = String(body?.email || '').toLowerCase().trim();
    const password = String(body?.password || '');
    const emailOk = email && ADMIN_EMAILS.includes(email);
    const pwOk = safeEqual(password, adminPw);
    // Single error for either failure so an attacker can't learn which is wrong.
    if (!emailOk || !pwOk) return res.status(403).json({ error: 'Not authorized' });

    const token = crypto.randomUUID();
    if (redis) {
      await redis.set(`admin_session_${token}`, email, { ex: 7 * 24 * 3600 });
    } else {
      // Fallback: store in memory (lost on cold start, but works for testing)
      memoryTokens.set(token, email);
    }

    return res.status(200).json({ token });
  }

  // GET = dashboard data (requires token)
  if (req.method === 'GET') {
    // Verify admin token
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.slice(7);

    let adminEmail: string | null = null;
    if (redis) {
      adminEmail = await redis.get<string>(`admin_session_${token}`);
    } else {
      adminEmail = memoryTokens.get(token) || null;
    }

    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // One-time maintenance: remove test/seed entries (@example.com) created during setup,
    // fix the lifetime counter, and drop known test push devices. Admin-token gated.
    if (req.query.action === 'cleanup-test' && redis) {
      const users = (await redis.get<any[]>('registered_users')) || [];
      const kept = users.filter(u => !String(u.email || '').toLowerCase().endsWith('@example.com'));
      const removedUsers = users.length - kept.length;
      await redis.set('registered_users', kept);
      if (removedUsers > 0) {
        const count = (await redis.get<number>('registered_users_count')) || users.length;
        await redis.set('registered_users_count', Math.max(0, count - removedUsers));
      }
      const testTokens = ['e2e-dev', 'audit-dev', 'test-device', 'hardening-test'];
      let removedDevices = 0;
      for (const t of testTokens) {
        const existed = await redis.srem('push:tokens', t);
        await redis.del(`push:data:${t}`);
        removedDevices += existed ? 1 : 0;
      }
      // Also purge test visitor ids from the analytics sets + fix the session counter.
      const today = new Date().toISOString().slice(0, 10);
      const testDevices = ['verify-device-1', 'verify-device-2', 'e2e-dev', 'audit-dev', 'test-device'];
      let removedVisitors = 0;
      for (const d of testDevices) {
        const existed = await redis.srem('visitors:all', d);
        await redis.srem(`visitors:day:${today}`, d);
        removedVisitors += existed ? 1 : 0;
      }
      if (removedVisitors > 0) {
        const vt = (await redis.get<number>('visits:total')) || 0;
        await redis.set('visits:total', Math.max(0, vt - removedVisitors));
      }
      return res.status(200).json({ ok: true, removedUsers, removedDevices, removedVisitors, remainingUsers: kept.length });
    }

    // Fetch data
    const users = redis ? (await redis.get<any[]>('registered_users') || []) : [];
    const feedback = redis ? (await redis.get<any[]>('feedback_items') || []) : [];
    const lifetimeRegistrations = redis ? (await redis.get<number>('registered_users_count') || users.length) : 0;
    const pushDevices = redis ? (await redis.scard('push:tokens').catch(() => 0)) : 0;

    // ---- Analytics: totals + a 14-day series of unique visitors & sign-ups ----
    const DAYS = 14;
    const days: string[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    // Sign-ups per day, derived from the stored registration timestamps (no extra storage).
    const signupsByDay: Record<string, number> = {};
    for (const u of users) {
      if (!u?.timestamp) continue;
      const day = new Date(u.timestamp).toISOString().slice(0, 10);
      signupsByDay[day] = (signupsByDay[day] || 0) + 1;
    }

    let totalUniqueVisitors = 0;
    let totalSessions = 0;
    let dailyVisitors: number[] = new Array(DAYS).fill(0);
    if (redis) {
      try {
        totalUniqueVisitors = await redis.scard('visitors:all').catch(() => 0);
        totalSessions = (await redis.get<number>('visits:total')) || 0;
        dailyVisitors = await Promise.all(
          days.map(d => redis.scard(`visitors:day:${d}`).catch(() => 0)),
        );
      } catch { /* analytics best-effort */ }
    }

    const series = days.map((date, i) => ({
      date,
      visitors: dailyVisitors[i] || 0,
      signups: signupsByDay[date] || 0,
    }));

    return res.status(200).json({
      users,
      feedback,
      stats: {
        totalUsers: users.length,
        totalFeedback: feedback.length,
        lifetimeRegistrations,
        pushDevices,
      },
      analytics: {
        totalUniqueVisitors,
        totalSessions,
        series,
      },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
