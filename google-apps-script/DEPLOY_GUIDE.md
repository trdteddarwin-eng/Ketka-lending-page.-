# Voice-Demo Lead Capture — Deploy Guide

This sets up a free, Google-hosted endpoint that (1) saves every voice-demo lead
to a Google Sheet and (2) sends you a Telegram message. No server to run.

You will do this **once**. It takes about 10 minutes.

---

## Step 1 — Create the Google Sheet

1. Go to https://sheets.new (or Google Drive → New → Google Sheet).
2. Rename it to **Tedca Voice Demo Leads** (click the title, top-left).
3. Leave it empty — the script adds the header row automatically.

## Step 2 — Open the Apps Script editor

1. In that sheet, click **Extensions → Apps Script**.
2. A code editor opens with a default `function myFunction() {}`.
3. **Select all** the default code and delete it.
4. Open `google-apps-script/lead-capture.gs` from this repo, copy **all** of it,
   and paste it into the editor.
5. Click the **Save** icon (💾). Name the project e.g. "Lead Capture" if asked.

## Step 3 — Add your Telegram secrets (Script Properties)

You need two values: a **bot token** and a **chat id**.

### Get a bot token
1. In Telegram, message **@BotFather**.
2. Send `/newbot`, follow the prompts (name + username).
3. BotFather replies with a token like `123456789:ABCd...`. Copy it.

### Get your chat id (two ways — pick one)
- **Easiest:** message **@userinfobot** in Telegram. It replies with your numeric Id.
- **Or:** message your new bot once (say "hi"), then open in a browser:
  `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
  Find `"chat":{"id":123456789,...}` — that number is your chat id.

### Save them in Apps Script
1. In the Apps Script editor, click the **gear icon → Project Settings**.
2. Scroll to **Script Properties → Add script property**. Add two:
   - Property: `TELEGRAM_TOKEN`   → Value: your bot token
   - Property: `TELEGRAM_CHAT_ID` → Value: your numeric chat id
3. Click **Save script properties**.

> These never live in code — only here. Safe to share the .gs file publicly.

## Step 4 — Deploy as a Web App

1. Top-right, click **Deploy → New deployment**.
2. Click the gear next to "Select type" → choose **Web app**.
3. Set:
   - **Description:** anything (e.g. "v1")
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**
4. Click **Deploy**.
5. Google asks you to **authorize**. Approve it (it's your own script).
   - If you see "Google hasn't verified this app", click **Advanced → Go to (project) → Allow**.
6. Copy the **Web app URL**. It looks like:
   `https://script.google.com/macros/s/AKfyc.../exec`

## Step 5 — Wire the URL into the site

1. Open the site's `.env` file (in the repo root: `Ketka-lending-page.-/.env`).
2. Add a line (paste your URL):
   ```
   VITE_LEAD_WEBHOOK_URL=https://script.google.com/macros/s/AKfyc.../exec
   ```
3. Save. If `npm run dev` is running, **stop it and restart** (`npm run dev`) so
   Vite picks up the new env var. For production, set the same env var in your
   host (e.g. Vercel project settings) and redeploy.

## Step 6 — Test it

### Quick health check
Open the Web app URL in a browser. You should see:
```json
{"ok":true,"msg":"lead-capture alive"}
```

### Send a sample lead (curl)
```
chmod +x google-apps-script/test-webhook.sh
./google-apps-script/test-webhook.sh "https://script.google.com/macros/s/AKfyc.../exec"
```
You should get `{"ok":true}`, a new row in the Sheet, and a Telegram message.

### Real test (the actual form)
1. Run `npm run dev`, open the voice demo, fill in First/Last/Email, click
   **Start Live Demo**.
2. A new row appears in the Sheet and you get a Telegram ping. The demo starts
   regardless — lead capture is best-effort and never blocks the user.

---

## Troubleshooting
- **No Telegram message but Sheet row appears:** token/chat id wrong or missing in
  Script Properties. Re-check Step 3, then **redeploy** (Deploy → Manage
  deployments → edit → Deploy) so changes take effect.
- **Nothing happens from the site:** confirm `VITE_LEAD_WEBHOOK_URL` is set and you
  restarted `npm run dev`. The browser request is "fire and forget" (opaque
  response by design), so check the Sheet/Telegram to confirm, not the Network tab.
- **Updating the code later:** after editing `lead-capture.gs`, you must
  **Deploy → Manage deployments → (edit) → Deploy** again for changes to go live.
