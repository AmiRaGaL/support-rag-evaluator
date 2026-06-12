# Project Summary

Support RAG Evaluator is a full-stack, eval-driven RAG support assistant. It answers from retrieved support documentation, returns citations for supported answers, refuses unsupported questions, logs retrieval and answer behavior, and stores evaluation runs for later inspection.

## Why It Exists

The project is built to demonstrate a production-minded AI support workflow rather than a generic chatbot. The core idea is that a support assistant should be grounded, inspectable, and measurable: it should only answer when retrieved documentation supports the answer, show what evidence it used, and make quality regressions visible through repeatable evals.

## System Architecture

The application is split into a NestJS API and a Next.js dashboard:

- **NestJS API (`apps/api`)** owns ingestion, embeddings, retrieval, chat, streaming chat, query logs, eval runs, optional auth, OpenAPI docs, and Prisma database access.
- **Next.js dashboard (`apps/web`)** provides setup actions, chat, query-log inspection, eval-run inspection, and lightweight eval analytics.
- **PostgreSQL with pgvector** stores documents, chunks, embeddings, query logs, retrieved chunk metadata, eval runs, and eval case results.
- **Docker Compose** runs a local full-stack demo with web on `3000`, API on `3001`, and Postgres exposed on host port `5433`.

## RAG Flow

The default workflow starts with bundled markdown support docs. The API ingests the docs, chunks them, generates deterministic embeddings by default, and stores vectors in pgvector. Chat requests embed the question, retrieve relevant chunks, build a grounded answer from retrieved context, attach citation metadata, and refuse questions that are not supported by the retrieved docs.

Both `POST /chat` and `POST /chat/stream` use the same grounding, citation, refusal, and logging path. The streaming endpoint emits answer text incrementally and finishes with the same final response metadata used by the dashboard.

## Eval-Driven Development

Baseline evals run supported and unsupported questions through the same application path used by normal chat requests. Eval runs are persisted with aggregate metrics and per-case results covering retrieval behavior, answer matching, citation behavior, refusal behavior, latency metadata, and optional judge metadata.

Deterministic eval scoring is the default so local development and CI remain repeatable and external-key-free. Optional LLM-as-judge scoring can be enabled with Groq when a user-managed key is configured outside git.

## Observability And Query Logs

Each chat request records the question, answer, provider, refusal state, confidence, latency, retrieved chunk count, citations, and retrieved chunk details. Query-log detail pages expose the evidence trail behind each answer, which makes retrieval misses, unsupported claims, and citation behavior easier to inspect.

## Dashboard Experience

The dashboard is designed as a working product surface rather than a static demo. It includes:

- Setup actions for ingesting sample docs and embedding missing chunks.
- Grounded chat with streaming answer text, citations, confidence, refusal metadata, and retrieved chunks.
- Query log list and detail pages.
- Eval run history, eval detail pages, and recent-run analytics.
- Friendly error handling for API availability and optional auth failures.

## CI, Docker, And Deployment Readiness

The repository includes API lint/test/build checks, web lint/build checks, static Docker configuration checks, Prisma migrations, OpenAPI docs, and Dockerfiles for the API and dashboard. Docker Compose provides a local full-stack demo with explicit migrations through the `api-migrate` tools profile.

Deployment readiness documentation is included, but no production deployment is claimed or bundled. Hosted environments are expected to provide managed configuration, managed secrets, a PostgreSQL database with pgvector, and explicit migration execution.

## Optional Providers And Auth

The default mode is deterministic for the LLM, embeddings, and eval judge. This keeps demos, tests, and CI stable without `GROQ_API_KEY`, `EMBEDDING_API_KEY`, or judge-provider keys.

Optional modes include:

- Groq chat completions for local LLM experimentation.
- OpenAI-compatible embeddings for real embedding experiments.
- Groq LLM-as-judge eval scoring.
- A simple shared-token auth guard for protected API/dashboard demo workflows.

These are intentionally configuration-gated. Real provider keys and auth tokens must be user-managed secrets and should never be committed.

## What This Demonstrates

- Backend architecture with small NestJS modules and testable services.
- TypeScript/NestJS API design with validation, DTOs, guards, OpenAPI docs, and Jest coverage.
- Prisma, PostgreSQL, and pgvector modeling for documents, vectors, query logs, and eval data.
- Full-stack development across a NestJS API and Next.js dashboard.
- AI/RAG engineering focused on retrieval, grounding, citations, refusals, and provider abstractions.
- Eval-driven quality measurement with persisted run history and dashboard analytics.
- CI and Docker readiness without requiring external AI provider keys.
- Documentation and product thinking around demo flows, deployment readiness, release checks, and limitations.

## Current Limitations

- No production deployment is included.
- Auth is simple shared-token protection only; there is no OAuth, user management, roles, sessions, or multi-user account system.
- The default corpus is a small bundled sample-doc dataset, not a production support knowledge base.
- Deterministic providers are the default for CI, tests, and demos, so real model behavior requires explicit provider configuration.
- External LLM, embedding, and judge providers require user-managed keys stored outside git.
