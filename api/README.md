# Prysym TV API (NestJS)

Quick start — full docs: **[`../docs/api/README.md`](../docs/api/README.md)**

```bash
# From repo root
docker compose up -d

cd api
cp ../.env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run start:dev
```

API: http://localhost:4000/api/v1

| Doc | Path |
|-----|------|
| API reference | [`docs/api/api.md`](../docs/api/api.md) |
| Run guide (Docker, web, env) | [`docs/web/how-to-run.md`](../docs/web/how-to-run.md) |
| Backend roadmap | [`docs/api/backend-development-plan.md`](../docs/api/backend-development-plan.md) |
| All docs index | [`docs/README.md`](../docs/README.md) |
