# Evaluation

Support RAG Evaluator is eval-driven: changes should be checked against retrieval quality, answer behavior, citation faithfulness, and refusal behavior instead of judged only by manual demos.

## Baseline Dataset

The baseline cases live in:

```text
datasets/evals/baseline.json
```

The dataset includes supported support questions and unsupported questions that should be refused.

## Eval Flow

Running the baseline eval:

1. Ingests the bundled sample support docs.
2. Embeds any missing chunks with the configured embedding provider.
3. Sends each eval case through the normal chat path.
4. Scores retrieval, answer matching, citation behavior, refusal behavior, and latency metadata.
5. Persists aggregate metrics and per-case results for dashboard inspection.

## Default Scoring

Deterministic scoring is the default and does not require external API keys. This keeps local development and CI repeatable.

Tracked signals include:

| Signal | Description |
| --- | --- |
| Retrieval quality | Whether expected sources appear in retrieved chunks. |
| Answer quality | Whether supported answers match expected answer text. |
| Citation faithfulness | Whether cited chunks support the answer. |
| Refusal behavior | Whether unsupported questions are refused. |
| Latency | Per-query response timing captured with query metadata. |

## Optional LLM-As-Judge

Set `EVAL_JUDGE_PROVIDER=groq` only when intentionally testing judge scoring with a local `GROQ_API_KEY`. CI and default local runs should use `EVAL_JUDGE_PROVIDER=deterministic`.

Judge output is validated before persistence. Invalid or malformed judge output fails closed as a failed eval case with a clear judge failure reason.

## Running Evals

From the dashboard, open Eval Runs and click **Run baseline eval**.

From the API, call:

```text
POST /evals/run-baseline
```

Review persisted results through:

```text
GET /evals/runs
GET /evals/runs/:id
```
