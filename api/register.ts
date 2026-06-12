import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis, cors, rateLimit } from './_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-real-ip'] as string) || 'unknown';
  const redis = getRedis();
  if (!(await rateLimit(redis, ip, 'register', 5))) return res.status(429).json({ error: 'Too many requests' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { name, email, babyName, babyBirthDate } = body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    // Erasure request (DPDP right): remove the registration record for this email.
    // Keyed by email only — the stored record is just a contact entry (no health data lives
    // server-side), so the worst-case abuse is removing someone from a mailing list. Tightly
    // rate-limited above. Lifetime sign-up counter is intentionally left untouched.
    if (body.action === 'delete') {
      if (!redis) return res.status(200).json({ success: true });
      const normalized = email.toLowerCase().trim().slice(0, 100);
      const all = (await redis.get<any[]>('registered_users')) || [];
      const kept = all.filter((u: any) => u.email !== normalized);
      await redis.set('registered_users', kept);
      return res.status(200).json({ success: true, removed: all.length - kept.length });
    }

    if (!redis) return res.status(200).json({ success: true }); // No DB configured, silently succeed

    const normalizedEmail = email.toLowerCase().trim().slice(0, 100);
    const existing = await redis.get<any[]>('registered_users') || [];

    const fields = {
      name: (name || '').trim().slice(0, 50),
      babyName: (babyName || '').trim().slice(0, 50),
      babyBirthDate: (babyBirthDate || '').trim().slice(0, 10),
    };

    const idx = existing.findIndex((u: any) => u.email === normalizedEmail);
    if (idx >= 0) {
      // Already registered — backfill any new details we didn't have before.
      existing[idx] = { ...existing[idx], ...fields, updatedAt: Date.now() };
      await redis.set('registered_users', existing);
      return res.status(200).json({ success: true, message: 'Updated' });
    }

    existing.push({ email: normalizedEmail, ...fields, timestamp: Date.now() });
    await redis.set('registered_users', existing);
    // A simple lifetime counter, handy for the admin "number of infos" view.
    await redis.incr('registered_users_count');

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Could not register. Try again later.' });
  }
}
