#!/usr/bin/env bash
# Deploy xprem OTA stack on PrysymTV VPS (https://HOST/ota).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${PRYSYM_HOST:-srv1765056.hstgr.cloud}"
BASE_URL="https://${HOST}"
SITE_DIR="${PRYSYM_SITE_DIR:-/var/www/prysymtv}"
SSH_USER="${PRYSYM_SSH_USER:-root}"
SSH_HOST="${PRYSYM_SSH_HOST:-2.25.210.178}"
SSH_PASS="${PRYSYM_SSH_PASS:-}"

if [[ -z "${SSH_PASS}" && -f "${ROOT_DIR}/infra/vps/.deploy-pass" ]]; then
  SSH_PASS="$(cat "${ROOT_DIR}/infra/vps/.deploy-pass")"
fi

: "${SSH_PASS:?Set PRYSYM_SSH_PASS or infra/vps/.deploy-pass}"

echo "Deploying OTA stack on ${SSH_USER}@${SSH_HOST}..."
SSHPASS="${SSH_PASS}" sshpass -e ssh -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" bash -s <<REMOTE
set -euo pipefail
SITE_DIR="${SITE_DIR}"
BASE_URL="${BASE_URL}"
cd "\$SITE_DIR"
git -c safe.directory="\$SITE_DIR" fetch origin main
git -c safe.directory="\$SITE_DIR" reset --hard origin/main

OTA_DIR="\$SITE_DIR/infra/ota"
ENV_FILE="\$OTA_DIR/.env"

if [[ ! -f "\$ENV_FILE" ]]; then
  JWT=\$(openssl rand -base64 32)
  DBKEY=\$(openssl rand -base64 32)
  DBPASS=\$(openssl rand -hex 16)
  ADMIN_PASS="PrysymOta\$(openssl rand -hex 3)!"
  cat > "\$ENV_FILE" <<EOF
XPREM_BASE_URL=\$BASE_URL
XPREM_DB_PASSWORD=\$DBPASS
XPREM_DB_KEYS_MASTER_KEY_B64=\$DBKEY
XPREM_JWT_SECRET=\$JWT
XPREM_ADMIN_EMAIL=admin@prysym.tv
XPREM_ADMIN_PASSWORD=\$ADMIN_PASS
EOF
  chmod 600 "\$ENV_FILE"
  echo "Created \$ENV_FILE with generated secrets."
  echo "XPREM_ADMIN_PASSWORD=\$ADMIN_PASS"
else
  if grep -q '\${XPREM_BASE_URL}/ota' "\$ENV_FILE" || grep -q '/ota\$' "\$ENV_FILE"; then
    sed -i "s|^XPREM_BASE_URL=.*|XPREM_BASE_URL=\$BASE_URL|" "\$ENV_FILE"
  fi
fi

docker compose -f "\$OTA_DIR/docker-compose.yml" --env-file "\$ENV_FILE" pull
docker compose -f "\$OTA_DIR/docker-compose.yml" --env-file "\$ENV_FILE" up -d

NGINX_SITE=/etc/nginx/sites-available/prysymtv
if [[ -f "\$NGINX_SITE" ]] && ! grep -q 'location /ota/' "\$NGINX_SITE"; then
  awk '
    /location \/api\/ \{/ && !inserted {
      print "  location /ota/ {"
      print "    proxy_pass http://127.0.0.1:3011/;"
      print "    proxy_http_version 1.1;"
      print "    proxy_set_header Host \$host;"
      print "    proxy_set_header X-Real-IP \$remote_addr;"
      print "    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
      print "    proxy_set_header X-Forwarded-Proto \$scheme;"
      print "    client_max_body_size 128m;"
      print "  }"
      print ""
      print "  location /assets {"
      print "    proxy_pass http://127.0.0.1:3011;"
      print "    proxy_http_version 1.1;"
      print "    proxy_set_header Host \$host;"
      print "    proxy_set_header X-Real-IP \$remote_addr;"
      print "    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
      print "    proxy_set_header X-Forwarded-Proto \$scheme;"
      print "    client_max_body_size 128m;"
      print "  }"
      print ""
      print "  location ~ \"^/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/\" {"
      print "    proxy_pass http://127.0.0.1:3011;"
      print "    proxy_http_version 1.1;"
      print "    proxy_set_header Host \$host;"
      print "    proxy_set_header X-Real-IP \$remote_addr;"
      print "    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
      print "    proxy_set_header X-Forwarded-Proto \$scheme;"
      print "    client_max_body_size 128m;"
      print "  }"
      print ""
      inserted=1
    }
    { print }
  ' "\$NGINX_SITE" > "\$NGINX_SITE.tmp" && mv "\$NGINX_SITE.tmp" "\$NGINX_SITE"
fi

nginx -t
systemctl reload nginx

for i in \$(seq 1 30); do
  if curl -fsS http://127.0.0.1:3011/hc >/dev/null 2>&1; then
    echo "xprem health: OK"
    exit 0
  fi
  sleep 2
done
echo "xprem failed to start:" >&2
docker logs prysym-xprem 2>&1 | tail -30 >&2
exit 1
REMOTE

echo "OTA VPS deploy finished."
