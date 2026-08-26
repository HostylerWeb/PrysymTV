#!/usr/bin/env bash
# Bootstrap PrysymTV TV app on xprem (separate OTA app from phone).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export XPREM_APP_NAME="${XPREM_APP_NAME:-PrysymTV TV}"
export XPREM_CERT_OUT="${XPREM_CERT_OUT:-${ROOT_DIR}/tv-projector/certs/certificate.pem}"
export XPREM_SECRETS_OUT="${XPREM_SECRETS_OUT:-${ROOT_DIR}/infra/ota/bootstrap-tv.secrets.env}"

exec "${ROOT_DIR}/scripts/bootstrap-xprem.sh"
