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

    // Check 1: Has this email already been used? (1 demo per email, ever)
    const emailRes = await fetch(
      `${SUPABASE_URL}/rest/v1/demo_users?email=eq.${encodeURIComponent(email)}&select=id`,
      { headers }
    );

    if (!emailRes.ok) {
      return res.status(500).json({ error: 'Failed to check email' });
    }

    const emailRows = await emailRes.json();
    if (emailRows.length > 0) {
      return res.status(200).json({
        allowed: false,
        reason: 'email_used',
        message: 'This email has already been used. Buy the full skill or book a call to get unlimited leads.'
      });
    }

    // Check 2: Has this IP used more than 3 demos today?
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const ipRes = await fetch(
      `${SUPABASE_URL}/rest/v1/demo_users?ip_address=eq.${encodeURIComponent(ip)}&created_at=gte.${encodeURIComponent(todayISO)}&select=id`,
      { headers }
    );

    if (ipRes.ok) {
      const ipRows = await ipRes.json();
      if (ipRows.length >= 3) {
        return res.status(200).json({
          allowed: false,
          reason: 'ip_limit',
          message: 'Daily limit reached. Come back tomorrow or buy the full skill for unlimited searches.'
        });
      }
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
