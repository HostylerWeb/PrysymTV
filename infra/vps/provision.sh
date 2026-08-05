#!/usr/bin/env bash
# Prysym TV — fresh Ubuntu 24.04 VPS bootstrap (infrastructure only, no app deploy).
set -euo pipefail

PUBLIC_IP="${PUBLIC_IP:-$(curl -fsS https://api.ipify.org 2>/dev/null || hostname -I | awk '{print $1}')}"
HOSTNAME_SHORT="$(hostname -s)"
DEPLOY_USER="prysym"
APP_ROOT="/var/www/prysymtv"
STACK_DIR="/opt/prysym/stack"
SECRETS_FILE="/etc/prysym/secrets.env"
ENV_TEMPLATE="/etc/prysym/api.env.template"

export DEBIAN_FRONTEND=noninteractive

log() { echo "[prysym-provision] $*"; }

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root." >&2
  exit 1
fi

log "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  ca-certificates curl gnupg lsb-release git ufw fail2ban nginx \
  acl unattended-upgrades apt-listchanges \
  ffmpeg openssl software-properties-common

log "Enabling unattended security upgrades..."
dpkg-reconfigure -f noninteractive unattended-upgrades || true

if [[ ! -f /swapfile ]]; then
  log "Adding 2G swap..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
fi

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]]; then
  log "Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi

log "Installing global Node tools (pnpm, pm2)..."
npm install -g pnpm pm2

if ! id "$DEPLOY_USER" &>/dev/null; then
  log "Creating deploy user: $DEPLOY_USER"
  useradd -m -s /bin/bash "$DEPLOY_USER"
  usermod -aG docker "$DEPLOY_USER"
fi

mkdir -p /etc/prysym "$STACK_DIR" "$APP_ROOT"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_ROOT"
chmod 755 "$APP_ROOT"

if [[ ! -f "$SECRETS_FILE" ]]; then
  log "Generating database secrets..."
  POSTGRES_PASSWORD="$(openssl rand -base64 32 | tr -d '/+=' | head -c 40)"
  REDIS_PASSWORD="$(openssl rand -base64 32 | tr -d '/+=' | head -c 40)"
  cat > "$SECRETS_FILE" <<EOF
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
REDIS_PASSWORD=${REDIS_PASSWORD}
EOF
  chmod 600 "$SECRETS_FILE"
  chown root:root "$SECRETS_FILE"
else
  log "Secrets file exists — keeping existing passwords."
  # shellcheck disable=SC1090
  source "$SECRETS_FILE"
fi

# shellcheck disable=SC1090
source "$SECRETS_FILE"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$SCRIPT_DIR/docker-compose.prod.yml" ]]; then
  cp "$SCRIPT_DIR/docker-compose.prod.yml" "$STACK_DIR/docker-compose.yml"
fi
if [[ -f "$SCRIPT_DIR/../Dockerfile.mediamtx" ]]; then
  cp "$SCRIPT_DIR/../Dockerfile.mediamtx" "$STACK_DIR/Dockerfile.mediamtx"
fi
if [[ -f "$SCRIPT_DIR/mediamtx.prod.yml" ]]; then
  sed -e "s|PRYSYM_PUBLIC_ORIGIN|https://${PUBLIC_IP}|g" \
      -e "s|PRYSYM_PUBLIC_HOST|${PUBLIC_IP}|g" \
      "$SCRIPT_DIR/mediamtx.prod.yml" > "$STACK_DIR/mediamtx.yml"
fi

# Fix redis command in compose (env substitution)
cat > "$STACK_DIR/docker-compose.yml" <<'COMPOSE'
services:
  postgres:
    image: postgres:16-alpine
    container_name: prysym-postgres
    restart: unless-stopped
    env_file:
      - /etc/prysym/secrets.env
    environment:
      POSTGRES_USER: prysym
      POSTGRES_DB: prysymtv
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - prysym_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U prysym -d prysymtv"]
      interval: 10s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: prysym-redis
    restart: unless-stopped
    env_file:
      - /etc/prysym/secrets.env
    entrypoint: ["/bin/sh", "-c", "redis-server --requirepass \"$$REDIS_PASSWORD\" --appendonly yes"]
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - prysym_redis_data:/data

  mediamtx:
    build:
      context: .
      dockerfile: Dockerfile.mediamtx
    image: prysym-mediamtx:latest
    container_name: prysym-mediamtx
    restart: unless-stopped
    network_mode: host
    volumes:
      - /opt/prysym/stack/mediamtx.yml:/mediamtx.yml:ro
    command: ["/mediamtx.yml"]

volumes:
  prysym_pg_data:
  prysym_redis_data:
COMPOSE

