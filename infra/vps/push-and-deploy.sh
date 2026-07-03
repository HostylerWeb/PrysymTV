#!/usr/bin/env bash
# Run from your laptop: pulls latest on the VPS and runs infra/vps/deploy.sh there.
# Uses sshpass (password auth) — NOT SSH keys.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_ENV="${SCRIPT_DIR}/.deploy.env"

VPS_HOST="${PRYSYM_VPS_HOST:-2.25.210.178}"
VPS_USER="${PRYSYM_VPS_USER:-root}"
REMOTE_DEPLOY="${PRYSYM_REMOTE_DEPLOY:-bash /var/www/prysymtv/infra/vps/deploy.sh}"

if [[ -f "$DEPLOY_ENV" ]]; then
  # shellcheck disable=SC1090
  source "$DEPLOY_ENV"
fi

: "${PRYSYM_VPS_PASSWORD:?Set PRYSYM_VPS_PASSWORD in ${DEPLOY_ENV} or your environment}"

if ! command -v sshpass >/dev/null 2>&1; then
  echo "sshpass is required. Install: sudo apt install sshpass" >&2
  exit 1
fi

echo "[prysym] Deploying to ${VPS_USER}@${VPS_HOST} ..."
sshpass -p "${PRYSYM_VPS_PASSWORD}" ssh \
  -o StrictHostKeyChecking=accept-new \
  -o PreferredAuthentications=password \
  -o PubkeyAuthentication=no \
  "${VPS_USER}@${VPS_HOST}" \
  "${REMOTE_DEPLOY}"

echo "[prysym] Remote deploy finished."
