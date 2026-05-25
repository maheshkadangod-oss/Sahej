import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis, cors, rateLimit, verifyAdmin, ADMIN_EMAILS } from './_shared.js';

// In-memory fallback when Redis is not configured
const memoryTokens = new Map<string, string>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = getRedis();

  // POST = login (get token)
  if (req.method === 'POST') {
    const ip = (req.headers['x-real-ip'] as string) || 'unknown';
    if (!rateLimit(ip, 5)) return res.status(429).json({ error: 'Too many attempts' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const email = body.email;
    if (!email || !ADMIN_EMAILS.includes(String(email).toLowerCase().trim())) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const token = crypto.randomUUID();
    const normalizedEmail = String(email).toLowerCase().trim();

    if (redis) {
      await redis.set(`admin_session_${token}`, normalizedEmail, { ex: 7 * 24 * 3600 });
    } else {
      // Fallback: store in memory (lost on cold start, but works for testing)
      memoryTokens.set(token, normalizedEmail);
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
      const testTokens = ['e2e-dev', 'audit-dev', 'test-device'];
      let removedDevices = 0;
      for (const t of testTokens) {
        const existed = await redis.srem('push:tokens', t);
        await redis.del(`push:data:${t}`);
        removedDevices += existed ? 1 : 0;
      }
      return res.status(200).json({ ok: true, removedUsers, removedDevices, remainingUsers: kept.length });
    }

    // Fetch data
    const users = redis ? (await redis.get<any[]>('registered_users') || []) : [];
    const feedback = redis ? (await redis.get<any[]>('feedback_items') || []) : [];
    const lifetimeRegistrations = redis ? (await redis.get<number>('registered_users_count') || users.length) : 0;
    const pushDevices = redis ? (await redis.scard('push:tokens').catch(() => 0)) : 0;

    return res.status(200).json({
      users,
      feedback,
      stats: {
        totalUsers: users.length,
        totalFeedback: feedback.length,
        lifetimeRegistrations,
        pushDevices,
      },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
