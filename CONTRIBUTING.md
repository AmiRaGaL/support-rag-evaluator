# Contributing

Thanks for helping improve Support RAG Evaluator. This project is a portfolio-grade full-stack RAG evaluator, so changes should stay small, reviewable, and grounded in the existing NestJS/Next.js/Prisma structure.

## Local Setup

Start Postgres with pgvector:

```bash
docker compose up -d postgres
```

Configure the API from `apps/api/.env.example`:

```bash
DATABASE_URL="postgresql://support_rag_user:support_rag_password@localhost:5433/support_rag_dev?schema=public"
PORT=3001
LLM_PROVIDER=deterministic
```

Run API migrations and start the API:

```bash
cd apps/api
npm install
npx prisma migrate dev
npm run start:dev
```

Start the web dashboard in another terminal:

```bash
cd apps/web
npm install
npm run dev
```

Open the dashboard at `http://localhost:3000` and API docs at `http://localhost:3001/docs`.

## Common Commands

API commands from `apps/api`:

```bash
npm run lint
npm run test
npm run build
npx prisma migrate dev
npm run prisma:migrate:deploy
```

Web commands from `apps/web`:

```bash
npm run lint
npm run build
```

Full-stack Docker demo from the repository root:

```bash
docker compose up --build -d
docker compose --profile tools run --rm api-migrate
```

## Repository Structure

```text
apps/api          NestJS API, Prisma schema, migrations, tests
apps/web          Next.js dashboard
datasets          Sample support docs and baseline eval dataset
docs              Architecture, demo, evaluation, roadmap, and asset guidance
docker-compose.yml Full-stack local demo
```

## Development Notes

- Use the deterministic provider by default; it requires no API key and keeps local/CI behavior repeatable.
- Groq is optional for local experimentation. Keep `GROQ_API_KEY` and other secrets out of git.
- Add or update tests for meaningful API behavior changes.
- Keep `.env.example` files updated when adding environment variables.
- Do not claim production deployment or auth unless those features are implemented.
