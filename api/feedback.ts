import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis, cors, rateLimit, verifyAdmin } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = getRedis();

  // GET = admin fetching feedback list
  if (req.method === 'GET') {
    if (!redis) return res.status(200).json({ items: [] });
    const admin = await verifyAdmin(req, redis);
    if (!admin) return res.status(401).json({ error: 'Unauthorized' });

    const items = await redis.get<any[]>('feedback_items') || [];
    return res.status(200).json({ items });
  }

  // POST = user submitting feedback
  if (req.method === 'POST') {
    const ip = (req.headers['x-real-ip'] as string) || 'unknown';
    if (!rateLimit(ip, 3)) return res.status(429).json({ error: 'Too many requests' });

    const { message, email } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length < 3) {
      return res.status(400).json({ error: 'Message required (min 3 characters)' });
    }

    if (!redis) return res.status(200).json({ success: true });

    const item = {
      id: Date.now().toString(),
      message: message.trim().slice(0, 1000),
      email: email ? String(email).toLowerCase().trim().slice(0, 100) : null,
      timestamp: Date.now(),
    };

    const items = await redis.get<any[]>('feedback_items') || [];
    items.unshift(item); // newest first
    await redis.set('feedback_items', items.slice(0, 500)); // keep last 500

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
