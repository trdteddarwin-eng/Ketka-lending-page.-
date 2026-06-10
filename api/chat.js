// Vercel Serverless Function: text chat proxy. The browser POSTs { history,
// message } and gets back { reply }. The Gemini key stays server-side only.

import { generateChatReply } from '../lib/geminiServer.js';
import { applyCors, rateLimit } from './_lib/guard.js';

const MAX_MESSAGE_CHARS = 1000;

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (rateLimit(req, res, { name: 'chat', max: 20, windowMs: 60_000 })) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing GEMINI_API_KEY (server env)' });

  try {
    const { history, message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message' });
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return res.status(400).json({ error: 'Message too long' });
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
