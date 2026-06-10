# Support RAG Evaluator

An eval-driven RAG support assistant that answers customer-support questions from product documentation with citations, refusal behavior, retrieval metrics, and offline evaluation runs.

This project demonstrates production-minded AI feature development:

- Document ingestion
- Chunking and embeddings
- Vector search
- Grounded answer generation
- Source citations
- Unsupported-question refusal behavior
- Query logging
- Retrieval and answer-quality evaluation
- Latency and cost tracking

## Project status

Early scaffold. Building in small, reviewable commits.

## Local development

### Start local services

```bash
docker compose up -d
```

Docker Compose starts PostgreSQL with pgvector using the `pgvector/pgvector:pg16`
image. The database is exposed on `localhost:5433`.

For local API development, create `apps/api/.env` with:

```bash
DATABASE_URL="postgresql://support_rag_user:support_rag_password@localhost:5433/support_rag_dev?schema=public"
```

Do not commit local `.env` files.

### Apply database migrations

```bash
cd apps/api
npx prisma migrate dev
```

The Phase 2 migration enables pgvector with
`CREATE EXTENSION IF NOT EXISTS vector`, creates `Document` and
`DocumentChunk`, and stores optional embeddings as a nullable `vector(1536)`
column.

## Planned stack

- Backend: NestJS, TypeScript
- Database: PostgreSQL + pgvector
- ORM: Prisma
- Frontend: Next.js
- Testing: Jest, Supertest
- CI: GitHub Actions
- Deployment: Docker-first

## Planned architecture

```text
User
  -> Next.js chat UI
  -> NestJS API
  -> Retriever
  -> PostgreSQL + pgvector
  -> Context builder
  -> LLM answer generator
  -> Citation validator
  -> Response with sources
  -> Evaluation and logging tables
```

## Planned API

```text
POST /documents/ingest
POST /chat
GET /queries
POST /evals/run
```

## Evaluation goals

The assistant will be evaluated on:

- Retrieval recall@k
- Answer correctness
- Citation faithfulness
- Refusal accuracy
- Average latency
- Estimated cost

## API app

The backend API lives in:

```text
apps/api
```

Run locally:

```bash
cd apps/api
npm install
npx prisma migrate dev
npm run start:dev
```

Health check endpoint:

```bash
curl http://localhost:3001/health
```

### Local retrieval workflow

The current retrieval implementation uses a deterministic fake embedding
provider. It does not call OpenAI and does not require API keys. These routes
are simple developer/testing utilities while retrieval is being built out.

After starting PostgreSQL, applying migrations, and running the API, ingest the
sample support docs:

```bash
curl -X POST http://localhost:3001/ingestion/sample-docs
```

Generate embeddings for any chunks that do not have one yet:

```bash
curl -X POST http://localhost:3001/retrieval/embed-missing
```

Search embedded chunks:

```bash
curl "http://localhost:3001/retrieval/search?q=billing%20email&limit=5"
```

The same search is also available as JSON:

```bash
curl -X POST http://localhost:3001/retrieval/search \
  -H "Content-Type: application/json" \
  -d '{"query":"billing email","limit":5}'
```

### Local chat workflow

The `/chat` endpoint performs retrieval and then builds a deterministic,
grounded answer from retrieved chunks. It does not call an external LLM and
does not require API keys unless `LLM_PROVIDER=groq` is configured.

Before chatting, ingest documents and embed chunks:

```bash
curl -X POST http://localhost:3001/ingestion/sample-docs
curl -X POST http://localhost:3001/retrieval/embed-missing
```

Ask a supported question:

```bash
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"Can I export billing history?","limit":5}'
```

Successful responses include citation objects for the chunks used to build the
answer:

