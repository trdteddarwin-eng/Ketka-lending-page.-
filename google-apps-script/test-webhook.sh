#!/usr/bin/env bash
#
# test-webhook.sh — send a sample lead to the deployed Apps Script Web App.
#
# Usage:
#   chmod +x test-webhook.sh      # one time, to make it executable
#   ./test-webhook.sh "https://script.google.com/macros/s/XXXX/exec"
#
# NOTE: curl is not a browser, so there is no CORS preflight here — we can safely
# send Content-Type: application/json. (The site itself uses text/plain to dodge
# the browser preflight; Apps Script parses the raw body either way.)
#
# A successful response looks like: {"ok":true}

set -euo pipefail

URL="${1:-}"
if [ -z "$URL" ]; then
  echo "Usage: $0 <web-app-url>" >&2
  echo "Example: $0 \"https://script.google.com/macros/s/XXXX/exec\"" >&2
  exit 1
fi

PAYLOAD='{
  "first_name": "Test",
  "last_name": "Lead",
  "email": "test.lead@example.com",
  "phone": "+1 555 010 1234",
  "source": "voice-demo",
  "user_agent": "test-webhook.sh/curl"
}'

echo "POSTing sample lead to: $URL"
echo "Payload:"
echo "$PAYLOAD"
echo
echo "Response:"
curl -sS -L \
  -X POST \
  -H "Content-Type: application/json" \
  --data "$PAYLOAD" \
  "$URL"
echo
