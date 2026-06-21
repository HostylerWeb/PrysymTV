# How to Run Prysym TV (Frontend + Backend)

This guide covers local development on Linux/macOS/WSL. You need **Node.js 20+**, **Docker**, and either **npm** (API) or **pnpm** (frontend).

---

## Overview

| Service | Folder | URL (default) | Purpose |
|---------|--------|---------------|---------|
| PostgreSQL | Docker | `localhost:5433` | Main database |
| Redis | Docker | `localhost:6380` | Cache / queues (BullMQ video jobs) |
| **MediaMTX** | Docker (`infra/`) | RTMP `localhost:1935`, HLS `localhost:8888` | Live ingest (OBS → HLS) |
| **API** (NestJS) | `api/` | http://localhost:4000/api/v1 | Backend REST API |
| **Frontend** (Next.js) | project root | http://localhost:3001 | Web app UI |

Ports **5433** and **6380** avoid conflicts if you already run Postgres/Redis on the default ports.

**Product scope (stakeholder):** Full mission requirements (GAF, revenue splits, Creator Store, Impact Dashboard, content verticals, 14 backend modules) are documented in [`stakeholder-product-requirements.md`](./stakeholder-product-requirements.md) and integrated into [`backend-development-plan.md`](./backend-development-plan.md) Section 15.

---

## 1. One-time setup

### Clone and install

```bash
cd /path/to/PrysymTV

# Frontend dependencies (pnpm — see packageManager in package.json)
pnpm install

# API dependencies
cd api
npm install
cd ..
```

### Environment files

**API** — copy and edit `api/.env` (or create from root `.env.example`):

```env
DATABASE_URL=postgresql://prysym:prysym_dev_password@localhost:5433/prysymtv?schema=public
REDIS_URL=redis://localhost:6380
JWT_ACCESS_SECRET=change-me-use-openssl-rand-base64-32-min-32-chars
JWT_REFRESH_SECRET=change-me-another-secret-min-32-chars-long
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
API_PORT=4000
CORS_ORIGIN=http://localhost:3001
NODE_ENV=development
```

Generate strong secrets (example):

```bash
openssl rand -base64 32
```

**Frontend** — create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

**API email (password reset)** — add to `api/.env` (never commit):

```env
FRONTEND_URL=http://localhost:3001
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=your-smtp-user
```

### Start database containers

From the **repo root**:

```bash
docker compose up -d
docker compose ps   # postgres + redis should be "healthy"; mediamtx should be "running"
```

**Streamer approval (dev):** set `AUTO_APPROVE_STREAMER=true` in `api/.env`. New applications are approved immediately; existing `pending` users are upgraded on the next `GET /users/me` (refresh profile). Production will use the admin dashboard later.

### Prepare the database (first time only)

```bash
cd api
npm run db:migrate    # Prisma migrations (economy, verticals, engagement_gaps, etc.)
npm run db:seed       # gifts, coins, revenue split rules, GAF programs
npm run db:generate   # run after schema changes
cd ..
```

---

## 2. Run the backend (API)

**Terminal 1** — from `api/`:

```bash
cd api
npm run start:dev
```

You should see:

```text
Prysym API listening on http://localhost:4000/api/v1
```

### Quick API checks

```bash
# Health
curl http://localhost:4000/api/v1/health

# Register a test user
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","username":"myuser","password":"password12345","displayName":"My Name"}'

# Coin packages & gifts (no auth)
curl http://localhost:4000/api/v1/billing/products
curl http://localhost:4000/api/v1/billing/gifts/catalog
```

Use the `accessToken` from register/login with:

```bash
curl http://localhost:4000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Other API commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Dev server with hot reload |
| `npm run build` | Production build → `dist/` |
| `npm run start:prod` | Run built app |
| `npm run lint` | ESLint |
| `npm run db:studio` | Prisma Studio (DB browser) |
| `npm run db:migrate` | Create/apply migrations after schema changes |

Full endpoint reference: [api.md](./api.md)

---

## 3. Run the frontend (Next.js)

**Terminal 2** — from **repo root** (not `api/`):

```bash
pnpm dev
```

Default URL: **http://localhost:3001** (Next.js may pick 3000 if free; check terminal output).

Set `NEXT_PUBLIC_API_URL` in `.env.local` so the UI talks to the API (auth, feed, uploads, billing). Some screens still fall back to mocks when the API is unreachable — see [backend-development-plan.md](./backend-development-plan.md) Section 14.

### Other frontend commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Development server |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm lint` | Lint |

---

## 4. Daily workflow (two terminals)

```text
Terminal A (repo root):  docker compose up -d
Terminal B (api/):       npm run start:dev
Terminal C (repo root):  pnpm dev
```

Open http://localhost:3001 in the browser.

---

## 5. Stopping services

