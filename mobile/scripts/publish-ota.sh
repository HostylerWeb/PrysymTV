#!/usr/bin/env bash
# Publish a JS bundle to the self-hosted xprem OTA server.
set -euo pipefail

MOBILE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ROOT_DIR="$(cd "${MOBILE_DIR}/.." && pwd)"
SECRETS_FILE="${ROOT_DIR}/infra/ota/bootstrap.secrets.env"

if [[ -f "${SECRETS_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${SECRETS_FILE}"
  set +a
fi

if [[ -f "${MOBILE_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${MOBILE_DIR}/.env"
  set +a
fi

: "${EOO_TOKEN:?Set EOO_TOKEN or run scripts/bootstrap-xprem.sh first}"

export RELEASE_CHANNEL="${RELEASE_CHANNEL:-${EXPO_OTA_CHANNEL:-production}}"
BRANCH="${EXPO_OTA_BRANCH:-production}"
PLATFORM="${OTA_PLATFORM:-android}"
PUBLISH_URL="${EXPO_OTA_PUBLISH_URL:-https://srv1765056.hstgr.cloud}"

cd "${MOBILE_DIR}"
echo "Publishing OTA to branch=${BRANCH} channel=${RELEASE_CHANNEL} platform=${PLATFORM}..."
npx eoas publish \
  --branch "${BRANCH}" \
  --channel "${RELEASE_CHANNEL}" \
  --platform "${PLATFORM}" \
  --nonInteractive \
  --serverUrl "${PUBLISH_URL}" \
  --message "${OTA_MESSAGE:-PrysymTV update}"

echo "Done. Open the app and tap Restart when prompted."
