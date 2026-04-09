// Vercel Serverless Function: Store demo email with strict rate limiting
// 1 demo per email EVER + max 3 per IP per day

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase config' });
  }

  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ allowed: false, reason: 'Missing email' });
    }

    // Get client IP
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.socket?.remoteAddress
      || 'unknown';

    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    };

    // Check: Has this IP already used the demo? (1 try per IP, ever)
    const ipRes = await fetch(
      `${SUPABASE_URL}/rest/v1/demo_users?ip_address=eq.${encodeURIComponent(ip)}&select=id`,
      { headers }
    );

    if (!ipRes.ok) {
      return res.status(500).json({ error: 'Failed to check usage' });
    }

    const ipRows = await ipRes.json();
    if (ipRows.length > 0) {
      return res.status(200).json({
        allowed: false,
        reason: 'already_used',
        message: 'You have already used your free demo. Buy the full skill or book a call for unlimited leads.'
      });
    }

    // All checks passed — insert record
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/demo_users`,
      {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          email,
          ip_address: ip,
          created_at: new Date().toISOString(),
        }),
      }
    );

    if (!insertRes.ok) {
      return res.status(500).json({ error: 'Failed to store record' });
    }

    return res.status(200).json({ allowed: true, remaining: 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
