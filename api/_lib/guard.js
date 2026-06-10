// Shared request guards for the serverless endpoints in api/.
// Vercel does not expose files under an underscore-prefixed folder (api/_lib)
// as routes, so this module is server-side only.
//
// Two layers:
//  1. applyCors — browser-origin allowlist. Same-origin pages (tedca.org) and
//     same-deployment previews (*.vercel.app serving this very deployment) work;
//     any other website's JS gets a 403 instead of a free pass to our APIs.
//  2. rateLimit — fixed-window per-IP counters. In-memory, so each warm
//     serverless instance keeps its own counters: treat the numbers as a
//     per-instance floor that stops casual/scripted abuse and bounds cost,
//     not as a hard global guarantee (platform WAF is the tool for that).

const STATIC_ALLOWED_ORIGINS = new Set([
  'https://tedca.org',
  'https://www.tedca.org',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  const first = typeof fwd === 'string' && fwd ? fwd.split(',')[0].trim() : '';
  return first || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

// Returns true if the request was fully handled (preflight answered, or a
// disallowed cross-site origin rejected) and the handler should stop.
export function applyCors(req, res, methods = 'POST, OPTIONS') {
  const origin = req.headers.origin;
  if (origin) {
    let allowed = STATIC_ALLOWED_ORIGINS.has(origin);
    if (!allowed) {
      // Allow the deployment's own host (covers *.vercel.app preview URLs).
      try {
        allowed = new URL(origin).host === req.headers.host;
      } catch {
        allowed = false;
      }
    }
    if (!allowed) {
      res.status(403).json({ error: 'Origin not allowed' });
      return true;
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

const buckets = new Map();

// Returns true if the caller is over the limit (429 already sent).
export function rateLimit(req, res, { name, max, windowMs }) {
  const now = Date.now();
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) {
      if (now > v.resetAt) buckets.delete(k);
    }
  }
  const key = `${name}:${clientIp(req)}`;
  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > max) {
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
    res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    return true;
  }
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email);
}
