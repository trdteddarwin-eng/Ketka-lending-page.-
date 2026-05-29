// Vercel Serverless Function: mint a short-lived, single-use ephemeral token so
// the browser can open a Gemini Live (voice) session WITHOUT ever receiving the
// real API key. The raw GEMINI_API_KEY lives only in server env vars.

import { mintLiveToken } from '../lib/geminiServer.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
