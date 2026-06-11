# Roadmap And Limitations

Support RAG Evaluator is currently a portfolio-grade full-stack RAG evaluator. This roadmap separates completed capabilities from intentional future work.

## Completed

- **API scaffold:** NestJS application structure with validation, modular services, and test coverage.
- **Prisma/Postgres/pgvector:** Prisma models and migrations for documents, chunks, vectors, query logs, and eval runs.
- **Ingestion:** Markdown sample docs are read, normalized, chunked, and stored.
- **Retrieval:** Embedded chunks can be searched with pgvector similarity queries.
- **Grounded chat with citations:** Chat responses are generated from retrieved support chunks and include citation metadata when answered.
- **Deterministic and Groq LLM providers:** Deterministic provider is the default for local/CI-safe behavior; Groq is optional for real LLM experimentation.
- **Deterministic and real embedding providers:** Deterministic embeddings remain the default for local/CI-safe behavior; an optional OpenAI-compatible provider supports real embedding experiments.
- **Baseline evals:** A baseline eval dataset exercises supported and unsupported support questions.
- **Query logging:** Chat requests persist answer, refusal, provider, latency, retrieved chunk, and citation-use metadata.
- **Persisted eval runs:** Eval runs and per-case results are stored for later inspection.
- **OpenAPI docs:** Swagger UI documents the API workflows.
- **Next.js dashboard:** Dashboard supports setup actions, chat, query logs, and eval runs.
- **Generated-style web API client:** Dashboard calls are routed through a checked-in typed client with a local OpenAPI validation script.
- **Streaming chat:** `POST /chat/stream` streams answer text and final metadata while `POST /chat` remains the stable non-streaming endpoint.
- **Eval analytics:** Eval Runs includes recent-run summaries and lightweight native trend visuals.
- **Dockerized full-stack demo:** Docker Compose runs Postgres, the API, and the web dashboard with explicit migrations.

## Future Improvements

- **Auth:** Add user authentication and authorization for dashboard/API access.
- **Deployment:** Add production deployment infrastructure and environment-specific configuration.
- **Advanced eval metrics:** Expand beyond the current baseline scoring and dashboard trends with richer retrieval and answer-quality metrics.
- **Multi-tenant datasets:** Support multiple documentation collections or customer workspaces.
- **Production observability:** Add structured logs, metrics, tracing, alerts, and operational dashboards.

## Known Limitations

- The included content is a small sample dataset, not a production support corpus.
- Deterministic embeddings are intended for local/demo behavior and repeatable tests.
- Real embedding experiments require provider configuration, matching pgvector dimensions, and re-embedding documents when switching providers.
- Authentication is not implemented yet.
- Production deployment is not implemented yet.
- Streaming uses the deterministic fallback by default. Real provider behavior depends on local provider configuration and should not be required in CI.
