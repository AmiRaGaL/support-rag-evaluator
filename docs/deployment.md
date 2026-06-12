# Deployment Readiness

This project is prepared for hosted deployment, but this repository does not include a completed production deployment. Treat this guide as a readiness checklist for deploying the full-stack app safely.

## Overview

The app has five deployment concerns:

- **API service:** NestJS API in `apps/api`. It serves health checks, OpenAPI docs, ingestion, retrieval, chat, query logs, and eval endpoints.
- **Web dashboard:** Next.js app in `apps/web`. It calls the API through `NEXT_PUBLIC_API_BASE_URL`.
- **Database:** PostgreSQL with the `pgvector` extension enabled.
- **LLM provider:** `deterministic` is the default and requires no external key. `groq` is optional and requires a user-provided Groq API key.
- **Eval judge provider:** `deterministic` is the default. Optional Groq judge mode is explicit and also requires a user-provided Groq API key.
- **Embedding provider:** `deterministic` is the default and requires no external key. The optional OpenAI-compatible provider requires a server-side embedding API key.

Docker Compose is available for local full-stack demos with Postgres, API, and web services. Hosted production should use platform-managed configuration and secrets rather than local Docker-only values.

## API Environment

Required API environment variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string for the target environment. Do not use the local Docker Compose host/credentials for hosted production. |
| `PORT` | Yes | API port. The local default is `3001`; hosted platforms may inject their own port. |
| `NODE_ENV` | Yes | Use `production` for hosted production. |
| `AUTH_ENABLED` | Recommended for public deployments | Defaults to `false`. Set to `true` before exposing protected API routes beyond local demos. |
| `API_AUTH_TOKEN` | Required when auth is enabled | Shared token for bearer/API-key auth. Store it in managed secrets. |
| `LLM_PROVIDER` | Yes | Use `deterministic` by default. Set to `groq` only when a Groq key is configured. |
| `GROQ_API_KEY` | Only for Groq | Required when `LLM_PROVIDER=groq` or `EVAL_JUDGE_PROVIDER=groq`. Store it in managed secrets. |
| `GROQ_CHAT_MODEL` | Optional | Used only with Groq when overriding the provider or judge default. |
| `GROQ_BASE_URL` | Optional | OpenAI-compatible Groq base URL override. |
| `EVAL_JUDGE_PROVIDER` | Optional | Defaults to `deterministic`. Set to `groq` only when LLM-as-judge evals are intentionally enabled. |
| `EMBEDDING_PROVIDER` | Optional | Defaults to `deterministic`. Set to `openai` only when real embeddings are intentionally enabled. |
| `EMBEDDING_API_KEY` | Only for OpenAI embeddings | Required when `EMBEDDING_PROVIDER=openai`. Store it in managed secrets. |
| `EMBEDDING_MODEL` | Optional | Used only with the real embedding provider when overriding the provider default. |
| `EMBEDDING_DIMENSIONS` | Optional | Must match the pgvector column dimension, currently `1536`. |
| `EMBEDDING_BASE_URL` | Optional | OpenAI-compatible embedding base URL override, if needed. |

## Web Environment

Required web environment variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Public browser-facing API base URL, for example `https://api.example.com`. |
| `API_AUTH_TOKEN` | Required when API auth is enabled and using the web proxy | Server-side token the dashboard proxy forwards to the API. Store it in managed secrets. |
| `NEXT_PUBLIC_API_AUTH_TOKEN` | Local/demo only | Browser-visible token fallback. Do not use for real secrets. |

For containerized server-side proxying, `API_BASE_URL` may also be used by the web runtime, but the required hosted web setting is `NEXT_PUBLIC_API_BASE_URL`.

## Hosting Notes

### Vercel-Style Web Hosting

- Deploy `apps/web` as the Next.js project root.
- Set `NEXT_PUBLIC_API_BASE_URL` to the hosted API URL.
- If API auth is enabled, set `API_AUTH_TOKEN` in the web hosting environment so dashboard proxy requests include the token server-side.
- Build with `npm ci` and `npm run build`.
- Confirm dashboard pages can reach `/health` through the configured API base URL.

### Render, Railway, or Fly-Style API Hosting

