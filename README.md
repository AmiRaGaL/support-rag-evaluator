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
- Eval analytics dashboard with recent-run trend summaries.
- Stable non-streaming chat plus streaming chat support.
- Generated-style typed API client support for the web dashboard.
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
- Embedding providers: deterministic default provider, optional OpenAI-compatible provider
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
- [Deployment readiness](docs/deployment.md)
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

## Embedding Providers

Deterministic embeddings are the default. They are stable, local, and useful for demos, tests, and CI because they do not require external API keys or network calls.

Real embeddings can be enabled through API environment variables:

| Variable | Notes |
| --- | --- |
| `EMBEDDING_PROVIDER` | Defaults to `deterministic`. Set to `openai` for the implemented OpenAI-compatible provider. |
| `EMBEDDING_API_KEY` | Required only when `EMBEDDING_PROVIDER=openai`. Store real keys in local or managed secrets, never in git. |
| `EMBEDDING_MODEL` | Optional model override for the real provider. The default is suitable for the current 1536-dimensional schema. |
| `EMBEDDING_DIMENSIONS` | Must match the pgvector column dimension, currently `1536` for `DocumentChunk.embedding vector(1536)`. |
| `EMBEDDING_BASE_URL` | Optional OpenAI-compatible base URL override, if using a compatible endpoint. |

Changing embedding providers usually requires re-embedding documents so stored chunk vectors and query vectors come from the same embedding space.

Re-embedding workflow:

1. Configure the embedding provider environment variables.
2. Run migrations if the database schema changed.
3. Ingest sample docs if chunks are missing.
4. Run `POST /retrieval/embed-missing` from Swagger or the dashboard setup action.
5. Test `POST /retrieval/search` with a known support question.
6. Test `POST /chat` and inspect citations and retrieved chunks.

Troubleshooting:

- Missing API key: `EMBEDDING_API_KEY` is required only for `EMBEDDING_PROVIDER=openai`.
- Dimension mismatch: keep `EMBEDDING_DIMENSIONS` aligned with `DocumentChunk.embedding vector(1536)`, or migrate the pgvector column before changing dimensions.
- No retrieved chunks: ingest docs, run embed-missing, and confirm existing chunks were embedded with the same provider now used for queries.
- Provider accidentally set in CI: leave `EMBEDDING_PROVIDER` unset or set it to `deterministic`; CI should not need external keys.
- External provider unavailable: switch back to deterministic for local demos/CI, or retry once the provider is healthy.

## API Endpoint Summary

- `GET /health` - API health check.
- `POST /ingestion/sample-docs` - ingest bundled sample markdown docs.
- `POST /retrieval/embed-missing` - create embeddings for chunks that do not have them.
- `POST /retrieval/search` - search embedded support docs.
- `GET /retrieval/search` - search support docs with query parameters.
- `POST /chat` - stable non-streaming chat endpoint for grounded answers, citations, and refusals.
- `POST /chat/stream` - streaming chat endpoint that emits answer text incrementally and finishes with response metadata.
- `GET /query-logs` - list recent query logs.
- `GET /query-logs/:id` - inspect a single query log.
- `GET /evals/runs` - list persisted eval runs.
- `GET /evals/runs/:id` - inspect eval run metrics and case results.
- `POST /evals/run-baseline` - run the baseline evaluation suite.
- `GET /docs` - Swagger UI / OpenAPI documentation.

## Dashboard Overview

The Next.js dashboard lives in `apps/web` and focuses on the main support RAG workflow:

- Overview: API health, setup actions, and workflow links.
- Chat: grounded question form with streaming answer text, final citations/refusal metadata, confidence, and retrieved chunks. If streaming fails, the page falls back to the stable non-streaming `POST /chat` path.
- Query Logs: recent logs plus detail views for answers, citations, retrieval, latency, and refusal status.
- Eval Runs: baseline eval trigger, run history, aggregate metrics, eval trend summaries, and per-case results.

