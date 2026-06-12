# Release Checklist

Use this checklist before tagging or presenting a release candidate. The default release path should remain deterministic and external-key-free.

## Static Checks

- [ ] Run API lint from `apps/api`: `npm run lint`.
- [ ] Run API tests from `apps/api`: `npm run test`.
- [ ] Run API build from `apps/api`: `npm run build`.
- [ ] Run web lint from `apps/web`: `npm run lint`.
- [ ] Run web build from `apps/web`: `npm run build`.
- [ ] Confirm CI defaults do not require `GROQ_API_KEY`, `EMBEDDING_API_KEY`, or judge-provider keys.

## Full-Stack Smoke Test

- [ ] Start the full stack from the repository root: `docker compose up --build -d`.
- [ ] Run migrations explicitly: `docker compose --profile tools run --rm api-migrate`.
- [ ] Open the dashboard at `http://localhost:3000`.
- [ ] Verify API health at `http://localhost:3001/health`.
- [ ] Ingest sample docs from the dashboard or `POST /ingestion/sample-docs`.
- [ ] Embed missing chunks from the dashboard or `POST /retrieval/embed-missing`.
- [ ] Test regular chat with `Can I export billing history?`.
- [ ] Test streaming chat from the dashboard Chat page.
- [ ] Test refusal behavior with an unsupported question such as `How do I configure SSO?`.
- [ ] Inspect Query Logs for retrieval metadata, citations, refusal state, and latency.
- [ ] Run the baseline eval from the dashboard or `POST /evals/run-baseline`.
- [ ] Inspect Eval Runs analytics and the newest eval run detail.
- [ ] Verify OpenAPI docs at `http://localhost:3001/docs`.

## Optional Modes

- [ ] Verify optional auth mode locally with `AUTH_ENABLED=true` and a non-secret local `API_AUTH_TOKEN`.
- [ ] Confirm protected routes reject missing or wrong tokens.
- [ ] Confirm the dashboard proxy works when `API_AUTH_TOKEN` is set in the web runtime.
- [ ] Keep Groq, OpenAI-compatible embeddings, and Groq judge mode disabled unless intentionally testing them with local secrets outside git.

## Release Hygiene

- [ ] Confirm `.env.example` files contain safe defaults and no real secrets.
- [ ] Confirm Docker Compose exposes web on `3000`, API on `3001`, and Postgres on host port `5433`.
- [ ] Confirm docs links for architecture, deployment, demo script, roadmap, screenshots, contributing, and development docs work.
- [ ] Verify screenshots and docs do not expose API keys, auth tokens, local `.env` files, browser autofill, or real customer data.
- [ ] Stop the demo stack when finished: `docker compose down`.