- Deploy the API Docker image with the repository root as the build context and `apps/api/Dockerfile` as the Dockerfile path. The API image copies root-level `datasets` into `/app/datasets` for sample document ingestion and baseline evals.
- Provide `DATABASE_URL`, `PORT`, `NODE_ENV=production`, `AUTH_ENABLED=true`, `API_AUTH_TOKEN`, and `LLM_PROVIDER=deterministic` unless Groq is intentionally enabled.
- Run `npm ci`, `npx prisma generate`, and `npm run build` as part of the build.
- Run Prisma migrations explicitly before serving production traffic.
- Confirm embedding dimensions match the deployed pgvector schema before embedding documents.

### Managed Postgres

- Use managed PostgreSQL with `pgvector` support.
- Enable the `pgvector` extension before applying migrations if the provider does not do so automatically.
- Keep database credentials in managed secrets.

### Manual Production Migrations

Production Prisma migrations can be run from GitHub Actions when a Render shell is not available. Configure a repository or environment secret named `SUPABASE_DATABASE_URL` with the production Supabase Postgres connection string, then manually run the **Deploy production migrations** workflow from the GitHub Actions tab.

The workflow is triggered only with `workflow_dispatch`, runs from `apps/api`, and executes:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
```

Do not use `prisma migrate dev` or `prisma migrate reset` against production. The workflow does not echo `DATABASE_URL`; keep database credentials in GitHub Actions secrets and avoid pasting them into logs, issues, screenshots, or docs.

## Database Notes

- PostgreSQL is required.
- The `pgvector` extension is required for document chunk embeddings and vector search.
- Prisma migrations must be run explicitly.
- Do not use the local Docker Compose `DATABASE_URL` in hosted production.
- Back up production data before applying migrations.
- Changing embedding providers or dimensions generally requires re-embedding stored document chunks.

## Production Readiness Checklist

- Configure API environment variables.
- Configure web environment variables.
- Enable `AUTH_ENABLED=true` and configure `API_AUTH_TOKEN` before exposing protected API/dashboard workflows.
- Provision PostgreSQL with `pgvector`.
- Run Prisma migrations.
- Configure the web dashboard with the hosted API URL.
- Verify `GET /health`.
- Verify `GET /docs`.
- Ingest support documents.
- Embed documents.
- Confirm retrieval search returns expected chunks before enabling chat traffic.
- Test `POST /chat` with supported and unsupported questions.
- Inspect query logs for retrieval, citations, refusal status, and latency.
- Run the baseline eval and review persisted eval results.

## Security Checklist

- Do not commit `.env` files.
- Do not expose API keys in client-side code, logs, screenshots, or commits.
- Enable the optional token auth guard before public production use.
- Store auth tokens, database credentials, and provider API keys in managed secrets.
- Restrict CORS before public production use if cross-origin access is enabled.
- Rotate leaked keys immediately.
- Use managed secrets in hosted environments.

## Troubleshooting

- **401 unauthorized:** Confirm `AUTH_ENABLED=true` is intentional and that callers send `Authorization: Bearer <API_AUTH_TOKEN>` or `x-api-key`. `GET /health` and `/docs` should remain public in the current setup.
- **Dashboard token missing:** Set `API_AUTH_TOKEN` in the web runtime so the Next.js proxy can forward it server-side. Use `NEXT_PUBLIC_API_AUTH_TOKEN` only for local/demo scenarios because it is browser-visible.
- **Judge mode missing API key:** `GROQ_API_KEY` is required only when `EVAL_JUDGE_PROVIDER=groq`. Use `EVAL_JUDGE_PROVIDER=deterministic` for CI-safe deployments.
- **Invalid judge output:** Judge JSON is validated. Invalid output is persisted as a failed judge result with a clear reason; switch back to deterministic judge mode if a real provider is unreliable.
- **CI accidentally configured with a real provider:** Keep `LLM_PROVIDER`, `EMBEDDING_PROVIDER`, and `EVAL_JUDGE_PROVIDER` deterministic in default CI. External-provider CI should be a separate, explicitly secret-backed workflow.

## Limitations

- Optional token auth is implemented, but full user management, OAuth, roles, and sessions are not.
- Cloud deployment configuration is not included.
- Deterministic embeddings and the deterministic LLM provider are intended for local, demo, test, and CI-safe behavior.
- Optional Groq support requires a user-provided `GROQ_API_KEY`.
- Optional real embedding support requires a user-provided server-side embedding API key.
