#!/usr/bin/env bash
# Publish a JS bundle to the self-hosted xprem OTA server (Android TV app).
set -euo pipefail

TV_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "${TV_DIR}/.." && pwd)"
SECRETS_FILE="${ROOT_DIR}/infra/ota/bootstrap-tv.secrets.env"

if [[ -f "${SECRETS_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${SECRETS_FILE}"
  set +a
fi

if [[ -f "${TV_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${TV_DIR}/.env"
  set +a
fi

: "${EOO_TOKEN:?Set EOO_TOKEN or run scripts/bootstrap-xprem-tv.sh first}"

export RELEASE_CHANNEL="${RELEASE_CHANNEL:-${EXPO_OTA_CHANNEL:-production}}"
BRANCH="${EXPO_OTA_BRANCH:-production}"
PLATFORM="${OTA_PLATFORM:-android}"
PUBLISH_URL="${EXPO_OTA_PUBLISH_URL:-https://srv1765056.hstgr.cloud}"

cd "${TV_DIR}"
echo "Publishing TV OTA to branch=${BRANCH} channel=${RELEASE_CHANNEL} platform=${PLATFORM}..."
npx eoas publish \
  --branch "${BRANCH}" \
  --channel "${RELEASE_CHANNEL}" \
  --platform "${PLATFORM}" \
  --nonInteractive \
  --serverUrl "${PUBLISH_URL}" \
  --message "${OTA_MESSAGE:-PrysymTV TV update}"

echo "Done. Open the app on your TV and choose Restart when prompted."
