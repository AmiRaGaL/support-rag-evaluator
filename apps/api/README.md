# Support RAG Evaluator API

NestJS API for the Support RAG Evaluator project. It owns document ingestion, embeddings, retrieval, grounded chat, streaming chat, query logs, persisted eval runs, optional auth, and OpenAPI docs.

## Local Setup

Start Postgres from the repository root:

```bash
docker compose up -d postgres
```

Create `apps/api/.env` from `apps/api/.env.example`, then run:

```bash
npm install
npx prisma migrate dev
npm run start:dev
```

The API listens on `http://localhost:3001` by default.

## Common Commands

```bash
npm run lint
npm run test
npm run build
npm run start:dev
npm run prisma:migrate:deploy
```

## Runtime Defaults

- `LLM_PROVIDER=groq` outside `NODE_ENV=test`; `deterministic` in tests
- `EMBEDDING_PROVIDER=openai` outside `NODE_ENV=test`; `deterministic` in tests
- `EVAL_JUDGE_PROVIDER=deterministic`
- `AUTH_ENABLED=false`

App/demo defaults use real GenAI RAG and require `GROQ_API_KEY` plus `EMBEDDING_API_KEY`. Deterministic providers remain available for CI, tests, and offline fallback. Keys and auth tokens are local/runtime configuration and should never be committed.

## Useful Endpoints

- `GET /health`
- `GET /docs`
- `POST /ingestion/sample-docs`
- `POST /retrieval/embed-missing`
- `POST /chat`
- `POST /chat/stream`
- `GET /query-logs`
- `POST /evals/run-baseline`
