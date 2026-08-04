# Prysym TV — VPS production bootstrap

One-time setup for a fresh Ubuntu 24.04 VPS. **Does not deploy application code.**

## What gets installed

| Component | Purpose |
|-----------|---------|
| Docker + Compose | Postgres 16, Redis 7, MediaMTX |
| Node.js 22 + pnpm + pm2 | API and Next.js (when deployed) |
| FFmpeg | Video transcoding |
| nginx | HTTPS reverse proxy, rate limits, security headers |
| UFW | Firewall: 22, 80, 443, 1935 (RTMP), **8189 UDP/TCP (WebRTC ICE)** |
| fail2ban | SSH brute-force protection |
| certbot | Ready for real domain TLS later |
| 2G swap | Headroom for FFmpeg |

## Run bootstrap (from your laptop)

```bash
cd /path/to/PrysymTV
chmod +x infra/vps/provision.sh
sshpass -p 'YOUR_ROOT_PASSWORD' scp -r infra/vps root@YOUR_VPS_IP:/tmp/prysym-provision
sshpass -p 'YOUR_ROOT_PASSWORD' ssh root@YOUR_VPS_IP 'PUBLIC_IP=YOUR_VPS_IP bash /tmp/prysym-provision/provision.sh'
```

Replace passwords with SSH keys when possible — **never commit passwords**.

## After bootstrap

| Path | Contents |
|------|----------|
| `/var/www/prysymtv` | App deploy directory (empty) |
| `/opt/prysym/stack` | `docker-compose.yml` + `mediamtx.yml` |
| `/etc/prysym/secrets.env` | Postgres + Redis passwords (mode 600) |
| `/etc/prysym/app-secrets.env` | R2/S3, SMTP, Stripe bootstrap keys (mode 600; required if api/.env missing) |
| `/var/www/prysymtv/api/.env` | Live API config — **updated in place** by `deploy.sh` (backup: `api/.env.bak`) |
| `/etc/prysym/api.env.template` | API `.env` starter with generated JWT secrets |
| `/etc/systemd/system/prysym-*.service` | API + web units (disabled until deploy) |

HTTPS uses a **self-signed** cert until you run certbot with a real domain:

```bash
certbot --nginx -d yourdomain.com
```

Then update `CORS_ORIGIN`, `FRONTEND_URL`, `API_PUBLIC_URL`, and MediaMTX `webrtcAllowOrigins` in `api/.env`.

## Security checklist (post-bootstrap)

1. **Change root password** and create SSH keys for user `prysym`.
2. Disable root password login after keys work: `PermitRootLogin prohibit-password`, `PasswordAuthentication no`.
3. Copy `/etc/prysym/api.env.template` → `/var/www/prysymtv/api/.env` and add R2/Stripe/SMTP.
4. Never expose Postgres (5432) or Redis (6379) publicly — they bind to `127.0.0.1` only.

See [security-checklist.md](../web/security-checklist.md for full production requirements.

## Push notifications (Firebase / FCM)

Android push requires Firebase on the API and `google-services.json` in the mobile app. Full setup, key rotation, and troubleshooting:

**[`mobile/notifications.md`](../mobile/notifications.md)**

Production paths:

| Path | Purpose |
|------|---------|
| `/etc/prysym/firebase-adminsdk.json` | Firebase service account (`chown prysym:prysym`, `chmod 640`, **not in git**) |
| `api/.env` → `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to service account JSON (preferred — avoids systemd mangling inline JSON) |
| `api/.env` → `FIREBASE_SERVICE_ACCOUNT_JSON` | Fallback only (single-line minified JSON; avoid with `EnvironmentFile`) |
| `api/.env` → `VAPID_*` | Web browser push (optional) |

**Do not** put multi-line Firebase JSON in `api/.env` when `prysym-api.service` loads it via `EnvironmentFile` — use `FIREBASE_SERVICE_ACCOUNT_PATH` instead. See [production incident log](../mobile/notifications.md#production-incident-log-aug-2026) in `mobile/notifications.md`.

After changing Firebase env: `systemctl restart prysym-api`. Users must re-enable push in the app to register `fcm:` tokens.

## Live deployment (srv1765056.hstgr.cloud)

| URL | Status |
|-----|--------|
| https://srv1765056.hstgr.cloud/ | Frontend (Next.js standalone) |
| https://srv1765056.hstgr.cloud/api/v1/health | API health |
| rtmp://srv1765056.hstgr.cloud:1935/live | RTMP ingest |

Redeploy after pushing to `main`:

```bash
sshpass -p 'YOUR_ROOT_PASSWORD' ssh root@2.25.210.178 'bash /var/www/prysymtv/infra/vps/deploy.sh'
```

Or copy `infra/vps/deploy.sh` to the server and run as root.
