import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis, cors, rateLimit } from './_shared.js';

// Privacy-light visit tracking. The client sends a random, rotating-free device id (a UUID in
// localStorage — no PII, no fingerprinting) once per day. We count unique devices per day and
// all-time, plus total sessions. Used only for the admin analytics view.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-real-ip'] as string) || 'unknown';
  if (!rateLimit(ip, 30)) return res.status(429).json({ error: 'Too many requests' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const deviceId = String(body.deviceId || '').slice(0, 64);
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });

    const redis = getRedis();
    if (!redis) return res.status(200).json({ ok: true }); // no DB → silently succeed

    const today = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
    await Promise.all([
      redis.sadd('visitors:all', deviceId),
      redis.sadd(`visitors:day:${today}`, deviceId),
      redis.expire(`visitors:day:${today}`, 60 * 60 * 24 * 45), // keep ~45 days
      redis.incr('visits:total'),
    ]);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Track error:', error);
    return res.status(200).json({ ok: true }); // never let tracking break the app
  }
}
