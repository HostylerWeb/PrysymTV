#!/usr/bin/env bash
# Deploy PrysymTV to VPS (run as root after provision.sh).
set -euo pipefail

HOST="${PRYSYM_HOST:-srv1765056.hstgr.cloud}"
BASE_URL="https://${HOST}"
PUBLIC_IP="${PRYSYM_PUBLIC_IP:-$(curl -fsS -4 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')}"
APP="/var/www/prysymtv"
DEPLOY_USER="prysym"
REPO="https://github.com/HostylerWeb/PrysymTV.git"

log() { echo "[prysym-deploy] $*"; }

[[ "$(id -u)" -eq 0 ]] || { echo "Run as root." >&2; exit 1; }

source /etc/prysym/secrets.env

log "Cloning / updating repository..."
if [[ ! -d "$APP/.git" ]]; then
  rm -rf "$APP"/*
  su - "$DEPLOY_USER" -c "git clone '$REPO' '$APP'"
else
  su - "$DEPLOY_USER" -c "cd '$APP' && git fetch origin && git reset --hard origin/main"
fi

log "Writing api/.env..."
cat > "$APP/api/.env" <<ENVFILE
NODE_ENV=production
API_PORT=4000
API_PUBLIC_URL=${BASE_URL}/api/v1
API_BUILD_ID=production-$(date +%Y%m%d)
CORS_ORIGIN=${BASE_URL}
FRONTEND_URL=${BASE_URL}

DATABASE_URL=postgresql://prysym:${POSTGRES_PASSWORD}@127.0.0.1:5432/prysymtv?schema=public
REDIS_URL=redis://:${REDIS_PASSWORD}@127.0.0.1:6379

JWT_ACCESS_SECRET=$(grep ^JWT_ACCESS_SECRET= /etc/prysym/api.env.template | cut -d= -f2-)
JWT_REFRESH_SECRET=$(grep ^JWT_REFRESH_SECRET= /etc/prysym/api.env.template | cut -d= -f2-)
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

STORAGE_DRIVER=s3
S3_ENDPOINT=${S3_ENDPOINT}
S3_REGION=auto
S3_BUCKET=${S3_BUCKET}
S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
S3_PUBLIC_BASE_URL=${S3_PUBLIC_BASE_URL}

STORAGE_RAW_KEY_PREFIX=uploads/raw
STORAGE_HLS_KEY_PREFIX=uploads/hls
STORAGE_THUMBNAIL_KEY_PREFIX=uploads/thumbnails
STORAGE_RAW_KEY_PATTERN={videoId}/source{extension}
STORAGE_PRESIGN_EXPIRES_SECONDS=3600
UPLOAD_MAX_BYTES=2147483648
UPLOAD_ALLOWED_MIME_PREFIXES=video/,audio/

VIDEO_PROCESSING_MODE=ffmpeg
VIDEO_PROCESSING_MAX_RETRIES=3
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe

RTMP_INGEST_URL=rtmp://${HOST}:1935/live
MEDIAMTX_HLS_PUBLIC_URL=${BASE_URL}/hls
MEDIAMTX_WEBRTC_PUBLIC_URL=${BASE_URL}/webrtc
MEDIAMTX_API_URL=http://127.0.0.1:9997

AUTO_APPROVE_STREAMER=false
BILLING_DEV_GRANTS=false
SEED_DEMO_CONTENT=false

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_FROM=${SMTP_FROM}

THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=1000
ENVFILE

chmod 640 "$APP/api/.env"
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP/api/.env"

log "Writing frontend .env.production..."
cat > "$APP/.env.production" <<ENVFILE
PORT=3001
NEXT_PUBLIC_API_URL=${BASE_URL}/api/v1
NEXT_PUBLIC_WS_URL=${BASE_URL}
NEXT_PUBLIC_UPLOAD_MAX_BYTES=2147483648
NEXT_PUBLIC_RTMP_INGEST_URL=rtmp://${HOST}:1935/live
NEXT_PUBLIC_ADMIN_UI_PREVIEW=false
ENVFILE
chmod 640 "$APP/.env.production"
chown "$DEPLOY_USER:$DEPLOY_USER" "$APP/.env.production"

log "Updating MediaMTX for ${HOST}..."
MTX=/opt/prysym/stack/mediamtx.yml
if [[ -f "$APP/infra/vps/mediamtx.prod.yml" ]]; then
  sed -e "s|PRYSYM_PUBLIC_ORIGIN|${BASE_URL}|g" \
      -e "s|PRYSYM_PUBLIC_HOST|${HOST}|g" \
      -e "s|PRYSYM_PUBLIC_IP|${PUBLIC_IP}|g" \
      "$APP/infra/vps/mediamtx.prod.yml" > "$MTX"
else
  sed -i "s|http://localhost:3001|${BASE_URL}|g" "$MTX" 2>/dev/null || true
  sed -i "s|https://[^ ]*|${BASE_URL}|g" "$MTX" 2>/dev/null || true
fi
docker restart prysym-mediamtx 2>/dev/null || (cd /opt/prysym/stack && docker compose up -d mediamtx)

log "Updating nginx server_name..."
sed -i "s/server_name .*/server_name ${HOST} _;/" /etc/nginx/sites-available/prysymtv
nginx -t && systemctl reload nginx

