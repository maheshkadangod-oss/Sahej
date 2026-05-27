import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis, cors, rateLimit } from './_shared.js';

// Anonymous crisis event logger.
// NO user content, NO identifiers — only an aggregate counter per severity.
// Founders can see "how many crisis moments happened last week" without
// ever reading what anyone typed.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-real-ip'] as string) || 'unknown';
  const redis = getRedis();
  // Very permissive — this endpoint is a safety counter; we want to record always
  if (!(await rateLimit(redis, ip, 'crisis', 30))) return res.status(200).json({ ok: true });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const severity = body.severity === 'crisis' ? 'crisis' : body.severity === 'watchful' ? 'watchful' : null;
  if (!severity) return res.status(400).json({ error: 'severity required' });

  if (!redis) return res.status(200).json({ ok: true });

  try {
    const dayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    await redis.incr(`crisis_count:${severity}:${dayKey}`);
    await redis.incr(`crisis_count:${severity}:total`);
    // 90-day retention on per-day keys
    await redis.expire(`crisis_count:${severity}:${dayKey}`, 90 * 24 * 3600);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Crisis log error:', e);
    return res.status(200).json({ ok: true }); // Never fail this endpoint
  }
}
