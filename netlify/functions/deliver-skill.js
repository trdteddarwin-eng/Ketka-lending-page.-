// Netlify Function: Verify payment by email → Fetch skill from GitHub → Return content
// Endpoint: /.netlify/functions/deliver-skill?email=xxx OR ?session_id=xxx

const https = require('https');

function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: options.headers || {} }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
  });
}

const SKILL_MAP = {
  'prod_UECNtAf8UV40e8': {
    name: 'Motion Graphic Video',
    githubPath: 'motion-graphic/motion-graphic.md',
    installFilename: 'motion-graphic.md',
  },
  'prod_UECNOQAaZlnmMS': {
    name: 'Lead Generation Pipeline',
    githubPath: 'lead-gen/lead-gen.md',
    installFilename: 'lead-gen.md',
  },
};

// --- Request guards (mirrors api/_lib/guard.js for the Netlify runtime) ---

const ALLOWED_ORIGINS = new Set([
  'https://tedca.org',
  'https://www.tedca.org',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SESSION_ID_RE = /^cs_[A-Za-z0-9_]{8,200}$/;

function clientIp(event) {
  const h = event.headers || {};
  return h['x-nf-client-connection-ip']
    || (h['x-forwarded-for'] || '').split(',')[0].trim()
    || 'unknown';
}

// Browser-origin allowlist: own site + same-host deploy previews only.
// Returns false when a foreign website's JS is calling us.
function originAllowed(event) {
  const h = event.headers || {};
  const origin = h.origin;
  if (!origin) return true; // same-origin navigation or non-browser client
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    return new URL(origin).host === h.host;
  } catch {
    return false;
  }
}

// Fixed-window per-IP limiter. In-memory: counters reset on cold start, so
// treat as a per-instance floor that makes email enumeration impractical.
const buckets = new Map();
const LIMIT_MAX = 5;
const LIMIT_WINDOW_MS = 600_000; // 10 minutes

function overLimit(event) {
  const now = Date.now();
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) {
      if (now > v.resetAt) buckets.delete(k);
    }
  }
  const key = clientIp(event);
  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + LIMIT_WINDOW_MS };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count > LIMIT_MAX;
}

async function findPaidSession(stripeKey, email) {
  // Search Stripe checkout sessions by customer email
  const url = `https://api.stripe.com/v1/checkout/sessions?customer_details[email]=${encodeURIComponent(email)}&status=complete&limit=10`;
  const res = await httpsRequest(url, {
    headers: { 'Authorization': `Bearer ${stripeKey}` }
  });

  if (res.status !== 200) return null;

  const sessions = JSON.parse(res.body);
  const results = [];
  const seenProducts = new Set();
  for (const session of sessions.data || []) {
    if (session.payment_status === 'paid') {
      const itemsRes = await httpsRequest(
        `https://api.stripe.com/v1/checkout/sessions/${session.id}/line_items`,
        { headers: { 'Authorization': `Bearer ${stripeKey}` } }
      );
      if (itemsRes.status === 200) {
        const items = JSON.parse(itemsRes.body);
        for (const item of items.data || []) {
          const productId = item.price?.product;
          if (SKILL_MAP[productId] && !seenProducts.has(productId)) {
            seenProducts.add(productId);
            results.push({ session, skillInfo: SKILL_MAP[productId] });
          }
        }
      }
    }
  }
  return results.length > 0 ? results : null;
}

async function verifyBySessionId(stripeKey, sessionId) {
  const res = await httpsRequest(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    { headers: { 'Authorization': `Bearer ${stripeKey}` } }
  );
  if (res.status !== 200) return null;

  const session = JSON.parse(res.body);
  if (session.payment_status !== 'paid') return null;

  const itemsRes = await httpsRequest(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items`,
    { headers: { 'Authorization': `Bearer ${stripeKey}` } }
  );
  if (itemsRes.status !== 200) return null;

  const results = [];
  const items = JSON.parse(itemsRes.body);
  for (const item of items.data || []) {
    const productId = item.price?.product;
    if (SKILL_MAP[productId]) {
      results.push({ session, skillInfo: SKILL_MAP[productId] });
    }
  }
  return results.length > 0 ? results : null;
}

exports.handler = async (event) => {
  const origin = event.headers?.origin;
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...(origin && originAllowed(event)
      ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin' }
      : {}),
  };

  if (!originAllowed(event)) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Origin not allowed' }) };
  }
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  if (overLimit(event)) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }) };
  }

  const email = event.queryStringParameters?.email;
  const sessionId = event.queryStringParameters?.session_id;

  if (!email && !sessionId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Provide email or session_id' }) };
  }
  if (email && !(typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email))) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email' }) };
  }
  if (sessionId && !SESSION_ID_RE.test(sessionId)) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid session id' }) };
  }

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  if (!STRIPE_KEY || !GITHUB_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  try {
    // Verify payment — by session_id (redirect) or email (recovery)
    let results = null;
    if (sessionId) {
      results = await verifyBySessionId(STRIPE_KEY, sessionId);
    } else if (email) {
      results = await findPaidSession(STRIPE_KEY, email);
    }

    if (!results) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'No paid purchase found. Make sure you used the same email you paid with.' }) };
    }

    // Fetch all skill files from GitHub
    const skills = [];
    for (const { skillInfo } of results) {
      const githubRes = await httpsRequest(
        `https://api.github.com/repos/trdteddarwin-eng/Stripe-Tedca-website-/contents/${skillInfo.githubPath}?ref=main`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'Tedca-Skill-Delivery',
          }
        }
      );
      if (githubRes.status === 200) {
        skills.push({
          skill_name: skillInfo.name,
          install_filename: skillInfo.installFilename,
          skill_content: githubRes.body,
        });
      }
    }

    if (skills.length === 0) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch skill files' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ skills }),
    };

  } catch (err) {
    console.error('deliver-skill failed:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Delivery failed. Please try again.' }) };
  }
};