MAIN_TS="$APP/api/src/main.ts"
if [[ -f "$MAIN_TS" ]] && ! grep -q 'trust proxy' "$MAIN_TS"; then
  sed -i "/app.setGlobalPrefix('api\/v1');/a\\
  app.getHttpAdapter().getInstance().set('trust proxy', 1);" "$MAIN_TS"
fi

log "TLS (Let's Encrypt)..."
if certbot --nginx -d "$HOST" --non-interactive --agree-tos -m "${SMTP_FROM:-admin@prysym.tv}" --redirect 2>/dev/null; then
  log "Certbot succeeded."
else
  log "Certbot skipped or failed — using self-signed cert."
fi

log "Installing API dependencies & migrating..."
su - "$DEPLOY_USER" -c "cd '$APP/api' && npm ci && npx prisma generate"
if ! su - "$DEPLOY_USER" -c "cd '$APP/api' && npx prisma migrate deploy"; then
  log "migrate deploy failed — falling back to prisma db push"
  su - "$DEPLOY_USER" -c "cd '$APP/api' && npx prisma db push"
fi
su - "$DEPLOY_USER" -c "cd '$APP/api' && npm run build"

log "Seeding platform catalog (admin, gifts, settings)..."
su - "$DEPLOY_USER" -c "cd '$APP/api' && npm run db:seed" || true

log "Installing & building frontend..."
su - "$DEPLOY_USER" -c "cd '$APP' && pnpm install --ignore-scripts=false"
su - "$DEPLOY_USER" -c "cd '$APP' && node node_modules/next/dist/bin/next build"
su - "$DEPLOY_USER" -c "cd '$APP' && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public"

chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP"

log "Starting systemd services..."
# Use Next.js standalone server (output: standalone in next.config.mjs)
cat > /etc/systemd/system/prysym-web.service <<SYSTEMD
[Unit]
Description=Prysym TV Web (Next.js standalone)
After=network.target prysym-api.service

[Service]
Type=simple
User=${DEPLOY_USER}
WorkingDirectory=${APP}/.next/standalone
EnvironmentFile=${APP}/.env.production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
SYSTEMD

systemctl daemon-reload
systemctl enable prysym-api prysym-web
systemctl restart prysym-api prysym-web

sleep 3
log "Health checks..."
curl -sf "http://127.0.0.1:4000/api/v1/health" | head -c 200 || echo "API health pending..."
curl -sk -o /dev/null -w "HTTPS home: %{http_code}\n" "${BASE_URL}/"
curl -sk -o /dev/null -w "HTTPS API: %{http_code}\n" "${BASE_URL}/api/v1/health"

log "Deploy complete: ${BASE_URL}"