# Prefer docker-compose.prod.yml (includes MediaMTX image with curl for webhooks)
if [[ -f "$SCRIPT_DIR/docker-compose.prod.yml" ]]; then
  cp "$SCRIPT_DIR/docker-compose.prod.yml" "$STACK_DIR/docker-compose.yml"
  # prod compose build context is infra/ — on VPS use stack-local Dockerfile
  sed -i 's|context: \.\.|context: .|' "$STACK_DIR/docker-compose.yml"
  sed -i 's|dockerfile: Dockerfile.mediamtx|dockerfile: Dockerfile.mediamtx|' "$STACK_DIR/docker-compose.yml"
fi
if [[ -f "$SCRIPT_DIR/../Dockerfile.mediamtx" ]]; then
  cp "$SCRIPT_DIR/../Dockerfile.mediamtx" "$STACK_DIR/Dockerfile.mediamtx"
fi

# Legacy inline compose fallback (only if prod file missing)
if [[ ! -f "$STACK_DIR/docker-compose.yml" ]]; then
cat > "$STACK_DIR/docker-compose.yml" <<'COMPOSE'
services:
  postgres:
    image: postgres:16-alpine
    container_name: prysym-postgres
    restart: unless-stopped
    env_file:
      - /etc/prysym/secrets.env
    environment:
      POSTGRES_USER: prysym
      POSTGRES_DB: prysymtv
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - prysym_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U prysym -d prysymtv"]
      interval: 10s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    container_name: prysym-redis
    restart: unless-stopped
    env_file:
      - /etc/prysym/secrets.env
    entrypoint: ["/bin/sh", "-c", "redis-server --requirepass \"$$REDIS_PASSWORD\" --appendonly yes"]
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - prysym_redis_data:/data

  mediamtx:
    build:
      context: .
      dockerfile: Dockerfile.mediamtx
    image: prysym-mediamtx:latest
    container_name: prysym-mediamtx
    restart: unless-stopped
    network_mode: host
    volumes:
      - /opt/prysym/stack/mediamtx.yml:/mediamtx.yml:ro
    command: ["/mediamtx.yml"]

volumes:
  prysym_pg_data:
  prysym_redis_data:
COMPOSE
fi

log "Starting Docker stack (Postgres, Redis, MediaMTX)..."
cd "$STACK_DIR"
docker compose pull -q
docker compose up -d

JWT_ACCESS="$(openssl rand -base64 48)"
JWT_REFRESH="$(openssl rand -base64 48)"

cat > "$ENV_TEMPLATE" <<EOF
# Copy to ${APP_ROOT}/api/.env when deploying — fill FRONTEND_URL / CORS when domain is ready.
NODE_ENV=production
API_PORT=4000
API_PUBLIC_URL=https://${PUBLIC_IP}/api/v1
API_BUILD_ID=production
CORS_ORIGIN=https://${PUBLIC_IP}
FRONTEND_URL=https://${PUBLIC_IP}

DATABASE_URL=postgresql://prysym:${POSTGRES_PASSWORD}@127.0.0.1:5432/prysymtv?schema=public
REDIS_URL=redis://:${REDIS_PASSWORD}@127.0.0.1:6379

JWT_ACCESS_SECRET=${JWT_ACCESS}
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=400d

STORAGE_DRIVER=s3
# Add R2 credentials from Cloudflare when deploying

VIDEO_PROCESSING_MODE=ffmpeg
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

RTMP_INGEST_URL=rtmp://${PUBLIC_IP}:1935/live
MEDIAMTX_HLS_PUBLIC_URL=https://${PUBLIC_IP}/hls
MEDIAMTX_WEBRTC_PUBLIC_URL=https://${PUBLIC_IP}/webrtc
MEDIAMTX_API_URL=http://127.0.0.1:9997

AUTO_APPROVE_STREAMER=false
BILLING_DEV_GRANTS=false
SEED_DEMO_CONTENT=false

THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=1000
EOF
chmod 640 "$ENV_TEMPLATE"
chown root:"$DEPLOY_USER" "$ENV_TEMPLATE"

if [[ ! -f /etc/ssl/certs/prysym-selfsigned.crt ]]; then
  log "Creating self-signed TLS cert (replace with certbot when domain is ready)..."
  openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
    -keyout /etc/ssl/private/prysym-selfsigned.key \
    -out /etc/ssl/certs/prysym-selfsigned.crt \
    -subj "/CN=${HOSTNAME_SHORT}/O=PrysymTV/C=US" \
    -addext "subjectAltName=IP:${PUBLIC_IP},DNS:${HOSTNAME_SHORT},DNS:localhost"
  chmod 600 /etc/ssl/private/prysym-selfsigned.key
fi

