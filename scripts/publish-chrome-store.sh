#!/bin/bash
# Uploads a zip to the Chrome Web Store (API v2) and submits it for review.
# Usage: publish-chrome-store.sh <zip>
# Env: CHROME_CLIENT_ID, CHROME_CLIENT_SECRET, CHROME_REFRESH_TOKEN,
#      CHROME_PUBLISHER_ID, CHROME_EXTENSION_ID

set -euo pipefail

ZIP="$1"
API="https://chromewebstore.googleapis.com"
ITEM="publishers/${CHROME_PUBLISHER_ID}/items/${CHROME_EXTENSION_ID}"

TOKEN=$(curl -sS --fail-with-body https://oauth2.googleapis.com/token \
  -d "client_id=${CHROME_CLIENT_ID}" \
  -d "client_secret=${CHROME_CLIENT_SECRET}" \
  -d "refresh_token=${CHROME_REFRESH_TOKEN}" \
  -d "grant_type=refresh_token" | jq -r .access_token)
echo "::add-mask::${TOKEN}"
AUTH="Authorization: Bearer ${TOKEN}"

echo "Uploading ${ZIP}"
UPLOAD=$(curl -sS --fail-with-body -X POST -H "$AUTH" -T "$ZIP" "${API}/upload/v2/${ITEM}:upload")
echo "$UPLOAD"
STATE=$(echo "$UPLOAD" | jq -r .uploadState)

for _ in $(seq 1 30); do
  [[ "$STATE" == "IN_PROGRESS" || "$STATE" == "UPLOAD_IN_PROGRESS" ]] || break
  sleep 10
  STATE=$(curl -sS --fail-with-body -H "$AUTH" "${API}/v2/${ITEM}:fetchStatus" | jq -r .lastAsyncUploadState)
  echo "Upload state: ${STATE}"
done

if [[ "$STATE" != "SUCCEEDED" ]]; then
  echo "Upload did not succeed (state: ${STATE})" >&2
  exit 1
fi

echo "Submitting for review"
curl -sS --fail-with-body -X POST -H "$AUTH" "${API}/v2/${ITEM}:publish"
echo
