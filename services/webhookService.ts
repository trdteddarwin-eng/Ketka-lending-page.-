import { BusinessConfig, TranscriptItem } from '../types';
import { signPayload } from '../utils/hmac';
import { API_BASE_URL, LEAD_WEBHOOK_URL } from '../constants';

// HMAC signing intentionally disabled on the client: a shared secret shipped to
// the browser provides no security (anyone could read it). If request signing is
// ever needed, do it server-side. Hardcoded empty so no secret can be inlined.
const WEBHOOK_SECRET = '';

async function signedFetch(url: string, body: object): Promise<Response> {
  const bodyStr = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = WEBHOOK_SECRET
    ? await signPayload(timestamp + '.' + bodyStr, WEBHOOK_SECRET)
    : '';

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
      'X-Timestamp': timestamp,
    },
    body: bodyStr,
  });
}

export async function submitLead(config: BusinessConfig): Promise<Response> {
  return signedFetch(`${API_BASE_URL}/api/voice-demo/lead`, {
    first_name: config.firstName,
    last_name: config.lastName,
    email: config.email,
    phone: config.phone || '',
    business_name: config.businessName || '',
    industry: config.industry || '',
    services: config.services || '',
    avg_ticket_value: config.avgTicketValue || '',
  });
}

/**
 * Posts a lead DIRECTLY to a Google Apps Script Web App (no Vercel function).
 *
 * CRITICAL: Google Apps Script cannot answer a CORS preflight (OPTIONS) request.
 * To avoid triggering one, we use ONLY a `text/plain` Content-Type and NO custom
 * headers (no X-Signature / X-Timestamp). This keeps the request a CORS "simple
 * request", so the browser sends it without a preflight. Apps Script still receives
 * the raw JSON in e.postData.contents and parses it server-side.
 *
 * The response is effectively opaque to us, so we never read/throw on it — this is
 * best-effort lead capture and must never block the demo from starting.
 */
export async function submitLeadDirect(config: BusinessConfig): Promise<void> {
  if (!LEAD_WEBHOOK_URL) return;

  const body = JSON.stringify({
    first_name: config.firstName,
    last_name: config.lastName,
    email: config.email,
    phone: config.phone || '',
    source: 'voice-demo',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  });

  try {
    await fetch(LEAD_WEBHOOK_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body,
    });
  } catch (error) {
    // Best-effort: swallow network/CORS errors so the demo always proceeds.
    console.error('submitLeadDirect failed (non-blocking):', error);
  }
}

/**
 * Logs the lead to the Google Sheet AND returns whether this email has already
 * used the demo — the Sheet doubles as the re-use database (no Supabase).
 *
 * The Apps Script returns `{ ok, alreadyUsed }`. We read that response (still a
 * CORS "simple request": text/plain, no custom headers — no preflight). If the
 * response can't be read (CORS/network), we return null so the caller falls back
 * to the localStorage layer and never wrongly blocks a real lead.
 */
export async function submitLeadAndCheck(
  config: BusinessConfig
): Promise<{ alreadyUsed: boolean } | null> {
  if (!LEAD_WEBHOOK_URL) return null;

  const body = JSON.stringify({
    first_name: config.firstName,
    last_name: config.lastName,
    email: config.email,
    phone: config.phone || '',
    source: 'voice-demo',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  });

  try {
    const res = await fetch(LEAD_WEBHOOK_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body,
    });
    const data = await res.json();
    return { alreadyUsed: !!(data && data.alreadyUsed) };
  } catch (error) {
    // Couldn't read the response (CORS/network) — let the caller fall back.
    console.error('submitLeadAndCheck unreadable (falling back):', error);
    return null;
  }
}

export async function submitTranscript(
  config: BusinessConfig,
  transcript: TranscriptItem[],
  callDuration: number
): Promise<Response> {
  return signedFetch(`${API_BASE_URL}/api/voice-demo/transcript`, {
    email: config.email,
    call_duration: callDuration,
    transcript: transcript.map(item =>
      `${item.role === 'user' ? 'Customer' : 'AI'}: ${item.text}`
    ).join('\n'),
  });
}

export async function testWebhook(): Promise<Response> {
  return signedFetch(`${API_BASE_URL}/api/voice-demo/test`, {
    type: 'TEST_EVENT',
    timestamp: new Date().toISOString(),
    summary: 'Test event from setup screen.',
  });
}
