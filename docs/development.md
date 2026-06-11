# Development Guide

This guide collects the day-to-day commands for working on Support RAG Evaluator.

## Repository Structure

```text
apps/api
  NestJS API, Prisma schema, migrations, OpenAPI setup, and Jest tests.

apps/web
  Next.js dashboard for setup actions, chat, query logs, and eval runs.

datasets
  Bundled markdown support docs and baseline eval cases.

docs
  Architecture, demo script, evaluation notes, roadmap, and screenshot guidance.

docker-compose.yml
  Local Postgres/pgvector, API, dashboard, and migration tool services.
```

## API

Run these commands from `apps/api`.

```bash
npm install
npm run lint
npm run test
npm run build
```

Start local API development:

```bash
docker compose up -d postgres
cd apps/api
npx prisma migrate dev
npm run start:dev
```

Prisma migration commands:

```bash
npx prisma migrate dev
npm run prisma:migrate:deploy
```

Use `npx prisma migrate dev` for local development against the local database. Use `npm run prisma:migrate:deploy` for applying existing migrations in the Docker Compose migration container or deployment-like environments.

## Web

Run these commands from `apps/web`.

```bash
npm install
npm run lint
npm run build
npm run dev
```

The dashboard defaults to `http://localhost:3001` for the API. For local overrides, use `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001
```

## Docker Compose

Run the full demo from the repository root:

```bash
docker compose up --build -d
docker compose --profile tools run --rm api-migrate
```

Open:

- Dashboard: `http://localhost:3000`
- API docs: `http://localhost:3001/docs`
- API health: `http://localhost:3001/health`
- Postgres host port: `5433`

## Environment And Secrets

- Use `.env.example` files as templates.
- Do not commit real `.env` files, API keys, or secrets.
- Keep `LLM_PROVIDER=deterministic` for normal local development and CI-safe behavior.
- Set `LLM_PROVIDER=groq` only when intentionally testing Groq with a local `GROQ_API_KEY`.

## Before Opening A PR

- Run API lint/test/build when API code changes.
- Run web lint/build when web code changes.
- For documentation-only changes, run the checks requested by the task or PR template.
- Keep documentation aligned with real scripts, ports, and implemented behavior.