log "Configuring nginx..."
cat > /etc/nginx/sites-available/prysymtv <<'NGINX'
limit_req_zone $binary_remote_addr zone=prysym_api:10m rate=40r/s;
limit_req_zone $binary_remote_addr zone=prysym_web:10m rate=60r/s;

map $http_upgrade $connection_upgrade {
  default upgrade;
  ''      close;
}

upstream prysym_api {
  server 127.0.0.1:4000;
  keepalive 16;
}

upstream prysym_web {
  server 127.0.0.1:3001;
  keepalive 16;
}

server {
  listen 80 default_server;
  listen [::]:80 default_server;
  server_name _;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2 default_server;
  listen [::]:443 ssl http2 default_server;
  server_name _;

  ssl_certificate     /etc/ssl/certs/prysym-selfsigned.crt;
  ssl_certificate_key /etc/ssl/private/prysym-selfsigned.key;
  ssl_protocols       TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers off;
  ssl_session_cache   shared:SSL:10m;
  ssl_session_timeout 1d;

  server_tokens off;
  client_max_body_size 10g;
  client_body_timeout 1200s;

  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(self), microphone=(self), geolocation=()" always;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  location /api/ {
    limit_req zone=prysym_api burst=80 nodelay;
    proxy_pass http://prysym_api;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 1200s;
    proxy_send_timeout 1200s;
  }

  location /socket.io/ {
    proxy_pass http://prysym_api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600s;
  }

  location /hls/ {
    proxy_pass http://127.0.0.1:8888/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_redirect off;
    add_header Cache-Control "no-cache";
    add_header Access-Control-Allow-Origin "*" always;
  }

  # MediaMTX HLS uses absolute /live/sk_… paths in playlists — must not hit Next.js /live/[id]
  location ~ ^/live/(sk_[^/]+)/ {
    proxy_pass http://127.0.0.1:8888;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_redirect off;
    add_header Cache-Control "no-cache";
    add_header Access-Control-Allow-Origin "*" always;
  }

  location /webrtc/ {
    proxy_pass http://127.0.0.1:8889/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
  }

  location / {
    limit_req zone=prysym_web burst=120 nodelay;
    proxy_pass http://prysym_web;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/prysymtv /etc/nginx/sites-enabled/prysymtv
nginx -t
systemctl enable --now nginx
systemctl reload nginx

log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.d/prysym-sshd.conf <<'F2B'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 4
bantime = 1h
findtime = 10m
F2B
systemctl enable --now fail2ban

log "Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 1935/tcp comment 'RTMP ingest'
ufw allow 8189/udp comment 'WebRTC ICE (browser Go Live)'
ufw allow 8189/tcp comment 'WebRTC ICE TCP fallback'
ufw --force enable

log "Hardening SSH (password auth stays on until you add SSH keys)..."
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin yes/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#\?X11Forwarding.*/X11Forwarding no/' /etc/ssh/sshd_config
grep -q '^MaxAuthTries' /etc/ssh/sshd_config || echo 'MaxAuthTries 4' >> /etc/ssh/sshd_config
systemctl reload ssh || systemctl reload sshd

cat > /etc/systemd/system/prysym-api.service <<SYSTEMD
[Unit]
Description=Prysym TV API (NestJS)
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=${DEPLOY_USER}
WorkingDirectory=${APP_ROOT}/api
EnvironmentFile=${APP_ROOT}/api/.env
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
SYSTEMD

cat > /etc/systemd/system/prysym-web.service <<SYSTEMD
[Unit]
Description=Prysym TV Web (Next.js standalone)
After=network.target prysym-api.service

[Service]
Type=simple
User=${DEPLOY_USER}
WorkingDirectory=${APP_ROOT}/.next/standalone
EnvironmentFile=${APP_ROOT}/.env.production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
# Not enabled until app is deployed:
systemctl disable prysym-api prysym-web 2>/dev/null || true

apt-get install -y -qq certbot python3-certbot-nginx

log "Provision complete."
echo ""
echo "=== Prysym VPS ready ==="
echo "Public IP:     ${PUBLIC_IP}"
echo "HTTPS:         https://${PUBLIC_IP}/  (self-signed — browser warning until real domain)"
echo "App directory: ${APP_ROOT}  (empty — deploy later)"
echo "API env template: ${ENV_TEMPLATE}"
echo "DB/Redis secrets: ${SECRETS_FILE}  (root only)"
echo ""
echo "Docker: $(docker compose -f ${STACK_DIR}/docker-compose.yml ps --format '{{.Name}}: {{.Status}}' 2>/dev/null | tr '\n' ' ')"
echo ""
echo "NEXT: Add SSH key for user '${DEPLOY_USER}', deploy code, copy env template, certbot when domain is ready."
echo "SECURITY: Change root password; rotate secrets if this chat was logged; use certbot for real TLS."
