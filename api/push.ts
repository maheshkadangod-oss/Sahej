import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRedis, cors, rateLimit } from './_shared';
import { sendWebPush } from './_webpush';

// Web Push backend (Phase 2).
//   POST { action: 'subscribe', token, subscription, reminders }  → store this device's
//         subscription + future-dated reminders.
//   POST { action: 'unsubscribe', token }                         → forget this device.
//   GET  (Vercel Cron, daily)                                     → send any reminders now due.
//
// Storage (Upstash Redis):
//   push:tokens            → Set of device tokens
//   push:data:<token>      → { subscription, reminders: [{id, fireAt, title, body, sent?}] }
//
// Everything degrades gracefully if VAPID env vars or Redis aren't configured.

interface StoredReminder { id: string; fireAt: number; title: string; body: string; sent?: boolean }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    return await route(req, res);
  } catch (err) {
    console.error('push handler error:', err);
    return res.status(500).json({ error: 'push handler failed' });
  }
}

async function route(req: VercelRequest, res: VercelResponse) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = getRedis();

  // ---- Subscribe / unsubscribe ----
  if (req.method === 'POST') {
    const ip = (req.headers['x-real-ip'] as string) || 'unknown';
    if (!rateLimit(ip, 20)) return res.status(429).json({ error: 'Too many requests' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { action, token } = body;
    if (!token || typeof token !== 'string') return res.status(400).json({ error: 'token required' });
    if (!redis) return res.status(200).json({ ok: true }); // no DB → silently succeed

    if (action === 'unsubscribe') {
      await redis.del(`push:data:${token}`);
      await redis.srem('push:tokens', token);
      return res.status(200).json({ ok: true });
    }

    if (action === 'subscribe') {
      const { subscription, reminders } = body;
      if (!subscription?.endpoint) return res.status(400).json({ error: 'subscription required' });
      const clean: StoredReminder[] = Array.isArray(reminders)
        ? reminders
            .filter((r: any) => r && r.id && typeof r.fireAt === 'number')
            .slice(0, 50)
            .map((r: any) => ({ id: String(r.id), fireAt: r.fireAt, title: String(r.title || 'Sahej').slice(0, 80), body: String(r.body || '').slice(0, 200) }))
        : [];
      await redis.set(`push:data:${token}`, { subscription, reminders: clean }, { ex: 400 * 24 * 3600 });
      await redis.sadd('push:tokens', token);
      return res.status(200).json({ ok: true, count: clean.length });
    }

    return res.status(400).json({ error: 'unknown action' });
  }

  // ---- Cron: send due reminders ----
  if (req.method === 'GET') {
    // Protect the cron endpoint. Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
    const secret = process.env.CRON_SECRET;
    if (secret) {
      const auth = req.headers.authorization;
      if (auth !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!redis) return res.status(200).json({ sent: 0, note: 'no redis' });

    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return res.status(200).json({ sent: 0, note: 'vapid not configured' });
    }
    const vapid = { subject: VAPID_SUBJECT || 'mailto:hello@sahej.app', publicKey: VAPID_PUBLIC_KEY, privateKey: VAPID_PRIVATE_KEY };

    const now = Date.now();
    const tokens = (await redis.smembers('push:tokens')) as string[];
    let sent = 0, pruned = 0;

    for (const token of tokens) {
      const data = await redis.get<{ subscription: any; reminders: StoredReminder[] }>(`push:data:${token}`);
      if (!data?.subscription) { await redis.srem('push:tokens', token); pruned++; continue; }

      const due = (data.reminders || []).filter(r => !r.sent && r.fireAt <= now);
      if (due.length === 0) continue;

      let changed = false;
      let gone = false;
      for (const r of due) {
        try {
          const status = await sendWebPush(data.subscription, JSON.stringify({ title: r.title, body: r.body, url: '/', tag: r.id }), vapid);
          if (status === 404 || status === 410) { gone = true; break; } // subscription dead
          if (status >= 200 && status < 300) { r.sent = true; changed = true; sent++; }
          // other statuses: leave unsent, retry next run
        } catch {
          // network/crypto error: leave unsent, retry next run
        }
      }

      if (gone) {
        await redis.del(`push:data:${token}`);
        await redis.srem('push:tokens', token);
        pruned++;
      } else if (changed) {
        // Keep only unsent + recently-sent (drop reminders sent long ago to bound size).
        const keep = data.reminders.filter(r => !r.sent || r.fireAt > now - 14 * 24 * 3600 * 1000);
        await redis.set(`push:data:${token}`, { subscription: data.subscription, reminders: keep }, { ex: 400 * 24 * 3600 });
      }
    }

    return res.status(200).json({ ok: true, sent, pruned, devices: tokens.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
