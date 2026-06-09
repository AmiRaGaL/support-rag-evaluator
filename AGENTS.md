## Project overview

This repository is an eval-driven RAG support assistant. The goal is to build a production-minded AI support system, not a generic chatbot.

The assistant should:

- Answer only from retrieved support documentation
- Include citations for supported answers
- Refuse unsupported questions
- Log retrieval, answer, latency, and evaluation metadata
- Include offline evaluation for retrieval quality, answer quality, citation faithfulness, and refusal behavior

## Engineering preferences

- Use TypeScript for application code.
- Prefer NestJS for the backend API.
- Prefer PostgreSQL with pgvector for vector search.
- Prefer Prisma for database access.
- Keep modules small and testable.
- Add tests with each meaningful feature.
- Avoid adding unnecessary dependencies.
- Use clear names over clever abstractions.
- Do not commit secrets or real API keys.
- Keep `.env.example` updated when environment variables are added.

## Commit style

Use small commits with conventional messages:

- chore:
- feat:
- fix:
- docs:
- test:
- refactor:
- ci:

## Review guidelines

When reviewing changes, focus on:

- Security issues
- Secret leakage
- Missing tests
- Incorrect RAG grounding
- Unsupported claims without citations
- Error handling
- Type safety
- Database migration correctness
- Overly broad or unnecessary abstractions