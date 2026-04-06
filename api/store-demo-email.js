// Vercel Serverless Function: Store demo email in Supabase with rate limiting (max 3)

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

    // Query existing demo count for this email
    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/demo_users?email=eq.${encodeURIComponent(email)}&select=id`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!countRes.ok) {
      const errData = await countRes.text();
      return res.status(500).json({ error: 'Failed to query demo count', detail: errData });
    }

    const rows = await countRes.json();
    const count = rows.length;

    if (count >= 3) {
      return res.status(200).json({ allowed: false, reason: 'limit_reached' });
    }

    // Insert new demo record
    const insertRes = await fetch(
      `${SUPABASE_URL}/rest/v1/demo_users`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          email,
          created_at: new Date().toISOString(),
        }),
      }
    );

    if (!insertRes.ok) {
      const errData = await insertRes.text();
      return res.status(500).json({ error: 'Failed to store email', detail: errData });
    }

    return res.status(200).json({ allowed: true, remaining: 3 - count - 1 });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
