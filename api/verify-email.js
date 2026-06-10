// Vercel Serverless Function: Verify email via MX record lookup

import dns from 'dns';
import { applyCors, rateLimit, isValidEmail } from './_lib/guard.js';

const dnsPromises = dns.promises;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (rateLimit(req, res, { name: 'verify', max: 10, windowMs: 60_000 })) return;

  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ valid: false, reason: 'Missing email' });
    }

    if (!isValidEmail(email)) {
      return res.status(200).json({ valid: false, reason: 'Invalid email format' });
    }

    // Extract domain
    const domain = email.split('@')[1];
    if (domain.length > 253 || domain.includes('..')) {
      return res.status(200).json({ valid: false, reason: 'Invalid email format' });
    }

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
    console.error('verify-email failed:', err);
    return res.status(500).json({ valid: false, reason: 'Verification failed' });
  }
}
