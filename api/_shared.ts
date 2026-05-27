import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';

export const ADMIN_EMAILS = ['saranyacs1994@gmail.com', 'maheshkadangod@gmail.com'];

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

// CORS helper. ALLOWED_ORIGINS env var (comma-separated) is the explicit allowlist.
// If unset, in production we fall back to the deployment's own production URL only — never '*'.
// In dev / preview (when no VERCEL_PROJECT_PRODUCTION_URL), we permit any origin so local
// testing isn't blocked.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const PROD_ORIGIN = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : '';

function originAllowed(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.length > 0) return ALLOWED_ORIGINS.includes(origin);
  if (PROD_ORIGIN) return origin === PROD_ORIGIN;
  return true; // dev / preview — no prod URL known, allow.
}

export function cors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  if (originAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Rate limiting. Redis-backed when available (survives across lambda instances), with
// in-memory fallback for the rare case Redis isn't configured. Async — callers must await.
const memoryMap = new Map<string, { count: number; resetAt: number }>();
function memoryLimit(ip: string, scope: string, maxPerMinute: number): boolean {
  const now = Date.now();
  if (memoryMap.size > 500) {
    for (const [k, e] of memoryMap) if (now > e.resetAt) memoryMap.delete(k);
  }
  const key = `${scope}:${ip}`;
  const entry = memoryMap.get(key);
  if (!entry || now > entry.resetAt) {
    memoryMap.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= maxPerMinute) return false;
  entry.count++;
  return true;
}

export async function rateLimit(
  redis: Redis | null,
  ip: string,
  scope: string,
  maxPerMinute: number,
): Promise<boolean> {
  if (redis) {
    try {
      const key = `rl:${scope}:${ip}`;
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, 60);
      return n <= maxPerMinute;
    } catch {
      // Redis hiccup — fall through to in-memory so we still throttle abuse.
    }
  }
  return memoryLimit(ip, scope, maxPerMinute);
}

// Admin token verification
export async function verifyAdmin(req: VercelRequest, redis: Redis): Promise<string | null> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const email = await redis.get<string>(`admin_session_${token}`);
  return email && ADMIN_EMAILS.includes(email) ? email : null;
}
