# Architecture

Support RAG Evaluator is a full-stack, eval-driven support assistant. It is designed to show how a RAG product can stay grounded in support documentation, expose its behavior for inspection, and measure quality over time.

## System Components

- **Next.js dashboard (`apps/web`)**: Browser UI for setup actions, grounded chat, query logs, persisted eval runs, and eval trend summaries.
- **Generated-style web API client**: Checked-in typed client used by the dashboard wrapper, with a local validation script for the OpenAPI document.
- **NestJS API (`apps/api`)**: Backend application that owns ingestion, retrieval, chat orchestration, logging, eval execution, OpenAPI docs, and database access.
- **Optional API auth guard**: Global NestJS guard that can require a shared bearer/API token for protected API routes when `AUTH_ENABLED=true`.
- **Ingestion module**: Reads bundled markdown support docs, extracts titles/source keys, chunks content, and upserts documents/chunks.
- **Embeddings module**: Provides deterministic embeddings for local development, tests, and CI-safe retrieval behavior.
- **Retrieval module**: Embeds queries, searches stored chunk vectors with pgvector, and returns ranked support-document chunks.
- **Chat/RAG module**: Coordinates retrieval, grounded answer generation, streaming and non-streaming responses, citation metadata, refusal behavior, and query logging.
- **LLM provider abstraction**: Selects a deterministic provider by default or an optional Groq provider when configured.
- **Query logging**: Persists questions, answers, refusal state, provider, confidence, latency, retrieved chunks, and citation-use metadata.
- **Eval runner**: Runs the baseline eval dataset through the same ingestion, embedding, retrieval, and chat path used by the API.
- **Eval judge provider**: Optional judge layer for eval cases. The deterministic judge is default; Groq judge mode is explicit and config-gated.
- **Prisma/Postgres/pgvector**: Stores documents, chunks, embeddings, query logs, retrieved chunk records, eval runs, and eval case results.

## Architecture Diagram

```text
User
  |
  v
Next.js Dashboard (apps/web)
  |
  | HTTP / same-origin API proxy
  v
NestJS API (apps/api)
  |
  +--> Optional Auth Guard
  |
  +--> Ingestion Module --------+
  |                             |
  +--> Embeddings Module -------+--> Prisma --> PostgreSQL + pgvector
  |                             |       |
  +--> Retrieval Module --------+       +--> Document / DocumentChunk
  |                                     +--> RagQuery / RagRetrievedChunk
  +--> Chat / RAG Module --------------+--> EvalRun / EvalCaseResult
  |       |
  |       +--> LLM Provider Abstraction
  |              |
  |              +--> Deterministic provider (default)
  |              +--> Groq provider (optional)
  |
  +--> Query Logs
  |
  +--> Eval Runner
          |
          +--> Eval Judge Provider
                 |
                 +--> Deterministic judge (default)
                 +--> Groq judge (optional)
```

## Data Flows

### Optional Auth Guard

1. `AUTH_ENABLED=false` is the default, so requests continue through the API without a token for local demos, tests, and CI.
2. When `AUTH_ENABLED=true`, a global guard checks protected routes before controller handlers run.
3. The guard accepts either `Authorization: Bearer <token>` or `x-api-key`, matching the configured `API_AUTH_TOKEN`.
4. Missing or invalid tokens return `401 Unauthorized` without logging token values.
5. Routes marked public, currently `GET /health`, remain available without a token. Swagger docs at `/docs` are also registered as public documentation in the current setup.
6. This guard is simple token protection, not sessions, OAuth, roles, or full user management.

### Document Ingestion

1. The dashboard or API caller sends `POST /ingestion/sample-docs`.
2. The ingestion service reads markdown files from the bundled sample-docs dataset.
3. Each file is normalized into a document record with a title, source key, source path, source type, and content hash.
4. Markdown content is split into chunks with chunk indexes, content, token estimates, and metadata.
5. The documents service upserts the `Document` and replaces its `DocumentChunk` rows so ingestion is repeatable.

### Embedding Missing Chunks

1. The dashboard or API caller sends `POST /retrieval/embed-missing`.
2. The retrieval service finds `DocumentChunk` rows where `embedding IS NULL`.
3. The embeddings service generates deterministic vectors for each missing chunk.
4. The retrieval service stores vectors in the pgvector `embedding` column.
5. The endpoint returns the count of chunks embedded.

### Non-Streaming Chat Request

1. The dashboard or API caller sends `POST /chat` with a support question.
2. The chat service trims and validates the question.
3. The retrieval service embeds the question and searches pgvector for top matching chunks.
4. The LLM service asks the configured provider to generate a grounded answer from retrieved chunks.
5. If the provider cannot support the answer from retrieved context, the response is refused.
6. Answered responses include citation objects that identify the chunks used as support.
7. The chat service records the query log before returning the response.

