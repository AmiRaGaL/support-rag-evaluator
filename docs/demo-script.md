# Demo Script

Use this script for a 3-5 minute portfolio walkthrough of Support RAG Evaluator. The demo assumes the deterministic provider, which is the default and does not require API keys.

## 1. Project Intro

**Action:** Start with the project name and one-sentence purpose.

**Talking points:**

- Support RAG Evaluator is an eval-driven RAG support assistant.
- The goal is not a generic chatbot. It answers from support docs, returns citations, refuses unsupported questions, logs retrieval behavior, and persists eval runs.
- The project is packaged as a full-stack demo with a NestJS API, Next.js dashboard, Postgres, pgvector, Prisma, and Docker Compose.

## 2. Architecture Overview

**Action:** Open `docs/architecture.md` or summarize the flow.

**Talking points:**

- The dashboard calls the NestJS API for setup actions, chat, query logs, and eval runs.
- The API ingests markdown docs, chunks them, embeds chunks, retrieves with pgvector, and generates grounded answers through an LLM provider abstraction.
- Query logs and eval runs are first-class data models, so behavior can be inspected instead of treated as a black box.

```text
Next.js dashboard
  -> NestJS API
  -> ingestion / embeddings / retrieval / chat / evals
  -> Prisma
  -> PostgreSQL + pgvector
```

## 3. Start The Stack

**Action:** From the repository root, start the full local demo.

```bash
docker compose up --build -d
docker compose --profile tools run --rm api-migrate
```

**Talking points:**

- Docker Compose starts Postgres with pgvector, the API, and the web dashboard.
- Migrations are explicit so the database lifecycle is visible.
- The API defaults to `LLM_PROVIDER=deterministic`, so this demo does not need secrets or a network LLM call.

## 4. Open The Dashboard

**Action:** Open the dashboard.

```text
http://localhost:3000
```

**Talking points:**

- The dashboard is the portfolio surface for the RAG workflow.
- It includes setup actions, grounded chat, query-log inspection, eval-run inspection, and eval trend summaries.
- Actions are user-triggered; the dashboard does not ingest docs or run evals automatically on page load.

## 5. Check Health

**Action:** Use the dashboard health panel, or open the health endpoint.

```text
http://localhost:3001/health
```

**Talking points:**

- This confirms the dashboard can reach the API.
- The API is running on port `3001`; the dashboard is running on port `3000`.
- If health fails, the rest of the demo should pause for troubleshooting.

## 6. Ingest Sample Docs

**Action:** Click **Ingest sample docs** on the dashboard.

**Talking points:**

- The ingestion module reads bundled markdown support docs.
- Documents are normalized with titles, source keys, content hashes, and chunks.
- The sample corpus covers account management, billing, and troubleshooting.

## 7. Embed Missing Chunks

**Action:** Click **Embed missing chunks** on the dashboard.

**Talking points:**

- The retrieval module finds chunks with missing vectors and stores deterministic embeddings.
- pgvector powers similarity search over those chunk embeddings.
- Deterministic embeddings keep the local demo and CI behavior stable.

## 8. Ask A Grounded Support Question

**Action:** Open Chat and ask:

```text
Can I export billing history?
```

**Talking points:**

- The chat path embeds the question, retrieves relevant chunks, and asks the configured provider to answer only from retrieved context.
- The dashboard tries the streaming chat endpoint first so answer text appears incrementally, then falls back to the stable non-streaming chat endpoint if streaming is unavailable.
- This question is supported by the sample billing doc.
- The answer should mention exporting billing history from Settings > Billing > Export History.

## 9. Show Citations

**Action:** Point out the citation panel in the chat response.

**Talking points:**

- Citations identify the retrieved chunk used to support the answer.
- This is the core grounding behavior: the answer is connected back to a stored support document.
- Unsupported questions should be refused rather than answered without documentation.

## 10. Show Query Logs

**Action:** Open Query Logs, then open the latest query detail.

**Talking points:**

- Each chat request stores the question, answer, provider, refusal state, confidence, latency, and retrieved chunk count.
- Retrieved chunk records show document metadata, similarity, and whether a chunk was used as a citation.
- This is useful for debugging retrieval problems, citation behavior, and refusal behavior.

## 11. Run Baseline Eval

**Action:** Open Eval Runs and click **Run baseline eval**.

**Talking points:**

- The baseline eval uses the same ingestion, embedding, retrieval, and chat path as real requests.
- It checks supported and unsupported questions from a small dataset.
- The scorer records refusal correctness, citation correctness, and expected answer matching.

## 12. Show Persisted Eval Results

**Action:** Open the newest eval run detail.

**Talking points:**

- Eval runs are persisted, not just printed to the console.
- The dashboard shows aggregate metrics, recent-run trends, and per-case results.
- This makes quality visible over time and gives future changes a regression target.

## 13. Open OpenAPI Docs

**Action:** Open the API docs.

```text
http://localhost:3001/docs
```

**Talking points:**

- The API exposes Swagger UI for the core workflows.
- The documented endpoints include health, ingestion, retrieval, chat, query logs, and evals.
- This makes the backend easy to inspect independently from the dashboard.

## Example Demo Questions

These questions are supported by the bundled sample docs:

- `Can I export billing history?`
- `Where can users view billing information?`
- `How can a user reset their password?`
- `Where can users update their profile information?`
- `What should a user check first if they cannot log in?`
- `What file format is used for billing history exports?`

For refusal behavior, ask an unsupported question such as:

- `Can I export audit logs?`
- `How do I configure SSO?`

## Troubleshooting

- **API unavailable:** Confirm `docker compose ps` shows the API running, then check `http://localhost:3001/health`. If needed, review API logs with `docker compose logs api`.
- **Streaming unavailable:** Use the same question again; the dashboard keeps the non-streaming `POST /chat` path available as fallback. The deterministic provider remains the safest default for demos and CI.
- **No query logs yet:** Ask a chat question first. Query logs are created by the `/chat` flow.
- **No eval runs yet:** Click **Run baseline eval** from the dashboard, or call `POST /evals/run-baseline`.
- **Generated client out of date:** Start the API and run `cd apps/web && npm run generate:api-client` to validate the checked-in client against OpenAPI.
- **Missing embeddings:** Click **Embed missing chunks** after ingesting sample docs. Retrieval needs embedded chunks to return grounded context.
- **Groq env not configured:** Leave the default deterministic provider enabled. Only set `LLM_PROVIDER=groq` when a local `GROQ_API_KEY` is configured outside git.
