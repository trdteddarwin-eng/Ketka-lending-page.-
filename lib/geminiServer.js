// Server-only Gemini helpers. THE RAW GEMINI API KEY IS USED ONLY HERE,
// on the server (Vercel functions + the Vite dev middleware). It must never be
// imported into client/browser code and must never be inlined by Vite.
//
// - mintLiveToken: creates a short-lived, single-use EPHEMERAL token for the
//   browser to open a Live (voice) session with. The browser gets only this
//   disposable token, never the real key.
// - generateChatReply: runs the text chat (Sophie) server-side and returns just
//   the reply text. The browser never sees the key.

import { GoogleGenAI } from '@google/genai';

const CHAT_MODEL = 'gemini-2.5-flash';

const FAQ_KNOWLEDGE_BASE = `
You are Sophie, the AI receptionist for Tedca Corp.
You are helpful, professional, and concise.
Use the following knowledge base to answer user questions. If the answer is not in the knowledge base, politely ask for their contact info so a human can follow up, or suggest they try the demo.

### Knowledge Base:

Q: What is the AI receptionist?
A: Sophie is a voice-powered AI receptionist that answers your business calls 24/7, handles appointment scheduling, answers common questions, and captures caller information—so you never miss a lead.

Q: What types of businesses is this for?
A: We specialize in serving local service businesses in North Jersey, including law firms, dental practices, and HVAC companies.

Q: How much does it cost?
A: We offer two tiers: a Basic AI Receptionist at $500/month, and a Premium tier with proactive appointment reminders and advanced features at $1,000/month plus a one-time setup fee.

Q: Can the AI schedule appointments?
A: Yes. Sophie integrates with Google Calendar to book, reschedule, and confirm appointments in real time during the call.

Q: Do you provide a CRM?
A: Yes. Every plan includes access to our built-in CRM where you can view all your leads, call history, and caller details in one place.

Q: Can Sophie integrate with my existing CRM?
A: Absolutely. We can connect Sophie to most popular CRMs including Salesforce, HubSpot, Zoho, Clio (for law firms), and others.

Q: What happens after each call?
A: You receive detailed call summaries and lead information. Our premium tier includes post-call analytics and business intelligence reporting.

Q: Does it really sound like a human?
A: Sophie is built on advanced voice AI technology and trained specifically for your industry. Callers often can't tell they're speaking with an AI.

Q: How quickly can I get started?
A: Most businesses are live within a few days. We handle all the setup, including customizing Sophie's knowledge base and integrating with your calendar, CRM, and workflows.

Q: What if the AI can't answer a question?
A: Sophie is trained to gracefully handle edge cases—she'll capture the caller's details and ensure you can follow up personally.
`;

/**
 * Mint a short-lived, single-use ephemeral auth token for a browser Live
 * (voice) session. The browser uses token.name as its apiKey (with
 * httpOptions.apiVersion 'v1alpha') — it never receives the real key.
 *
 * Ephemeral tokens are Gemini Developer API + v1alpha only (per @google/genai).
 */
export async function mintLiveToken(apiKey) {
  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
  const now = Date.now();
  const token = await ai.authTokens.create({
    config: {
      // One connection per token. (Resuming a session doesn't count as a use.)
      uses: 1,
      // The new session must START within ~2 minutes of minting.
      newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
      // Token (and any session opened with it) is rejected after ~15 minutes —
      // comfortably covers our 5-minute demo cap, then dies.
      expireTime: new Date(now + 15 * 60 * 1000).toISOString(),
    },
  });
  return token.name;
}

/**
 * Run the text chat server-side and return just the reply string.
 * `history` is [{ role: 'user'|'model', text }]. Never throws to the caller.
 */
export async function generateChatReply(apiKey, history, message) {
  const ai = new GoogleGenAI({ apiKey });

  let prompt =
    `You are Sophie, a helpful AI receptionist for Tedca Corp. Be professional, concise, and friendly.\n\n` +
    `Use this knowledge to answer:\n${FAQ_KNOWLEDGE_BASE}\n\nConversation so far:\n`;

  (Array.isArray(history) ? history : []).forEach((msg) => {
    const who = msg && msg.role === 'user' ? 'Customer' : 'Sophie';
    const text = msg && typeof msg.text === 'string' ? msg.text : '';
    prompt += `${who}: ${text}\n`;
  });
  prompt += `Customer: ${String(message || '')}\nSophie:`;

  const response = await ai.models.generateContent({ model: CHAT_MODEL, contents: prompt });
  return response.text || "I'm sorry, I couldn't generate a response.";
}
