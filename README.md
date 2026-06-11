# Support RAG Evaluator

Support RAG Evaluator is an eval-driven RAG support assistant that answers from support documentation, returns grounded answers with citations, logs retrieval/query metadata, persists evaluation runs, and exposes the workflow through a full-stack dashboard.

## Features

- Markdown document ingestion for sample support documentation.
- PostgreSQL + pgvector retrieval over embedded document chunks.
- Grounded chat responses with citations and refusal behavior for unsupported questions.
- Deterministic CI-safe LLM provider by default, with no API key required.
- Optional Groq provider for local experimentation.
- Query logging for prompts, answers, retrieved chunks, citations, refusal status, latency, and evaluation metadata.
- Persisted baseline eval runs with aggregate metrics and per-case results.
- OpenAPI documentation through Swagger UI.
- Next.js dashboard for setup actions, chat, query logs, and eval runs.
- Docker Compose full-stack demo with Postgres, API, and web dashboard.

## Tech Stack

- Backend: NestJS, TypeScript
- Frontend: Next.js, React, TypeScript
- Database: PostgreSQL with pgvector
- ORM: Prisma
- API docs: OpenAPI / Swagger UI
- Local orchestration: Docker Compose
- LLM providers: deterministic default provider, optional Groq OpenAI-compatible provider
- Testing: Jest for the API, ESLint for API and web

## System Architecture

```text
User
  -> Next.js dashboard (apps/web)
  -> NestJS API (apps/api)
  -> ingestion, retrieval, chat, query-log, and eval modules
  -> Prisma
  -> PostgreSQL + pgvector
```

The API ingests markdown support docs, chunks and embeds them, retrieves relevant chunks with pgvector, builds grounded answers from retrieved context, attaches citations, logs each query, and stores eval run summaries/results. The dashboard provides a portfolio-friendly UI for exercising those flows.

## Documentation

- [Architecture](docs/architecture.md)
- [Demo script](docs/demo-script.md)
- [Screenshot checklist](docs/screenshots.md)
- [Roadmap and limitations](docs/roadmap.md)
- [Contributing](CONTRIBUTING.md)
- [Development guide](docs/development.md)

## Local Quickstart

Start Postgres:

```bash
docker compose up -d postgres
```

Create `apps/api/.env` from the example values:

```bash
DATABASE_URL="postgresql://support_rag_user:support_rag_password@localhost:5433/support_rag_dev?schema=public"
PORT=3001
LLM_PROVIDER=deterministic
```

Run the API:

```bash
cd apps/api
npm install
npx prisma migrate dev
npm run start:dev
```

Run the dashboard in another terminal:

```bash
cd apps/web
npm install
npm run dev
```

Open:

- Dashboard: `http://localhost:3000`
- API docs: `http://localhost:3001/docs`
- API health: `http://localhost:3001/health`
- Postgres: `localhost:5433`

For local dashboard configuration, create `apps/web/.env.local` if needed:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001
```

## Docker Compose Quickstart

Run the full demo stack:

```bash
docker compose up --build -d
docker compose --profile tools run --rm api-migrate
```

Open:

- Dashboard: `http://localhost:3000`
- API docs: `http://localhost:3001/docs`
- API base URL: `http://localhost:3001`

Compose runs Postgres with pgvector, the NestJS API, and the Next.js dashboard. Migrations are explicit through the `api-migrate` tool profile and are not run automatically by the API container.

The Compose API service uses `LLM_PROVIDER=deterministic` by default, so no API key is required. To try Groq locally, set `LLM_PROVIDER=groq` and provide `GROQ_API_KEY` in your local environment. Do not commit real API keys or local `.env` files.

Demo flow:

1. Open the dashboard.
2. Click **Ingest sample docs**.
3. Click **Embed missing chunks**.
4. Ask a grounded support question such as "Can I export billing history?"
5. Inspect Query Logs for retrieval metadata, citations, latency, and refusal behavior.
6. Run the baseline eval and review Eval Runs.

## API Endpoint Summary

- `GET /health` - API health check.
- `POST /ingestion/sample-docs` - ingest bundled sample markdown docs.
- `POST /retrieval/embed-missing` - create embeddings for chunks that do not have them.
- `POST /retrieval/search` - search embedded support docs.
- `GET /retrieval/search` - search support docs with query parameters.
- `POST /chat` - ask a grounded support question and receive answer/citation metadata.
- `GET /query-logs` - list recent query logs.
- `GET /query-logs/:id` - inspect a single query log.
- `GET /evals/runs` - list persisted eval runs.
- `GET /evals/runs/:id` - inspect eval run metrics and case results.
- `POST /evals/run-baseline` - run the baseline evaluation suite.
- `GET /docs` - Swagger UI / OpenAPI documentation.

## Dashboard Overview

The Next.js dashboard lives in `apps/web` and focuses on the main support RAG workflow:

- Overview: API health, setup actions, and workflow links.
- Chat: grounded question form with answer, citations, and retrieval metadata.
- Query Logs: recent logs plus detail views for answers, citations, retrieval, latency, and refusal status.
- Eval Runs: baseline eval trigger, run history, aggregate metrics, and per-case results.

Dashboard actions are user-triggered. The app does not ingest docs, embed chunks, or run evals automatically on page load.

For portfolio capture guidance, see the screenshot checklist in [docs/screenshots.md](docs/screenshots.md).

## Evaluation

The project includes a persisted baseline eval workflow for checking RAG behavior over known support cases. Eval runs track aggregate and per-case signals such as:

- Retrieval quality
- Answer quality
- Citation faithfulness
- Refusal behavior
- Latency metadata

The deterministic provider keeps evals repeatable and CI-safe. Groq can be enabled locally for experimentation, but it is optional and not required for the default demo or tests.

## Portfolio Highlights

- Full-stack AI product surface: API, database, retrieval layer, evaluation workflow, and dashboard.
- Grounding-first behavior: answers are tied to retrieved support docs and citations instead of open-ended chatbot output.
- Operational observability: query logs capture retrieved context, answer metadata, latency, and refusal behavior for inspection.
- Evaluation discipline: persisted eval runs make quality measurable across retrieval, answer, citation, and refusal behavior.
- Production-minded local demo: Docker Compose starts the app stack with explicit migrations and safe default providers, without requiring secrets.

## Notes

- Roadmap and known limitations are documented in [docs/roadmap.md](docs/roadmap.md).
- Production deployment is not included.
- Authentication is not implemented.
- Real API keys and local secrets should stay out of git.
