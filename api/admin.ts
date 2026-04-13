import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis, cors, rateLimit, verifyAdmin, ADMIN_EMAILS } from './_shared';

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

    // Fetch data
    const users = redis ? (await redis.get<any[]>('registered_users') || []) : [];
    const feedback = redis ? (await redis.get<any[]>('feedback_items') || []) : [];

    return res.status(200).json({
      users,
      feedback,
      stats: { totalUsers: users.length, totalFeedback: feedback.length },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
