// Vercel Serverless Function: mint a short-lived, single-use ephemeral token so
// the browser can open a Gemini Live (voice) session WITHOUT ever receiving the
// real API key. The raw GEMINI_API_KEY lives only in server env vars.

import { mintLiveToken } from '../lib/geminiServer.js';
import { applyCors, rateLimit } from './_lib/guard.js';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // Each token = one voice session. 6/min per IP is generous for a human,
  // useless for someone farming tokens to ride our Gemini quota.
  if (rateLimit(req, res, { name: 'token', max: 6, windowMs: 60_000 })) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY (server env)' });

  try {
    const token = await mintLiveToken(apiKey);
    return res.status(200).json({ token });
  } catch (err) {
    console.error('mintLiveToken failed:', err);
    return res.status(500).json({ error: 'Failed to create session token' });
  }
}
