import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis, cors, rateLimit } from './_shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-real-ip'] as string) || 'unknown';
  if (!rateLimit(ip, 5)) return res.status(429).json({ error: 'Too many requests' });

  try {
    const { name, email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const redis = getRedis();
    if (!redis) return res.status(200).json({ success: true }); // No DB configured, silently succeed

    // Check if already registered
    const existing = await redis.get<string[]>('registered_users') || [];
    if (existing.some((u: any) => u.email === email.toLowerCase().trim())) {
      return res.status(200).json({ success: true, message: 'Already registered' });
    }

    const user = {
      name: (name || '').trim().slice(0, 50),
      email: email.toLowerCase().trim().slice(0, 100),
      timestamp: Date.now(),
    };

    existing.push(user as any);
    await redis.set('registered_users', existing);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Could not register. Try again later.' });
  }
}
