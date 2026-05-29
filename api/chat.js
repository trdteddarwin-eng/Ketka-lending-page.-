// Vercel Serverless Function: text chat proxy. The browser POSTs { history,
// message } and gets back { reply }. The Gemini key stays server-side only.

import { generateChatReply } from '../lib/geminiServer.js';

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
    const { history, message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message' });
    }
    const reply = await generateChatReply(apiKey, history || [], message);
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('generateChatReply failed:', err);
    // Soft-fail so the widget shows a friendly message rather than breaking.
    return res.status(200).json({
      reply: "I'm having trouble connecting right now. Please try again or call us directly.",
    });
  }
}
