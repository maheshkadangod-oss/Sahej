import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

export const ADMIN_EMAILS = ['saranyacs1994@gmail.com', 'maheshkadangod@gmail.com'];

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

// Redis singleton — returns null if not configured (graceful degradation)
let redis: Redis | null = null;
export function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// CORS helper
export function cors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.length > 0 && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (ALLOWED_ORIGINS.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Rate limiting: in-memory per-IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(ip: string, maxPerMinute: number): boolean {
  const now = Date.now();
  if (rateLimitMap.size > 500) {
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= maxPerMinute) return false;
  entry.count++;
  return true;
}

// Admin token verification
export async function verifyAdmin(req: VercelRequest, redis: Redis): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const email = await redis.get<string>(`admin_session_${token}`);
  return email && ADMIN_EMAILS.includes(email) ? email : null;
}