`POST /chat` is the stable non-streaming endpoint and keeps the existing response shape.

### Streaming Chat Request

1. The dashboard sends `POST /chat/stream` through the same typed client wrapper and same-origin API proxy.
2. The API runs the same retrieval, answer-generation, refusal, citation, and query-log path used by `POST /chat`.
3. The endpoint emits server-sent `answer_delta` events for incremental answer text.
4. The deterministic provider uses a CI-safe fallback by chunking the final deterministic answer.
5. When Groq is configured locally, the streaming endpoint can be used with the Groq provider by chunking the final Groq answer; native Groq token streaming is not required for this phase.
6. The stream ends with a `complete` event containing the final chat response, confidence, and retrieved chunk metadata. The dashboard uses that final event to show citations, refusal metadata, confidence, and retrieved chunks.
7. If the dashboard cannot stream successfully, it falls back to the stable `POST /chat` endpoint.

### Query Logging

1. Chat requests are logged after answer generation.
2. `RagQuery` stores the question, answer, refusal flag, provider name, confidence, retrieved chunk count, and latency.
3. `RagRetrievedChunk` stores each retrieved chunk's document metadata, similarity score, and whether it was used as a citation.
4. Logging is best-effort: a logging failure is recorded by the API logger and should not break the chat response.
5. The dashboard reads logs through `GET /query-logs` and `GET /query-logs/:id`.

### Baseline Eval Run

1. The dashboard or API caller sends `POST /evals/run-baseline`.
2. The eval service reads `datasets/evals/baseline.json`.
3. The service ingests sample docs and embeds any missing chunks.
4. Each eval case is sent through the same chat service used by normal requests.
5. The scorer checks refusal behavior, citation correctness, and expected answer matching.
6. The eval judge provider adds judge metadata. The deterministic judge mirrors the stable scoring dimensions by default; Groq judge mode runs only when `EVAL_JUDGE_PROVIDER=groq`.
7. Judge output is validated for strict JSON fields: score, pass/fail, reasoning, groundedness, answer correctness, citation support, and refusal behavior.
8. Invalid judge output fails closed as a failed judge result with a clear reason.
9. Aggregate metrics and per-case results are persisted as `EvalRun` and `EvalCaseResult` rows, including judge metadata when present.
10. The dashboard reads eval history through `GET /evals/runs` and `GET /evals/runs/:id`.

### Eval Analytics Dashboard

1. The dashboard loads recent persisted eval runs through `GET /evals/runs`.
2. The web analytics helper shapes run history into totals, pass/fail counts, and weighted refusal, citation, and answer-match accuracy.
3. The Eval Runs page renders native chart-like summaries for pass-rate and accuracy trends without adding a heavy chart dependency.
4. Empty, loading, and error states are handled in the dashboard; no evals are created automatically on page load.

### Web API Client

1. Dashboard code imports a small wrapper from `apps/web/lib/api-client.ts`.
2. The wrapper delegates typed calls to the checked-in generated-style client in `apps/web/lib/api-client.generated.ts`.
3. `npm run generate:api-client` in `apps/web` validates expected paths against the local OpenAPI document when the API is running.
4. If the OpenAPI document is unavailable, the script keeps the checked-in client unchanged so CI remains deterministic.

## Provider Design

The API uses an LLM provider interface so answer generation can be swapped without changing the chat orchestration flow.

- **Deterministic provider**: Default provider when `LLM_PROVIDER` is unset or set to `deterministic`. It builds predictable grounded answers from retrieved chunks, supports refusal behavior, and requires no external API key. This keeps local development, tests, and CI stable.
- **Groq provider**: Optional provider when `LLM_PROVIDER=groq`. It uses Groq's OpenAI-compatible chat completions with `GROQ_API_KEY`, optional `GROQ_CHAT_MODEL`, and optional `GROQ_BASE_URL`. This is intended for local experimentation with real LLM responses and is not required for the default demo.

Secrets should stay in local environment files or runtime configuration and should not be committed.

## Why Query Logs And Evals Matter

Query logs make the RAG system inspectable. They show what the user asked, what the assistant answered, which chunks were retrieved, which chunks became citations, whether the assistant refused, which provider ran, and how long the request took. That makes debugging grounding failures much easier than treating the model response as a black box.

Eval runs make quality measurable. The baseline suite exercises supported and unsupported questions through the same application path as real chat requests, then stores metrics and per-case results. This helps recruiters and engineers see not only that the app works, but that it has a repeatable way to check retrieval quality, answer behavior, citation faithfulness, and refusal behavior as the project evolves.
