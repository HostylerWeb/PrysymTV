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
- **Rate limits** — global 120/min; auth routes stricter (login 10/min, register 5/min)  
- **Helmet** security headers; `X-Powered-By` disabled  
- **CORS** — explicit `CORS_ORIGIN` (comma-separated for multiple origins)  
- **Validation** — `whitelist` + `forbidNonWhitelisted` on all DTOs  
- **JWT secrets** — min 32 chars; **placeholder secrets blocked in production** (`env.validation.ts`)  
- **Prisma errors** — generic messages (no raw DB leaks)  
- **Password reset** — tokens hashed in DB; reset token **never** returned in HTTP (dev logs to server console only)  
- **`.env`** — gitignored under `api/.gitignore` and repo root `.gitignore`

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
- [api.md](./api.md) — REST reference  
