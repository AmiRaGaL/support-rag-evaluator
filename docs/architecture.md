# Architecture

## Goal

Build an eval-driven RAG support assistant that can answer product-support questions using only indexed documentation.

## High-level flow

```text
User question
  -> API receives question
  -> Query is embedded
  -> Top-k chunks are retrieved from pgvector
  -> Context is assembled
  -> LLM generates grounded answer
  -> Citation validator checks source support
  -> Answer, citations, refusal flag, latency, and cost are logged
```
## Main Components

- Document ingestion service
- Chunking service
- Embedding provider interface
- Vector retrieval service
- Chat orchestration service
- Citation validation service
- Evaluation runner
- Query logging service