```json
{
  "status": "answered",
  "question": "Can I export billing history?",
  "answer": "According to the retrieved support documentation:\n1. ## Billing history Users can export billing history from Settings > Billing > Export History.",
  "citations": [
    {
      "chunkId": "chunk_id",
      "documentId": "document_id",
      "documentTitle": "Billing",
      "sourceKey": "billing",
      "chunkIndex": 0,
      "snippet": "## Billing history Users can export billing history from Settings > Billing > Export History."
    }
  ],
  "refusal": false,
  "confidence": 0.7,
  "retrievedChunks": [
    {
      "id": "chunk_id",
      "documentId": "document_id",
      "documentTitle": "Billing",
      "sourceKey": "billing",
      "sourcePath": "/absolute/path/to/datasets/sample-docs/billing.md",
      "chunkIndex": 0,
      "content": "## Billing history\n\nUsers can export billing history from Settings > Billing > Export History.",
      "tokenCount": 14,
      "metadata": null,
      "distance": 0.12,
      "score": 0.88
    }
  ],
  "retrievedChunkCount": 1
}
```

Unsupported questions are refused instead of answered:

```bash
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"Can I export audit logs?","limit":5}'
```

```json
{
  "status": "refused",
  "question": "Can I export audit logs?",
  "answer": "I found related documentation, but it does not contain enough matching support details to answer this question.",
  "citations": [],
  "refusal": true,
  "confidence": 0,
  "retrievedChunks": [
    {
      "id": "chunk_id",
      "documentId": "document_id",
      "documentTitle": "Billing",
      "sourceKey": "billing",
      "sourcePath": "/absolute/path/to/datasets/sample-docs/billing.md",
      "chunkIndex": 0,
      "content": "Customers can update billing settings from the billing page.",
      "tokenCount": 9,
      "metadata": null,
      "distance": 0.22,
      "score": 0.78
    }
  ],
  "refusalReason": "insufficient_overlap",
  "retrievedChunkCount": 1
}
```

### Optional Groq LLM provider

By default, chat uses the deterministic offline provider so tests and CI do not
need external API keys. To use Groq for OpenAI-compatible chat completions,
configure the API environment:

```bash
LLM_PROVIDER=groq
GROQ_API_KEY="gsk_..."
GROQ_CHAT_MODEL="llama-3.1-8b-instant"
```

`GROQ_BASE_URL` defaults to `https://api.groq.com/openai/v1`. Groq is only
constructed when `LLM_PROVIDER=groq`; leaving `LLM_PROVIDER` unset, or setting
it to `deterministic`, keeps the API fully offline after retrieval.

### Local baseline eval runner

The baseline eval runner uses `datasets/evals/baseline.json`, ingests the
sample support docs, embeds any missing chunks with the deterministic fake
embedding provider, and runs each eval case through the same `/chat` service
path. It does not call external LLM APIs and does not require API keys.

Before running evals, start PostgreSQL, apply migrations, and run the API:

```bash
docker compose up -d
cd apps/api
npx prisma migrate dev
npm run start:dev
```

Run the baseline eval suite:

```bash
curl -X POST http://localhost:3001/evals/run-baseline
```

The response includes aggregate metrics and per-case scores:

```json
{
  "dataset": "/absolute/path/to/datasets/evals/baseline.json",
  "metrics": {
    "totalCases": 3,
    "refusalAccuracy": 1,
    "citationAccuracy": 1,
    "answerMatchAccuracy": 1,
    "overallAccuracy": 1
  },
  "results": [
    {
      "id": "eval_001",
      "question": "How do I reset my password?",
      "type": "supported",
      "expectedSources": ["account-management"],
      "score": {
        "refusalCorrect": true,
        "citationCorrect": true,
        "answerMatch": true
      }
    }
  ]
}
```

## CI

Pull requests to `main` and pushes to `main` run the API CI workflow.

The workflow checks:

- Dependency installation with `npm ci`
- Prisma Client generation
- Database migrations against PostgreSQL + pgvector
- Linting
- Unit tests
- API build

Local database uses port `5433`, while CI uses port `5432` inside the GitHub Actions runner.
