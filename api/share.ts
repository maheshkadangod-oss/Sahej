import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis, cors, rateLimit } from './_shared.js';

// In-memory fallback when Redis is not configured
const memoryStore = new Map<string, { data: any; expiresAt: number }>();

const TTL_SECONDS = 30 * 24 * 3600; // 30 days

function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (now > entry.expiresAt) memoryStore.delete(key);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = getRedis();
  const ip = (req.headers['x-real-ip'] as string) || 'unknown';

  // GET /api/share?token=xxx — retrieve shared summary
  if (req.method === 'GET') {
    if (!(await rateLimit(redis, ip, 'share-read', 30))) return res.status(429).json({ error: 'Too many requests' });

    const token = req.query.token;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token required' });
    }

    let data: any = null;
    if (redis) {
      data = await redis.get(`share_${token}`);
    } else {
      cleanupMemoryStore();
      const entry = memoryStore.get(token);
      if (entry && entry.expiresAt > Date.now()) data = entry.data;
    }

    if (!data) return res.status(404).json({ error: 'Share link expired or not found' });
    return res.status(200).json(data);
  }

  // POST /api/share — create a new share link
  if (req.method === 'POST') {
    if (!(await rateLimit(redis, ip, 'share-create', 5))) return res.status(429).json({ error: 'Too many requests' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { displayName, moodSummary } = body;

    if (!displayName || typeof displayName !== 'string') {
      return res.status(400).json({ error: 'displayName required' });
    }
    if (!moodSummary || typeof moodSummary !== 'object') {
      return res.status(400).json({ error: 'moodSummary required' });
    }

    const token = crypto.randomUUID();
    const sanitized = {
      displayName: String(displayName).trim().slice(0, 50),
      moodSummary: {
        avgMood: Number(moodSummary.avgMood) || null,
        streak: Number(moodSummary.streak) || 0,
        trend: typeof moodSummary.trend === 'string' ? moodSummary.trend.slice(0, 20) : 'stable',
        weekMoods: Array.isArray(moodSummary.weekMoods)
          ? moodSummary.weekMoods.slice(0, 7).map((m: any) => ({
              date: String(m.date || '').slice(0, 20),
              level: Number(m.level) || 0,
            }))
          : [],
      },
      createdAt: Date.now(),
    };

    if (redis) {
      await redis.set(`share_${token}`, sanitized, { ex: TTL_SECONDS });
    } else {
      memoryStore.set(token, { data: sanitized, expiresAt: Date.now() + TTL_SECONDS * 1000 });
    }

    return res.status(200).json({ token });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
