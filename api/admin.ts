import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis, cors, rateLimit, verifyAdmin, ADMIN_EMAILS } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = getRedis();

  // POST = login (get token)
  if (req.method === 'POST') {
    const ip = (req.headers['x-real-ip'] as string) || 'unknown';
    if (!rateLimit(ip, 5)) return res.status(429).json({ error: 'Too many attempts' });

    const { email } = req.body;
    if (!email || !ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (!redis) return res.status(503).json({ error: 'Database not configured' });

    const token = crypto.randomUUID();
    await redis.set(`admin_session_${token}`, email.toLowerCase().trim(), { ex: 7 * 24 * 3600 }); // 7 day TTL

    return res.status(200).json({ token });
  }

  // GET = dashboard data (requires token)
  if (req.method === 'GET') {
    if (!redis) return res.status(200).json({ users: [], feedback: [] });
    const admin = await verifyAdmin(req, redis);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });

    const users = await redis.get<any[]>('registered_users') || [];
    const feedback = await redis.get<any[]>('feedback_items') || [];

    return res.status(200).json({
      users,
      feedback,
      stats: { totalUsers: users.length, totalFeedback: feedback.length },
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