```bash
# Stop API / frontend: Ctrl+C in each terminal

# Stop databases (keeps data in Docker volumes)
docker compose down

# Stop and DELETE all DB data (reset)
docker compose down -v
```

After `-v`, run `npm run db:migrate` and `npm run db:seed` again in `api/`.

---

## 6. Troubleshooting

### Port already in use

| Symptom | Fix |
|---------|-----|
| API won't start on 4000 | Change `API_PORT` in `api/.env` and `NEXT_PUBLIC_API_URL` in `.env.local` |
| Postgres won't start | Port 5432 busy → we use **5433** in `docker-compose.yml` |
| Frontend on wrong port | Run `pnpm dev -- -p 3001` or free port 3000 |

### API: database connection failed

1. `docker compose ps` — is `prysymtv-postgres` healthy?
2. `DATABASE_URL` host port must be **5433** (not 5432) unless you changed compose.
3. Run migrations: `cd api && npm run db:migrate`

### Password reset: “Check your email” but nothing arrives

1. **Restart the API** after changing `api/.env` (`Ctrl+C`, then `npm run start:dev`). An old process will not load SMTP or the mail module.
2. Use an email that is **registered** (sign up first). Unknown emails get the same success message but **no email** (on purpose).
3. On API start you should see: `SMTP connection verified`. If you see `SMTP verification failed`, fix `SMTP_*` in `api/.env`.
4. Check spam; reset is sent from `SMTP_FROM` (e.g. `support@hostyler.com`).
5. In development, if send fails, the API terminal prints the full reset link.

### CORS errors from browser

Set `CORS_ORIGIN=http://localhost:3001` in `api/.env` (match your frontend URL exactly).

### Live streaming (MediaMTX + OBS)

MediaMTX is included in `docker compose up -d`. It receives RTMP from OBS and serves HLS to the browser. The API validates stream keys and receives webhooks when a publisher goes live.

#### 1. Start / rebuild MediaMTX

The compose service builds a custom image (`prysymtv-mediamtx:local`) from `infra/Dockerfile.mediamtx` — it extends the official MediaMTX image with **curl**, which is required for `runOnReady` / `runOnNotReady` webhooks to the API.

```bash
# From repo root — first time or after infra/Dockerfile.mediamtx changes:
docker compose build mediamtx
docker compose up -d mediamtx

# Check container is up
docker compose ps mediamtx
docker logs prysymtv-mediamtx --tail 30
```

| Port | Protocol | Purpose |
|------|----------|---------|
| `1935` | RTMP | OBS / encoder ingest (`rtmp://localhost:1935/live`) |
| `8888` | HTTP | LL-HLS fallback (`http://localhost:8888/live/{streamKey}/index.m3u8`) |
| `8889` | HTTP | **WebRTC** playback (`http://localhost:8889/live/{streamKey}/whep`) — used on `/live/[id]` (~1s delay) |
| `9997` | HTTP | MediaMTX control API (end-stream / kick publisher) |

Config file: `infra/mediamtx.yml` (mounted read-only into the container).

#### 2. API environment

Add to `api/.env` (restart API after changes):

```env
RTMP_INGEST_URL=rtmp://localhost:1935/live
MEDIAMTX_HLS_PUBLIC_URL=http://localhost:8888
MEDIAMTX_WEBRTC_PUBLIC_URL=http://localhost:8889
MEDIAMTX_API_URL=http://localhost:9997
```

The API must run on the **host** (not inside Docker) so MediaMTX can reach it at `host.docker.internal:4000` for auth and webhooks.

#### 3. Go Live workflow

1. Approve streamer access (`AUTO_APPROVE_STREAMER=true` in dev, or admin approves application).
2. In the app: **Profile → Settings → Go Live** → generate a stream key (creates a `scheduled` stream row).
3. In **OBS** (or any RTMP publisher):
   - **Server:** `rtmp://localhost:1935/live`
   - **Stream key:** the key shown in Go Live (not the stream UUID).
4. Start streaming in OBS. MediaMTX calls `POST /streams/webhooks/ready`; the API sets `status: live` and `hlsPlaybackUrl`.
5. Open the live page (`/live/{streamId}` from Go Live). HLS URL pattern:  
   `http://localhost:8888/live/{streamKey}/index.m3u8`
6. **End stream:** on your own live page, use **End stream** (disconnects OBS and tells all viewers the broadcast ended).

**Low delay:** The live watch page uses **WebRTC** (`:8889`) first (~1s delay), with LL-HLS as fallback. In OBS → **Settings → Output**, set **Keyframe Interval** to **1** or **2** seconds and encoder profile **baseline** (helps WebRTC). Restart MediaMTX after config changes: `docker compose restart mediamtx`, then reconnect OBS.

