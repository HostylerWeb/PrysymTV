# Prysym TV — Security Checklist

No app is “100% exploit-proof.” This checklist tracks what is **done**, what is **dev-only**, and what you must do **before production**.

---

## Dependency audits (run after every upgrade)

```bash
pnpm audit              # frontend — target: 0 vulnerabilities
cd api && npm audit     # API runtime — target: 0
```

| Finding | Action |
|---------|--------|
| Frontend `pnpm audit` clean | Keep Next/React patched (`≥16.2.6`) |
| API `npm audit` clean | Patched via `api/package.json` → `overrides["@hono/node-server"]` (Prisma 7 CLI). **Never** run `npm audit fix --force` in `api/` — it downgrades Prisma to 6.x. |

---

## Already in place (API)

- **Argon2** password hashing  
- **JWT access** (Bearer) + **refresh** in HttpOnly cookie (`/api/v1/auth`, `Secure` + `SameSite=strict` in production)  
- **Rate limits** — **per client IP** (not a shared global cap): default **1000 req / 60s**; auth routes stricter (see below)  
- **Helmet** security headers; `X-Powered-By` disabled  
- **CORS** — explicit `CORS_ORIGIN` (comma-separated for multiple origins)  
- **Validation** — `whitelist` + `forbidNonWhitelisted` on all DTOs  
- **JWT secrets** — min 32 chars; **placeholder secrets blocked in production** (`env.validation.ts`)  
- **Prisma errors** — generic messages (no raw DB leaks)  
- **Password reset** — tokens hashed in DB; reset token **never** returned in HTTP (dev logs to server console only)  
- **`.env`** — gitignored under `api/.gitignore` and repo root `.gitignore`

---

## API rate limit (quota)

The API uses `@nestjs/throttler`. Limits apply **per client IP address** — 200 active users do **not** share one bucket; each browser/IP gets its own quota.

### Defaults

| Scope | Limit | Where |
|-------|-------|--------|
| Most HTTP routes | **1000 requests / 60 seconds / IP** | `api/src/app.module.ts` |
| Register | 5 / min / IP | `api/src/auth/auth.controller.ts` |
| Login | 10 / min / IP | same |
| Forgot / reset password | 5 / min / IP | same |
| Refresh token | 30 / min / IP | same |

### Increase the general API quota

1. Edit **`api/.env`** (restart API after saving):

```env
# Window length in milliseconds (default 60000 = 1 minute)
THROTTLE_TTL_MS=60000

# Max HTTP requests per IP per window (default 1000)
THROTTLE_LIMIT=2000
```

2. **Production:** set the same vars on your host (Railway, Fly, Docker, etc.) — they are optional; omit to keep defaults.

3. **Auth routes** — to loosen login/register caps, edit `@Throttle({ ... })` on `api/src/auth/auth.controller.ts` (keep auth stricter than the global limit to reduce brute-force risk).

4. **Behind a reverse proxy** — ensure the API sees the real client IP (`trust proxy` / `X-Forwarded-For`) or many users behind one NAT will share one bucket.

### When users hit 429 Too Many Requests

- Symptom: API returns **429**; frontend may show generic errors on burst traffic (feeds, polling, uploads).
- Fix: raise `THROTTLE_LIMIT` or widen `THROTTLE_TTL_MS` (e.g. 2000 req / 60s).
- Do **not** disable throttling in production without another layer (Cloudflare, nginx `limit_req`, etc.).

Implementation: `ThrottlerModule.forRootAsync` in `api/src/app.module.ts`; optional env validation in `api/src/config/env.validation.ts`.

---

## Dev-only (OK locally, fix before prod)

| Item | Risk if copied to prod |
|------|-------------------------|
| Docker Postgres password `prysym_dev_password` | Full DB compromise |
| Redis without password on `6380` | Cache/session abuse |
| `NODE_ENV=development` | Weaker cookies, dev reset logs |
| Frontend **mock auth** (`localStorage`, any password works) | No real security until API wired |
| Stub public endpoints (`/feed/*`, etc.) | Empty data today; lock down when implemented |

---

## Before production (required)

1. **Secrets** — `openssl rand -base64 32` for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`; managed DB URL; never commit `.env`.  
2. **`NODE_ENV=production`** on API — enables `Secure` cookies and strict SameSite.  
3. **HTTPS** everywhere — API + frontend; HSTS at reverse proxy (Caddy, nginx, Cloudflare).  
4. **CORS** — set `CORS_ORIGIN` to your real frontend origin(s) only.  
5. **Database** — managed Postgres (Neon, RDS, etc.); strong password; no public port.  
6. **Redis** — password/TLS (Upstash, ElastiCache, etc.).  
7. **Wire frontend auth** — stop mock `localStorage` login; use API tokens + HttpOnly refresh cookie flow.  
8. **Email** — send password reset links via Resend/SendGrid; remove console token logging or gate behind explicit dev flag.  
9. **File uploads** (when built) — virus scan, size limits, signed URLs, private buckets.  
10. **Admin routes** — only `role: admin` users; audit log for moderation actions.  
11. **Monitoring** — Sentry/Datadog, failed login alerts, dependency Dependabot/Renovate.

---

## Frontend (current gaps until integration)

- Auth is **mock** — not a vulnerability in the API, but **not safe for real users** yet.  
- Prefer **`next/image`** over raw `<img>` for external URLs (lint warnings).  
- When live: CSP headers from Next/hosting; sanitize any user-generated HTML.  
- Do not store **refresh tokens** in `localStorage` — use HttpOnly cookies from API.

---

## Quick verification

```bash
# API starts only with valid env
cd api && npm run build && npm run start:prod

# Health (no secrets)
curl -s http://localhost:4000/api/v1/health

# Forgot-password must NOT include a token in JSON
curl -s -X POST http://localhost:4000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' | jq
```

---

## Related docs

- [how-to-run.md](./how-to-run.md) — local setup  
- [api.md](../api/api.md — REST reference  
