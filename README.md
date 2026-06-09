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