Dashboard actions are user-triggered. The app does not ingest docs, embed chunks, or run evals automatically on page load.

For portfolio capture guidance, see the screenshot checklist in [docs/screenshots.md](docs/screenshots.md).

## Generated-Style Web API Client

The web app wraps a checked-in generated-style client at `apps/web/lib/api-client.generated.ts`. It keeps dashboard API calls typed without adding a heavy generator dependency to CI.

To validate the client against the local OpenAPI document when the API is running:

```bash
cd apps/web
npm run generate:api-client
```

If `http://localhost:3001/docs-json` is unavailable, the script keeps the checked-in client unchanged. This is intentional so local development and CI do not require external services or API keys.

## Streaming Chat

`POST /chat` remains the stable non-streaming endpoint and keeps the existing response shape. Use it for simple integrations, tests, and fallback behavior.

`POST /chat/stream` returns server-sent events. The deterministic provider streams a CI-safe fallback by chunking the final deterministic answer. When Groq is configured through `LLM_PROVIDER=groq` and local Groq credentials, the same streaming endpoint can be used without making Groq required for CI.

The stream sends incremental answer text and then a final completion event with the final chat response plus confidence and retrieved chunk metadata. Answered responses include citations; refusals include refusal metadata and no citations, matching the normal chat contract.

## Evaluation

The project includes a persisted baseline eval workflow for checking RAG behavior over known support cases. Eval runs track aggregate and per-case signals such as:

- Retrieval quality
- Answer quality
- Citation faithfulness
- Refusal behavior
- Latency metadata

The deterministic provider keeps evals repeatable and CI-safe. Groq can be enabled locally for experimentation, but it is optional and not required for the default demo or tests.

Recent eval runs are also summarized in the dashboard with total, passed, and failed cases plus refusal, citation, and answer-match accuracy trends. If there are no eval runs yet, run the baseline eval from the dashboard or call `POST /evals/run-baseline`.

## Troubleshooting

- **API unavailable:** Check `http://localhost:3001/health`, confirm the API process or Compose service is running, and verify `NEXT_PUBLIC_API_BASE_URL` / `API_BASE_URL`.
- **Streaming unsupported or unavailable:** Use the dashboard fallback or call `POST /chat`. The deterministic provider is safe for local/CI streaming; provider-specific streaming behavior depends on local configuration and should remain optional.
- **No eval runs yet:** Run the baseline eval from the dashboard or call `POST /evals/run-baseline`.
- **Generated client out of date:** Start the API locally, then run `cd apps/web && npm run generate:api-client` to validate the checked-in client against OpenAPI.

## CI and Quality Gates

GitHub Actions validate the full-stack repository without requiring external API keys:

- API: install dependencies, generate Prisma client, apply migrations against a CI Postgres service, lint, test, and build.
- Web: install dependencies, lint, and build with `NEXT_PUBLIC_API_BASE_URL` configured.
- Docker config: run static checks for the Compose services, expected host ports, deterministic API provider defaults, and web API base URL wiring without requiring a Docker daemon.

## Portfolio Highlights

- Full-stack AI product surface: API, database, retrieval layer, evaluation workflow, and dashboard.
- Grounding-first behavior: answers are tied to retrieved support docs and citations instead of open-ended chatbot output.
- Operational observability: query logs capture retrieved context, answer metadata, latency, and refusal behavior for inspection.
- Evaluation discipline: persisted eval runs make quality measurable across retrieval, answer, citation, and refusal behavior.
- Production-minded local demo: Docker Compose starts the app stack with explicit migrations and safe default providers, without requiring secrets.

## Notes

- Roadmap and known limitations are documented in [docs/roadmap.md](docs/roadmap.md).
- Deployment readiness notes are documented in [docs/deployment.md](docs/deployment.md).
- Production deployment is not included.
- Authentication is not implemented.
- Real API keys and local secrets should stay out of git.
