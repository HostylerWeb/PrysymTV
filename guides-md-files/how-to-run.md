# How to Run Prysym TV (Frontend + Backend)

This guide covers local development on Linux/macOS/WSL. You need **Node.js 20+**, **Docker**, and either **npm** (API) or **pnpm** (frontend).

---

## Overview

| Service | Folder | URL (default) | Purpose |
|---------|--------|---------------|---------|
| PostgreSQL | Docker | `localhost:5433` | Main database |
| Redis | Docker | `localhost:6380` | Cache / queues (future) |
| **API** (NestJS) | `api/` | http://localhost:4000/api/v1 | Backend REST API |
| **Frontend** (Next.js) | project root | http://localhost:3001 | Web app UI |

Ports **5433** and **6380** avoid conflicts if you already run Postgres/Redis on the default ports.

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

### Start database containers

From the **repo root**:

```bash
docker compose up -d
docker compose ps   # postgres + redis should be "healthy"
```

### Prepare the database (first time only)

```bash
cd api
npm run db:migrate    # applies Prisma migrations
npm run db:seed       # gift catalog + coin packages
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

The UI still uses **mock data** until you wire `NEXT_PUBLIC_API_URL` in the app code. Auth and API integration are documented in [backend-development-plan.md](./backend-development-plan.md) Section 14.

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

### CORS errors from browser

Set `CORS_ORIGIN=http://localhost:3001` in `api/.env` (match your frontend URL exactly).

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

## 7. Production notes (later)

- Use strong `JWT_*_SECRET` values and HTTPS.
- Set `NODE_ENV=production` on the API (secure cookies).
- Host Postgres/Redis managed (Neon, Upstash, etc.) — update `DATABASE_URL` / `REDIS_URL`.
- Deploy API and frontend separately; point `NEXT_PUBLIC_API_URL` at your public API domain.

---

## Related docs

- [security-checklist.md](./security-checklist.md) — audits, prod requirements, known dev-only risks
- [api.md](./api.md) — REST API reference (mobile + web)
- [backend-development-plan.md](./backend-development-plan.md) — full backend roadmap
