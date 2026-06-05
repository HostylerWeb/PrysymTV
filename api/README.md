# Prysym TV API (NestJS)

## Prerequisites

- Node.js 20+
- Docker (Postgres + Redis)

## Quick start

```bash
# From repo root
docker compose up -d

cd api
cp ../.env.example .env   # or use api/.env (already configured for port 5433)
npm install
npm run db:migrate
npm run db:seed
npm run start:dev
```

API: http://localhost:4000/api/v1  
Health: http://localhost:4000/api/v1/health

## Test auth

```bash
curl -s -X POST http://localhost:4000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@prysym.tv","username":"demo_user","password":"password12345","displayName":"Demo"}' | jq

# Use accessToken from response:
curl -s http://localhost:4000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" | jq
```

## Stack

- **Prisma 7** — `prisma.config.ts` holds `DATABASE_URL`; runtime uses `@prisma/adapter-pg` + `pg` (see `src/prisma/prisma.service.ts`)
- **TypeScript 6**, **NestJS 11**

Run guide (frontend + Docker + env): `../guides-md-files/how-to-run.md`

## Docs

- Full API reference: `../guides-md-files/api.md`
- Backend plan: `../guides-md-files/backend-development-plan.md`
- Stakeholder / mission requirements (GAF, splits, 14 modules): `../guides-md-files/stakeholder-product-requirements.md`

## Implementation status

Canonical route list: `../guides-md-files/api.md` (updated with each API change).

| Area | Status |
|------|--------|
| Auth, password reset, users, follow | ✅ |
| Videos, shorts, movies, comments, likes, dislikes, saves, views | ✅ |
| Podcasts, verticals, playlists, history | ✅ |
| Live streams, MediaMTX, Socket.IO chat | ✅ |
| Billing, coins, premium, gifts, memberships, payouts | ✅ |
| Search, ads, analytics, reports | ✅ |
| Engagement hydration (optional JWT on detail/feed routes) | ✅ Backend + frontend |
| Admin `/admin/*` | ✅ API; no admin UI yet |
| OAuth Google/Apple | 📋 Planned |
| Programs hub frontend | 📋 API only |

**Production:** `npm run build` then `npm run start:prod` (`node dist/src/main.js`). After schema changes: `npx prisma migrate deploy`.

**Do not start with the admin dashboard UI** — API routes exist; moderation UI is Sprint H.