**Health check:** `GET /streams/ingest/health` — reports whether MediaMTX RTMP/HLS ports respond. The Go Live panel shows this in dev.

#### 4. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| OBS “Failed to connect” | MediaMTX not running | `docker compose up -d mediamtx` |
| OBS connects but `/live/...` says offline | Webhook never reached API | Rebuild image: `docker compose build mediamtx && docker compose up -d mediamtx`. Check logs for `curl: executable file not found` — fixed by custom Dockerfile. |
| OBS connects, still offline | API not on port 4000 | Start `npm run start:dev` in `api/` |
| Wrong stream / auth rejected | Reused or expired key | Generate a **new** key in Go Live for each broadcast |
| HLS works in VLC but not browser | CORS / mixed content | Use `http://localhost:8888` in dev; ensure `MEDIAMTX_HLS_PUBLIC_URL` matches |

If webhooks fail, the API also polls HLS when you load `GET /streams/:id` and can mark the stream live when the playlist exists (fallback for local dev).

### Prisma / schema changes

The API uses **Prisma 7** with `api/prisma.config.ts` (database URL lives there, not in `schema.prisma`).

```bash
cd api
# edit prisma/schema.prisma, then:
npm run db:migrate
npm run db:generate   # if client types are stale
```

Ensure `api/.env` defines `DATABASE_URL` before any Prisma CLI command.

---

## 7. Video uploads (R2 + FFmpeg)

Creators upload from **Profile → Settings → Your Videos → Upload**. Flow:

1. `POST /videos/upload/init` (Bearer) → `uploadUrl`, `objectKey`, `videoId`
2. Browser **PUT** file to R2 (presigned) or **POST** multipart to `/media/upload/:videoId` (local only)
3. `POST /videos/upload/complete` → BullMQ transcodes and sets `status: ready`

### Prerequisites

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

ffmpeg -version
ffprobe -version
```

Redis must be running (`docker compose up -d`). Set in `api/.env`:

```env
VIDEO_PROCESSING_MODE=ffmpeg
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
REDIS_URL=redis://localhost:6380
```

### Local dev (`STORAGE_DRIVER=local`)

Default in `api/.env`. Files land under `api/storage/` and are served at  
`http://localhost:4000/api/v1/media/files/...`.

### Cloudflare R2 (`STORAGE_DRIVER=s3`)

1. Create an R2 bucket and API token (Object Read & Write).
2. Enable **public access** via custom domain or R2.dev subdomain for `S3_PUBLIC_BASE_URL`.
3. CORS on the bucket (allow `PUT` from your frontend origin):

```json
[
  {
    "AllowedOrigins": ["http://localhost:3001", "https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

4. In `api/.env`:

```env
STORAGE_DRIVER=s3
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=your-bucket
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://pub-xxxx.r2.dev
VIDEO_PROCESSING_MODE=ffmpeg
```

5. Restart API. Uploads use presigned PUT; processing writes HLS under `uploads/hls/{videoId}/` and thumbnails under `uploads/thumbnails/`.

### Processing modes

| Mode | Use when |
|------|----------|
| `ffmpeg` | Production — HLS ladder, real thumbnail, `durationSeconds` |
| `skip` | Fast dev without transcode (raw MP4 URL as playback) |

---

## 8. Stack versions

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js **16.2.6**, React **19.2.6**, TypeScript **6**, Tailwind **4.3** |
| **API** | NestJS **11**, Prisma **7** (`prisma.config.ts` + `@prisma/adapter-pg`), TypeScript **6** |

Check for known CVEs after dependency changes:

```bash
pnpm audit          # repo root (frontend)
cd api && npm audit # API (Prisma CLI may show dev-only advisories — do not use audit fix --force)
```

**Charts:** `recharts` was removed (unused). Re-add with `pnpm dlx shadcn@latest add chart` when the creator dashboard needs graphs.

---

## 9. Production notes (later)

- Use strong `JWT_*_SECRET` values and HTTPS.
- Set `NODE_ENV=production` on the API (secure cookies).
- Host Postgres/Redis managed (Neon, Upstash, etc.) — update `DATABASE_URL` / `REDIS_URL`.
- Deploy API and frontend separately; point `NEXT_PUBLIC_API_URL` at your public API domain.
- **API rate limit** — default 1000 req/min **per IP**; raise with `THROTTLE_LIMIT` / `THROTTLE_TTL_MS` in `api/.env`. See [security-checklist.md](./security-checklist.md#api-rate-limit-quota).

---

## Related docs

- [security-checklist.md](./security-checklist.md) — audits, prod requirements, known dev-only risks
- [vps-production.md](./vps-production.md) — fresh VPS bootstrap (Docker, nginx, TLS, firewall)
- [api.md](./api.md) — REST API reference (mobile + web)
- [backend-development-plan.md](./backend-development-plan.md) — full backend roadmap
