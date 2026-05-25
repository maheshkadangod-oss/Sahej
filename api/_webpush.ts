import crypto from 'node:crypto';

// Dependency-free Web Push sender (RFC 8291 message encryption + RFC 8292 VAPID).
// Replaces the `web-push` npm package, which fails to load in Vercel's serverless bundle.
// Uses only node:crypto and the global fetch — no third-party deps, so nothing for the
// bundler to mangle.

export interface PushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface VapidConfig {
  subject: string;   // mailto: or https:
  publicKey: string; // base64url, 65-byte uncompressed EC point
  privateKey: string;// base64url, 32-byte EC scalar
}

const b64url = (b: Buffer) => b.toString('base64url');
const fromB64url = (s: string) => Buffer.from(s, 'base64url');

// HKDF (extract + expand), SHA-256.
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

// Build the VAPID Authorization header (ES256-signed JWT) for a given push endpoint.
function vapidAuth(endpoint: string, vapid: VapidConfig): string {
  const { host, protocol } = new URL(endpoint);
  const aud = `${protocol}//${host}`;
  const header = b64url(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = b64url(Buffer.from(JSON.stringify({
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: vapid.subject,
  })));
  const signingInput = `${header}.${payload}`;

  const pub = fromB64url(vapid.publicKey); // 0x04 || x(32) || y(32)
  const jwk = {
    kty: 'EC', crv: 'P-256',
    d: vapid.privateKey,
    x: b64url(pub.subarray(1, 33)),
    y: b64url(pub.subarray(33, 65)),
  };
  const privateKeyObj = crypto.createPrivateKey({ key: jwk as crypto.JsonWebKeyInput['key'], format: 'jwk' });
  // ieee-p1363 → raw r||s (JOSE), not DER.
  const sig = crypto.sign('sha256', Buffer.from(signingInput), { key: privateKeyObj, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${signingInput}.${b64url(sig)}, k=${vapid.publicKey}`;
}

// Encrypt a payload for a subscription using aes128gcm (RFC 8291).
function encryptPayload(payload: Buffer, sub: PushSubscription): Buffer {
  const uaPublic = fromB64url(sub.keys.p256dh); // 65 bytes
  const authSecret = fromB64url(sub.keys.auth); // 16 bytes

  const serverEcdh = crypto.createECDH('prime256v1');
  serverEcdh.generateKeys();
  const asPublic = serverEcdh.getPublicKey();           // 65 bytes
  const ecdhSecret = serverEcdh.computeSecret(uaPublic); // 32 bytes

  // IKM = HKDF(salt=auth, ikm=ecdh, info="WebPush: info\0"||ua||as)
  const keyInfo = Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic]);
  const ikm = hkdf(authSecret, ecdhSecret, keyInfo, 32);

  const salt = crypto.randomBytes(16);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);

  // Single record: plaintext || 0x02 delimiter.
  const plaintext = Buffer.concat([payload, Buffer.from([0x02])]);
  const cipher = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);

  // aes128gcm content-coding header: salt(16) || rs(4) || idlen(1) || keyid(as_public) || ciphertext
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096, 0);
  return Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic, ciphertext]);
}

/** Send a push message. Returns the push service's HTTP status (404/410 ⇒ subscription dead). */
export async function sendWebPush(
  sub: PushSubscription,
  payload: string,
  vapid: VapidConfig,
  ttlSeconds = 4 * 7 * 24 * 3600,
): Promise<number> {
  const body = encryptPayload(Buffer.from(payload, 'utf8'), sub);
  const resp = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: String(ttlSeconds),
      Authorization: vapidAuth(sub.endpoint, vapid),
    },
    body,
  });
  return resp.status;
}
