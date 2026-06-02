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

| Week | Focus | Status |
|------|--------|--------|
| 1 | Auth, users, schema | ✅ Core done |
| 2 | Uploads, storage, FFmpeg queue | ✅ Core (local/R2 env-driven) |
| 11–20 | Economy, Store, GAF, Impact, Insider | 📋 See stakeholder doc |
| 3 | Videos, comments, playlists | 🚧 Stubs |
| 4 | Live streaming | 🚧 Stubs |
| 5 | Billing, gifts | Partial (catalog) |
| 6+ | Search, ads, admin | 🚧 Stubs |

**Do not start with the admin dashboard** — finish auth + content APIs first; admin requires `role: admin` users and moderation workflows.
