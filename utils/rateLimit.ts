const STORAGE_KEY = 'ketka_demo_last_start';
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

export function canStartDemo(): boolean {
  const last = localStorage.getItem(STORAGE_KEY);
  if (!last) return true;
  const elapsed = Date.now() - parseInt(last, 10);
  return elapsed >= COOLDOWN_MS;
}

export function recordDemoStart(): void {
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
}

export function getRemainingCooldown(): number {
  const last = localStorage.getItem(STORAGE_KEY);
  if (!last) return 0;
  const elapsed = Date.now() - parseInt(last, 10);
  const remaining = COOLDOWN_MS - elapsed;
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

// --- Per-email re-use lock (client-side layer) ---------------------------------
// Instant, free layer that stops the same browser from re-running the demo with
// an email it already used. The server-side gate (api/voice-demo-gate) is the
// real enforcement that survives incognito/storage-clears.
const USED_EMAILS_KEY = 'ketka_demo_used_emails';

function readUsedEmails(): string[] {
  try {
    const raw = localStorage.getItem(USED_EMAILS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch (e) {
    return [];
  }
}

export function hasUsedDemoEmail(email: string): boolean {
  const key = email.trim().toLowerCase();
  if (!key) return false;
  return readUsedEmails().includes(key);
}

export function recordDemoEmail(email: string): void {
  const key = email.trim().toLowerCase();
  if (!key) return;
  const list = readUsedEmails();
  if (!list.includes(key)) {
    list.push(key);
    try {
      localStorage.setItem(USED_EMAILS_KEY, JSON.stringify(list));
    } catch (e) {
      // ignore storage errors (private mode, quota) — server gate still applies
    }
  }
}
