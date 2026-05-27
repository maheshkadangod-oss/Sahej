import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'node:crypto';
import { getRedis, cors, rateLimit } from './_shared.js';

// Only the major browser push services are accepted as subscription endpoints. Prevents
// the subscribe endpoint from being abused as an open POST relay to arbitrary hosts.
const PUSH_HOST_ALLOWLIST = [
  'fcm.googleapis.com',          // Chrome / Android
  'updates.push.services.mozilla.com', // Firefox
  'web.push.apple.com',          // Safari (modern)
  'api.push.apple.com',          // Safari (some routes)
];
function isAllowedPushEndpoint(endpoint: string): boolean {
  try {
    const { protocol, hostname } = new URL(endpoint);
    if (protocol !== 'https:') return false;
    return PUSH_HOST_ALLOWLIST.some(h => hostname === h || hostname.endsWith('.notify.windows.com'));
  } catch { return false; }
}

// --- Dependency-free Web Push sender (inlined to avoid cross-file ESM resolution issues on
//     Vercel). Implements RFC 8291 aes128gcm encryption + RFC 8292 VAPID using only node:crypto
//     and global fetch — no third-party deps for the bundler to mangle. ---

interface PushSub { endpoint: string; keys: { p256dh: string; auth: string } }
interface VapidConfig { subject: string; publicKey: string; privateKey: string }

const b64url = (b: Buffer) => b.toString('base64url');
const fromB64url = (s: string) => Buffer.from(s, 'base64url');

function hkdf(salt: Buffer, ikm: Buffer, info: Buffer, length: number): Buffer {
  const prk = crypto.createHmac('sha256', salt).update(ikm).digest();
  let t = Buffer.alloc(0);
  let okm = Buffer.alloc(0);
  let counter = 1;
  while (okm.length < length) {
    t = crypto.createHmac('sha256', prk).update(Buffer.concat([t, info, Buffer.from([counter])])).digest();
    okm = Buffer.concat([okm, t]);
    counter++;
  }
  return okm.subarray(0, length);
}

function vapidAuth(endpoint: string, vapid: VapidConfig): string {
  const { host, protocol } = new URL(endpoint);
  const header = b64url(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = b64url(Buffer.from(JSON.stringify({
    aud: `${protocol}//${host}`,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: vapid.subject,
  })));
  const signingInput = `${header}.${payload}`;
  const pub = fromB64url(vapid.publicKey);
  const jwk = { kty: 'EC', crv: 'P-256', d: vapid.privateKey, x: b64url(pub.subarray(1, 33)), y: b64url(pub.subarray(33, 65)) };
  const key = crypto.createPrivateKey({ key: jwk as crypto.JsonWebKeyInput['key'], format: 'jwk' });
  const sig = crypto.sign('sha256', Buffer.from(signingInput), { key, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${signingInput}.${b64url(sig)}, k=${vapid.publicKey}`;
}

function encryptPayload(payload: Buffer, sub: PushSub): Buffer {
  const uaPublic = fromB64url(sub.keys.p256dh);
  const authSecret = fromB64url(sub.keys.auth);
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const ecdhSecret = ecdh.computeSecret(uaPublic);
  const ikm = hkdf(authSecret, ecdhSecret, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]), 32);
  const salt = crypto.randomBytes(16);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(Buffer.concat([payload, Buffer.from([0x02])])), cipher.final(), cipher.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096, 0);
  return Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic, ciphertext]);
}

async function sendWebPush(sub: PushSub, payload: string, vapid: VapidConfig, ttl = 4 * 7 * 24 * 3600): Promise<number> {
  const body = encryptPayload(Buffer.from(payload, 'utf8'), sub);
  const resp = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttl),
      Authorization: vapidAuth(sub.endpoint, vapid),
    },
    body,
  });
  return resp.status;
}

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
    if (!(await rateLimit(redis, ip, 'push', 20))) return res.status(429).json({ error: 'Too many requests' });

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
      // Allow only well-known push services as the subscription endpoint, so this endpoint
      // can't be abused as an open relay to arbitrary URLs.
      if (!isAllowedPushEndpoint(subscription.endpoint)) {
        return res.status(400).json({ error: 'unsupported push service' });
      }
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
    // Protect the cron endpoint. REQUIRED — without CRON_SECRET set this endpoint refuses
    // to run, rather than being publicly callable. Vercel Cron sends the same header.
    const secret = process.env.CRON_SECRET;
    if (!secret) return res.status(503).json({ error: 'Cron not configured' });
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorized' });
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
