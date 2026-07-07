#!/usr/bin/env bash
# Deploy PrysymTV to VPS (run as root after provision.sh).
set -euo pipefail

HOST="${PRYSYM_HOST:-srv1765056.hstgr.cloud}"
BASE_URL="https://${HOST}"
PUBLIC_IP="${PRYSYM_PUBLIC_IP:-$(curl -fsS -4 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')}"
APP="/var/www/prysymtv"
DEPLOY_USER="prysym"
REPO="https://github.com/HostylerWeb/PrysymTV.git"
INFRA_SECRETS="/etc/prysym/secrets.env"
APP_SECRETS="/etc/prysym/app-secrets.env"
API_ENV_TEMPLATE="/etc/prysym/api.env.template"
API_ENV="${APP}/api/.env"
API_ENV_BACKUP="${APP}/api/.env.bak"
FRONTEND_ENV="${APP}/.env.production"

log() { echo "[prysym-deploy] $*"; }
die() { echo "[prysym-deploy] ERROR: $*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "Run as root."

# Read KEY=value from an env file (first match). Empty string if missing.
read_env_file() {
  local file="$1" key="$2"
  [[ -f "$file" ]] || return 0
  grep -m1 "^${key}=" "$file" 2>/dev/null | cut -d= -f2- || true
}

# Require one or more variable names to be non-empty in the current shell.
require_vars() {
  local name missing=()
  for name in "$@"; do
    if [[ -z "${!name:-}" ]]; then
      missing+=("$name")
    fi
  done
  if ((${#missing[@]} > 0)); then
    die "Missing required variable(s): ${missing[*]} — check ${INFRA_SECRETS} and ${APP_SECRETS}"
  fi
}

# Merge KEY=value pairs into an env file without wiping unrelated keys.
upsert_env_file() {
  local file="$1"
  shift
  local tmp next
  tmp="$(mktemp)"

  if [[ -f "$file" ]]; then
    cp -a "$file" "$tmp"
  else
    : >"$tmp"
  fi

  while [[ $# -ge 2 ]]; do
    local key="$1" value="$2"
    shift 2
    grep -v "^${key}=" "$tmp" >"${tmp}.next" 2>/dev/null || true
    printf '%s=%s\n' "$key" "$value" >>"${tmp}.next"
    mv "${tmp}.next" "$tmp"
  done

  [[ -s "$tmp" ]] || die "Refusing to write empty env file: $file"
  install -m 640 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$tmp" "$file"
  rm -f "$tmp"
}

# Load infra + app secrets AFTER git pull. Fails fast before api/.env is touched.
load_deploy_secrets() {
  [[ -f "$INFRA_SECRETS" ]] || die "Missing ${INFRA_SECRETS} (run provision.sh first)"
  # shellcheck disable=SC1091
  source "$INFRA_SECRETS"
  require_vars POSTGRES_PASSWORD REDIS_PASSWORD

  [[ -f "$APP_SECRETS" ]] || die "Missing ${APP_SECRETS} — create it before deploying (see INSTRUCTIONS.txt)"
  # shellcheck disable=SC1091
  source "$APP_SECRETS"
  require_vars \
    S3_ENDPOINT S3_BUCKET S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY S3_PUBLIC_BASE_URL \
    SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_FROM
}

# Prefer existing api/.env values for long-lived secrets; fall back to app-secrets / template.
resolve_api_secret() {
  local key="$1" fallback="$2"
  local from_existing
  from_existing="$(read_env_file "$API_ENV" "$key")"
  if [[ -n "$from_existing" ]]; then
    printf '%s' "$from_existing"
  else
    printf '%s' "$fallback"
  fi
}

validate_api_env() {
  local key val missing=()
  for key in \
    NODE_ENV API_PORT API_PUBLIC_URL DATABASE_URL REDIS_URL \
    JWT_ACCESS_SECRET JWT_REFRESH_SECRET \
    S3_ENDPOINT S3_BUCKET S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY S3_PUBLIC_BASE_URL \
    SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_FROM; do
    val="$(read_env_file "$API_ENV" "$key")"
    if [[ -z "$val" ]]; then
      missing+=("$key")
    fi
  done
  if ((${#missing[@]} > 0)); then
    die "api/.env is incomplete after update (missing: ${missing[*]}). Restore from ${API_ENV_BACKUP} if needed."
  fi
}

write_api_env() {
  local jwt_access jwt_refresh
  local s3_region stripe_key stripe_wh playback_ttl google_oauth apple_oauth facebook_app_id facebook_app_secret

  jwt_access="$(resolve_api_secret JWT_ACCESS_SECRET "$(grep ^JWT_ACCESS_SECRET= "$API_ENV_TEMPLATE" | cut -d= -f2-)")"
  jwt_refresh="$(resolve_api_secret JWT_REFRESH_SECRET "$(grep ^JWT_REFRESH_SECRET= "$API_ENV_TEMPLATE" | cut -d= -f2-)")"
  require_vars jwt_access jwt_refresh

  s3_region="$(resolve_api_secret S3_REGION "${S3_REGION:-auto}")"
  stripe_key="$(resolve_api_secret STRIPE_SECRET_KEY "${STRIPE_SECRET_KEY:-}")"
  stripe_wh="$(resolve_api_secret STRIPE_WEBHOOK_SECRET "${STRIPE_WEBHOOK_SECRET:-}")"

  playback_ttl="$(read_env_file "$API_ENV" PLAYBACK_TOKEN_TTL_SECONDS)"
  [[ -z "$playback_ttl" ]] && playback_ttl=14400

  google_oauth="$(resolve_api_secret GOOGLE_CLIENT_ID "")"
  apple_oauth="$(resolve_api_secret APPLE_CLIENT_ID "")"
  facebook_app_id="$(resolve_api_secret FACEBOOK_APP_ID "")"
  facebook_app_secret="$(resolve_api_secret FACEBOOK_APP_SECRET "")"

  if [[ -f "$API_ENV" ]] && [[ -s "$API_ENV" ]]; then
    log "Updating api/.env in place (preserving existing secrets)..."
    cp -a "$API_ENV" "$API_ENV_BACKUP"
  else
    log "Creating api/.env (first deploy or file was missing)..."
    [[ -f "$API_ENV_BACKUP" && -s "$API_ENV_BACKUP" ]] && {
      log "Restoring from backup ${API_ENV_BACKUP}"
      cp -a "$API_ENV_BACKUP" "$API_ENV"
    }
  fi

  upsert_env_file "$API_ENV" \
    NODE_ENV production \
    API_PORT 4000 \
    API_PUBLIC_URL "${BASE_URL}/api/v1" \
    API_BUILD_ID "production-$(date +%Y%m%d)" \
    CORS_ORIGIN "${BASE_URL}" \
    FRONTEND_URL "${BASE_URL}" \
    DATABASE_URL "postgresql://prysym:${POSTGRES_PASSWORD}@127.0.0.1:5432/prysymtv?schema=public" \
    REDIS_URL "redis://:${REDIS_PASSWORD}@127.0.0.1:6379" \
    JWT_ACCESS_SECRET "$jwt_access" \
    JWT_REFRESH_SECRET "$jwt_refresh" \
    JWT_ACCESS_TTL 15m \
    JWT_REFRESH_TTL 7d \
    STORAGE_DRIVER s3 \
    S3_ENDPOINT "$(resolve_api_secret S3_ENDPOINT "$S3_ENDPOINT")" \
    S3_REGION "$s3_region" \
    S3_BUCKET "$(resolve_api_secret S3_BUCKET "$S3_BUCKET")" \
    S3_ACCESS_KEY_ID "$(resolve_api_secret S3_ACCESS_KEY_ID "$S3_ACCESS_KEY_ID")" \
    S3_SECRET_ACCESS_KEY "$(resolve_api_secret S3_SECRET_ACCESS_KEY "$S3_SECRET_ACCESS_KEY")" \
    S3_PUBLIC_BASE_URL "$(resolve_api_secret S3_PUBLIC_BASE_URL "$S3_PUBLIC_BASE_URL")" \
    STORAGE_RAW_KEY_PREFIX uploads/raw \
    STORAGE_HLS_KEY_PREFIX uploads/hls \
    STORAGE_THUMBNAIL_KEY_PREFIX uploads/thumbnails \
    STORAGE_RAW_KEY_PATTERN '{videoId}/source{extension}' \
    STORAGE_PRESIGN_EXPIRES_SECONDS 3600 \
    UPLOAD_MAX_BYTES 2147483648 \
    UPLOAD_ALLOWED_MIME_PREFIXES 'video/,audio/' \
    VIDEO_PROCESSING_MODE ffmpeg \
    VIDEO_PROCESSING_MAX_RETRIES 3 \
    FFMPEG_PATH /usr/bin/ffmpeg \
    FFPROBE_PATH /usr/bin/ffprobe \
    RTMP_INGEST_URL "rtmp://${HOST}:1935/live" \
    MEDIAMTX_HLS_PUBLIC_URL "${BASE_URL}/hls" \
    MEDIAMTX_WEBRTC_PUBLIC_URL "${BASE_URL}/webrtc" \
    MEDIAMTX_API_URL http://127.0.0.1:9997 \
    AUTO_APPROVE_STREAMER false \
    BILLING_DEV_GRANTS false \
    SEED_DEMO_CONTENT false \
    STRIPE_SECRET_KEY "$stripe_key" \
    STRIPE_WEBHOOK_SECRET "$stripe_wh" \
    SMTP_HOST "$(resolve_api_secret SMTP_HOST "$SMTP_HOST")" \
    SMTP_PORT "$(resolve_api_secret SMTP_PORT "$SMTP_PORT")" \
    SMTP_USER "$(resolve_api_secret SMTP_USER "$SMTP_USER")" \
    SMTP_PASS "$(resolve_api_secret SMTP_PASS "$SMTP_PASS")" \
    SMTP_FROM "$(resolve_api_secret SMTP_FROM "$SMTP_FROM")" \
    THROTTLE_TTL_MS 60000 \
    THROTTLE_LIMIT 1000 \
    PLAYBACK_TOKEN_TTL_SECONDS "$playback_ttl"

  if [[ -n "$google_oauth" ]]; then
    upsert_env_file "$API_ENV" GOOGLE_CLIENT_ID "$google_oauth"
  fi
  if [[ -n "$apple_oauth" ]]; then
    upsert_env_file "$API_ENV" APPLE_CLIENT_ID "$apple_oauth"
  fi
  if [[ -n "$facebook_app_id" ]]; then
    upsert_env_file "$API_ENV" FACEBOOK_APP_ID "$facebook_app_id"
  fi
  if [[ -n "$facebook_app_secret" ]]; then
    upsert_env_file "$API_ENV" FACEBOOK_APP_SECRET "$facebook_app_secret"
  fi

  validate_api_env
  log "api/.env OK ($(wc -l <"$API_ENV") lines, backup at ${API_ENV_BACKUP})"
}

write_frontend_env() {
  upsert_env_file "$FRONTEND_ENV" \
    PORT 3001 \
    NEXT_PUBLIC_API_URL "${BASE_URL}/api/v1" \
    NEXT_PUBLIC_WS_URL "${BASE_URL}" \
    NEXT_PUBLIC_UPLOAD_MAX_BYTES 2147483648 \
    NEXT_PUBLIC_RTMP_INGEST_URL "rtmp://${HOST}:1935/live" \
    NEXT_PUBLIC_ADMIN_UI_PREVIEW false
  log ".env.production OK"
}

log "Cloning / updating repository..."
if [[ ! -d "$APP/.git" ]]; then
  rm -rf "$APP"/*
  su - "$DEPLOY_USER" -c "git clone '$REPO' '$APP'"
else
  su - "$DEPLOY_USER" -c "cd '$APP' && git fetch origin && git reset --hard origin/main && git clean -fd"
fi

load_deploy_secrets

log "Syncing environment files..."
write_api_env
write_frontend_env

# Persist app secrets for future deploys / disaster recovery (never printed).
grep -E '^(S3_|SMTP_|STRIPE_)' "$API_ENV" >"$APP_SECRETS" || true
chmod 600 "$APP_SECRETS"

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
