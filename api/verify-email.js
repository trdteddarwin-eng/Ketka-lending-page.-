// Vercel Serverless Function: Verify email via MX record lookup

import dns from 'dns';
const dnsPromises = dns.promises;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ valid: false, reason: 'Missing email' });
    }

    // Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(200).json({ valid: false, reason: 'Invalid email format' });
    }

    // Extract domain
    const domain = email.split('@')[1];

    // DNS MX lookup
    try {
      const mxRecords = await dnsPromises.resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        return res.status(200).json({ valid: true, reason: 'MX records found' });
      }
      return res.status(200).json({ valid: false, reason: 'No MX records for domain' });
    } catch (dnsErr) {
      if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'ENODATA') {
        return res.status(200).json({ valid: false, reason: 'Domain does not exist' });
      }
      return res.status(200).json({ valid: false, reason: 'DNS lookup failed' });
    }
  } catch (err) {
    return res.status(500).json({ valid: false, reason: err.message || 'Unknown error' });
  }
}
